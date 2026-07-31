#!/usr/bin/env node
/**
 * Repository secret scan (phase-08.md step 5, "no secrets in repo").
 *
 * Deliberately dependency-free: `docs/rebuild/02-dependencies.md` is policy, and
 * a launch-checklist script is not a good reason to add a package. It walks the
 * tracked working tree — `.env*` files are gitignored, so anything this finds is
 * something that would actually ship.
 *
 * This is a net, not a proof. It catches the shapes that have actually leaked
 * out of projects (provider key prefixes, PEM blocks, long base64 assigned to a
 * key-looking name), not every possible secret. A clean run means "nothing of a
 * known shape", which is the honest claim to record in STATE.md.
 */

import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";

const PATTERNS = [
  { name: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "Google OAuth client secret", re: /\bGOCSPX-[0-9A-Za-z_-]{20,}/ },
  { name: "Slack token", re: /\bxox[abposr]-[0-9A-Za-z-]{10,}/ },
  { name: "GitHub token", re: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/ },
  { name: "Stripe secret key", re: /\bsk_(live|test)_[0-9A-Za-z]{16,}\b/ },
  {
    name: "OpenAI/Anthropic style key",
    re: /\bsk-(ant-)?[0-9A-Za-z_-]{32,}\b/,
  },
  {
    name: "JSON Web Token",
    re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,
  },
  { name: "Private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    name: "Postgres URL with password",
    re: /postgres(ql)?:\/\/[^\s:@/]+:[^\s:@/]+@/,
  },
  {
    name: "long secret-shaped assignment",
    re: /\b(secret|password|passwd|token|api[_-]?key|private[_-]?key)\b\s*[:=]\s*["'`][A-Za-z0-9+/_-]{32,}={0,2}["'`]/i,
  },
];

/**
 * Paths whose matches are expected and are not secrets. Kept short and
 * specific: a broad ignore list is how a real leak gets skipped.
 */
const IGNORED_PATHS = [
  // Documents the *shape* of these values so an operator knows what to paste.
  ".env.example",
  // This file is a list of secret patterns.
  "scripts/scan-secrets.mjs",
  // Lockfile integrity hashes are long base64 by nature.
  "package-lock.json",
];

/** Extensions with no plausible secret in them, skipped for speed. */
const IGNORED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".pdf",
];

const MAX_FILE_BYTES = 2 * 1024 * 1024;

function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
}

/**
 * Why a file wasn't scanned, or `null` when it was.
 *
 * `lstatSync`, not `statSync`: both `statSync` and `readFileSync` follow
 * symlinks, so a tracked symlink pointing outside the checkout would have this
 * script open — and potentially print — a file that isn't in the repository at
 * all. Symlinks are refused rather than followed.
 */
function skipReason(path) {
  if (IGNORED_PATHS.includes(path)) return "explicitly ignored";
  if (IGNORED_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext))) {
    return "binary extension";
  }

  let stats;
  try {
    stats = lstatSync(path);
  } catch (error) {
    return `could not stat (${error.code ?? "unknown"})`;
  }

  if (stats.isSymbolicLink()) return "symlink, not followed";
  if (!stats.isFile()) return "not a regular file";
  if (stats.size > MAX_FILE_BYTES) return "larger than 2 MiB";

  return null;
}

const findings = [];
const skipped = [];

for (const path of trackedFiles()) {
  const reason = skipReason(path);
  if (reason) {
    skipped.push({ path, reason });
    continue;
  }

  let contents;
  try {
    contents = readFileSync(path, "utf8");
  } catch (error) {
    skipped.push({
      path,
      reason: `could not read (${error.code ?? "unknown"})`,
    });
    continue;
  }

  contents.split(/\r?\n/).forEach((line, index) => {
    for (const { name, re } of PATTERNS) {
      // Only the location and the pattern name are kept. Printing the matching
      // line would put the credential itself into CI logs and build artifacts,
      // which is the thing this script exists to prevent.
      if (re.test(line)) findings.push({ path, line: index + 1, name });
    }
  });
}

// Reported, not silent: a skipped file is a file this run says nothing about,
// and "0 findings" would otherwise read as "nothing in the repo" when it means
// "nothing in the part of the repo I looked at".
if (skipped.length > 0) {
  console.log(`scan:secrets — ${skipped.length} file(s) not scanned:`);
  for (const entry of skipped) {
    console.log(`  ${entry.path} — ${entry.reason}`);
  }
  console.log("");
}

if (findings.length === 0) {
  console.log(
    `scan:secrets — no known secret shapes found in the ${
      trackedFiles().length - skipped.length
    } scanned file(s).`,
  );
  process.exit(0);
}

console.error(`scan:secrets — ${findings.length} potential secret(s) found:\n`);
for (const finding of findings) {
  console.error(`  ${finding.path}:${finding.line}  [${finding.name}]`);
}
console.error(
  "\nOpen each location and check it by hand — the matched text is deliberately not printed.\n" +
    "If a match is genuinely a false positive, add the path to IGNORED_PATHS in\n" +
    "scripts/scan-secrets.mjs with a reason, and note that it will then be listed as skipped.",
);
process.exit(1);
