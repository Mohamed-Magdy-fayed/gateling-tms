import type { NextConfig } from "next";

/**
 * Static security headers.
 *
 * Content-Security-Policy is deliberately **not** here — it carries a
 * per-request nonce and is set in `src/proxy.ts` (see
 * `src/integrations/security/csp.ts`). Everything below is request-independent,
 * so it belongs in the static header config where it also covers the routes the
 * proxy's matcher skips (`/api/*`, static assets).
 */
const securityHeaders = [
  {
    // Only meaningful over HTTPS, so it is inert on localhost and takes effect
    // on the deployed origins. `preload` is claimed on purpose: tms.gateling.com
    // is HTTPS-only via Vercel.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Stops a browser from second-guessing a Content-Type — an uploaded file
  // served as `image/png` must never be sniffed into something executable.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The legacy twin of the CSP's `frame-ancestors 'none'`, kept for browsers
  // and scanners that only read this one.
  { key: "X-Frame-Options", value: "DENY" },
  // Full URL to our own origin, origin-only when leaving it: outbound links
  // from a page like /learning-flow/trainees/<uuid> must not hand that id to
  // the destination.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app asks for none of these. Denying them outright means an injected
  // script can't ask on our behalf either.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Isolates any document this app opens from the opener, and vice versa.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Nothing gains from announcing the framework version to every request.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
