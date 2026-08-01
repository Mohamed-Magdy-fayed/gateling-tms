/**
 * The app's Content-Security-Policy, built per request.
 *
 * Pure and dependency-free so the policy is unit-testable — `proxy.ts` is the
 * only caller, and a policy that can only be checked by loading a browser is a
 * policy nobody checks.
 */

/**
 * Remote hosts the browser is allowed to load images from.
 *
 * - `storage.googleapis.com` is where `integrations/firebase/storage.ts` writes
 *   uploads and where `file.publicUrl()` points (course thumbnails, lecture
 *   attachments, testimonial photos).
 * - `lh3.googleusercontent.com` serves the profile pictures Google hands back
 *   with an OAuth sign-in, which `users.imageUrl` stores verbatim.
 *
 * Listed explicitly rather than as a blanket `https:` so a future third-party
 * image host is a deliberate edit here, not something that silently works.
 */
const IMAGE_HOSTS = [
  "https://storage.googleapis.com",
  "https://lh3.googleusercontent.com",
  // YouTube's thumbnail host, for the poster frame of an embedded video block.
  "https://i.ytimg.com",
] as const;

/**
 * Hosts allowed to be framed. A form can carry a video block, which is a
 * YouTube embed and cannot be anything else: the mapper only ever writes a
 * `youtube-nocookie.com/embed/{id}` URL, with the id validated against
 * `^[\w-]{11}$`, and this directive is the second lock on that — an
 * `<iframe src>` written any other way is refused by the browser.
 *
 * `youtube-nocookie.com` rather than `youtube.com` because students are told
 * to open these pages for a class, and the no-cookie host sets no advertising
 * cookies. Listed explicitly rather than as a blanket `https:`, same as the
 * image hosts above.
 */
const FRAME_HOSTS = ["https://www.youtube-nocookie.com"] as const;

export type CspOptions = {
  nonce: string;
  /** `true` in `next dev`, which needs allowances production must not have. */
  isDevelopment: boolean;
};

/**
 * Directive choices worth stating, since the loose-looking ones are deliberate:
 *
 * - `script-src` is strict: nonce + `strict-dynamic`, no `unsafe-inline`. This
 *   is where code execution lives and where the protection actually matters.
 *   Next injects the nonce into its own framework and page bundles; `layout.tsx`
 *   passes it to the two JSON-LD tags and to next-themes' inline script.
 * - `style-src` keeps `'unsafe-inline'`. Base UI and Radix set inline `style`
 *   attributes on nearly every popover, dialog and tooltip for positioning, and
 *   a style *attribute* cannot carry a nonce — only `<style>` elements can. The
 *   alternative is `style-src-attr 'unsafe-inline'` alongside a nonce'd
 *   `style-src`, which is the same exposure written in two lines. Inline styles
 *   are not an execution vector once `script-src` is strict.
 * - `'unsafe-eval'` in development only: React uses `eval` to rebuild
 *   server-side error stacks in the browser. Production never gets it.
 * - `upgrade-insecure-requests` is production-only — it would break
 *   `http://localhost:3000`.
 * - `frame-ancestors 'none'` is the real clickjacking control; the
 *   `X-Frame-Options` header in `next.config.ts` is its legacy twin.
 */
export function buildContentSecurityPolicy({
  nonce,
  isDevelopment,
}: CspOptions): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    isDevelopment ? "'unsafe-eval'" : null,
  ].filter(Boolean);

  const directives: [string, string][] = [
    ["default-src", "'self'"],
    ["script-src", scriptSrc.join(" ")],
    ["style-src", "'self' 'unsafe-inline'"],
    ["img-src", `'self' data: blob: ${IMAGE_HOSTS.join(" ")}`],
    ["font-src", "'self'"],
    ["connect-src", "'self'"],
    ["frame-src", FRAME_HOSTS.join(" ")],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
  ];

  if (!isDevelopment) {
    directives.push(["upgrade-insecure-requests", ""]);
  }

  return directives
    .map(([name, value]) => (value ? `${name} ${value}` : name))
    .join("; ");
}

/**
 * A fresh, unguessable nonce per request — the whole point of a nonce is that
 * an injected script can't predict it, so this must never be cached, reused
 * across requests, or derived from anything about the request.
 */
export function createCspNonce(): string {
  return crypto.randomUUID().replaceAll("-", "");
}
