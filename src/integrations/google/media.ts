/**
 * Deciding whether a URL that came out of the Google Forms API may be fetched.
 *
 * This matters more than it looks. The import copies images by asking *our
 * server* to fetch a URL supplied by an external API — a classic SSRF shape.
 * The host allowlist is what keeps that from being a request to an internal
 * address or a metadata endpoint, and it is pure so it can be tested without a
 * network.
 */

/**
 * Where Google actually serves form media from. `contentUri` lands on a
 * `googleusercontent.com` host; the rest are the buckets Drive-hosted form
 * media has been observed on.
 *
 * An exact suffix list rather than a regex on "google": `evil-google.com` and
 * `googleusercontent.com.attacker.net` both contain the word.
 */
const ALLOWED_HOST_SUFFIXES = [
  ".googleusercontent.com",
  ".google.com",
  ".gstatic.com",
] as const;

export function isFetchableGoogleMediaUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  // Plain http would let a network-level attacker swap the bytes for something
  // that is then served from our own trusted storage origin.
  if (parsed.protocol !== "https:") return false;

  // A username/password in the URL is never something Google sends, and it is
  // a known way to make a host look like one thing and resolve to another.
  if (parsed.username || parsed.password) return false;

  const host = parsed.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host.endsWith(suffix) && host.length > suffix.length,
  );
}
