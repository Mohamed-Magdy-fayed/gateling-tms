import { type NextRequest, NextResponse } from "next/server"
import { locales } from "./i18n/lib"

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    if (pathname.startsWith("/api")) return

    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (pathnameHasLocale) return

    const referer = req.headers.get("referer") || ""
    const refererLocale = locales.find((locale) =>
        referer.includes(`/${locale}/`) || referer.endsWith(`/${locale}`)
    )

    const locale = refererLocale || "en"

    req.nextUrl.pathname = `/${locale}${pathname}`

    return NextResponse.redirect(req.nextUrl)
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ],
}
