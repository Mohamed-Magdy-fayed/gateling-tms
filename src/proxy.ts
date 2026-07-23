import { type NextRequest, NextResponse } from "next/server";
import {
  getUserSession,
  updateUserSessionExpiration,
} from "@/features/core/auth/core";

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
const PROTECTED_PATH_PREFIXES = ["/demo", "/organizations"];

const AUTH_ROUTE_PREFIX = "/auth";

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const response = (await middlewareAuth(request)) ?? NextResponse.next();

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

async function middlewareAuth(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!startsWithAny(pathname, PROTECTED_PATH_PREFIXES)) {
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api(?:/|$))(?!_next(?:/|$))(?![^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
  ],
};
