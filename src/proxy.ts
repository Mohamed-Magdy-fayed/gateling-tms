import { type NextRequest, NextResponse } from "next/server";

// Locale is read directly from the request cookie in the root layout server
// component (see src/features/core/i18n/server.ts) — nothing for this proxy
// to do there yet. Auth gating lands in Phase 2 (see
// docs/rebuild/phases/phase-02.md); DONOR-B's src/proxy.ts middlewareAuth()
// is the reference shape for that once sessions/permissions exist.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api(?:/|$))(?!_next(?:/|$))(?![^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
  ],
};
