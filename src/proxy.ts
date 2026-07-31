import { type NextRequest, NextResponse } from "next/server";
import {
  getUserSession,
  updateUserSessionExpiration,
} from "@/features/core/auth/core";
import {
  buildContentSecurityPolicy,
  createCspNonce,
} from "@/integrations/security/csp";

// (system) routes require a session AND an active organization. DONOR-B
// gates on a full screen-registry (`getProtectedScreenDefinitionByPathname`)
// that TARGET deliberately didn't port (STATE.md D42 — TMS has no global
// role/screen matrix). With only one real (system) page so far, an explicit
// allowlist of protected prefixes is the honest, non-speculative version of
// the same idea — extend it as new (system) pages land (Phase 3+).
// `/get-started` (the onboarding wizard, Phase 2 segment ④) and `/invite`
// (accepting an org invite) are deliberately absent from this list — both
// must be reachable by an authed user who doesn't have an org yet, since
// they're how that user gets one in the first place.
const PROTECTED_PATH_PREFIXES = [
  "/organizations",
  "/dashboard",
  "/content-library",
  "/assessments",
  "/learning-flow",
  "/live-classes",
  // The printable certificate lives outside the (system) route group so it can
  // render without the app shell (phase-05.md step 7) — it still names a real
  // trainee, so it is gated here like every other (system) page.
  "/certificates",
];

const AUTH_ROUTE_PREFIX = "/auth";

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const nonce = createCspNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy({
    nonce,
    isDevelopment: process.env.NODE_ENV === "development",
  });

  const response =
    (await middlewareAuth(request, nonce)) ?? nextWithNonce(request, nonce);

  // Set on the response whatever `middlewareAuth` returned — a redirect still
  // gets the policy, so there is no path out of here without one.
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  // request.cookies reflects what the browser actually sent (the session-id
  // cookie); response.cookies only reflects what's been explicitly set on
  // this response so far (nothing, at this point) — reading the session id
  // from response.cookies would always see nothing and silently no-op,
  // leaving the session to expire on its original 7-day TTL regardless of
  // activity. Read from the request, write the refreshed cookie to the
  // response that's actually returned to the browser.
  await updateUserSessionExpiration({
    get: (name) => request.cookies.get(name),
    set: (name, value, options) => {
      response.cookies.set(name, value, options);
    },
  });

  return response;
}

/**
 * Forwards the request with `x-nonce` attached, which is how the nonce reaches
 * the render: Next reads it out of the CSP header for its own bundles, and
 * `app/layout.tsx` reads this header for the tags it renders itself.
 */
function nextWithNonce(request: NextRequest, nonce: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

async function middlewareAuth(request: NextRequest, nonce: string) {
  const pathname = request.nextUrl.pathname;

  if (!startsWithAny(pathname, PROTECTED_PATH_PREFIXES)) {
    return nextWithNonce(request, nonce);
  }

  const session = await getUserSession(request.cookies);

  if (!session?.user) {
    const signInUrl = new URL(`${AUTH_ROUTE_PREFIX}/sign-in`, request.url);
    signInUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (!session.activeOrganizationId) {
    return NextResponse.redirect(new URL("/get-started", request.url));
  }

  return nextWithNonce(request, nonce);
}

export const config = {
  matcher: [
    "/((?!api(?:/|$))(?!_next(?:/|$))(?![^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
  ],
};
