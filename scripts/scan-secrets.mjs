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
import { readFileSync, statSync } from "node:fs";

const PATTERNS = [
  { name: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "Google OAuth client secret", re: /\bGOCSPX-[0-9A-Za-z_-]{20,}/ },
  { name: "Slack token", re: /\bxox[abposr]-[0-9A-Za-z-]{10,}/ },
  { name: "GitHub token", re: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/ },
  { name: "Stripe secret key", re: /\bsk_(live|test)_[0-9A-Za-z]{16,}\b/ },
  { name: "OpenAI/Anthropic style key", re: /\bsk-(ant-)?[0-9A-Za-z_-]{32,}\b/ },
  { name: "JSON Web Token", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./ },
  { name: "Private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "Postgres URL with password", re: /postgres(ql)?:\/\/[^\s:@/]+:[^\s:@/]+@/ },
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

function isScannable(path) {
  if (IGNORED_PATHS.includes(path)) return false;
  if (IGNORED_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext))) {
    return false;
  }
  try {
    return statSync(path).size <= MAX_FILE_BYTES;
  } catch {
    return false;
  }
}

const findings = [];

for (const path of trackedFiles()) {
  if (!isScannable(path)) continue;

  let contents;
  try {
    contents = readFileSync(path, "utf8");
  } catch {
    continue;
  }

  contents.split(/\r?\n/).forEach((line, index) => {
    for (const { name, re } of PATTERNS) {
      if (re.test(line)) {
        findings.push({ path, line: index + 1, name, text: line.trim().slice(0, 120) });
      }
    }
  });
}

if (findings.length === 0) {
  console.log("scan:secrets — no known secret shapes found in tracked files.");
  process.exit(0);
}

console.error(`scan:secrets — ${findings.length} potential secret(s) found:\n`);
for (const finding of findings) {
  console.error(`  ${finding.path}:${finding.line}  [${finding.name}]`);
  console.error(`    ${finding.text}`);
}
console.error(
  "\nIf a match is a false positive, add the path to IGNORED_PATHS in scripts/scan-secrets.mjs with a reason.",
);
process.exit(1);
