import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger } from "@/components/ui/sidebar";
// import { SidebarLogo } from "@/components/pages/sidebar/sidebar-logo";
// import { SidebarUser } from "@/components/pages/sidebar/sidebar-user";
import { Separator } from "@/components/ui/separator";
// import { SidebarNavBreadCrumb } from "@/components/pages/sidebar/sidebar-nav-breadcrumb";
// import SidebarAdminMenu from "@/components/pages/sidebar/sidebar-admin-menu";
// import SidebarGeneralMenu from "@/components/pages/sidebar/sidebar-general-menu";
import { Suspense, type ReactNode } from "react";
import { getI18n } from "@/i18n/lib/get-translations";
import { SidebarLogo } from "@/features/system-layout/components/sidebar-logo";
import { SidebarUser } from "@/features/system-layout/components/sidebar-user";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import SidebarAdminMenu from "@/features/system-layout/components/sidebar-admin-menu";
import SidebarGeneralMenu from "@/features/system-layout/components/sidebar-general-menu";
import { DarkModeSwitcher } from "@/components/dark-mode-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";

export const allowedByDefault = ["/redirects"]

export default async function SystemLayout({ children, actions, params }: {
    children: ReactNode
    actions: ReactNode
    params: Promise<{ lang: string }>
}) {
    // useFCMToken()
    const { lang } = await params
    const { t, locale } = await getI18n(lang);
    const session = await auth();

    if (!session?.user) redirect(`/auth/signin`)

    // const session = await auth()

    // if (status === "loading" || !session.user) return (
    //     <div className="grid place-content-center w-screen h-screen">
    //         <Spinner />
    //     </div>
    // )

    // if (!hasPermission(session.user, "adminLayout", "view")) return <UnauthorizedAccess />
    // if (!hasPermission(session.user, "screens", "view", { url: pathname })
    //     && (!allowedByDefault.some(url => pathname.startsWith(url))
    //         && pathname !== "/admin")) return <UnauthorizedAccess />

    return (
        <Suspense>
            <Suspeneded locale={locale} t={t} actions={actions}>
                {children}
            </Suspeneded>
        </Suspense>
    )
};

function Suspeneded({ locale, children, t, actions }: {
    children: ReactNode
    actions: ReactNode
    locale: string
    t: Awaited<ReturnType<typeof getI18n>>["t"]
}) {
    return (
        <SidebarProvider>
            <Sidebar collapsible="icon" variant="inset" side={locale === "ar" ? "right" : "left"}>
                <SidebarHeader>
                    <SidebarUser />
                    <SidebarSeparator className="mx-0" />
                </SidebarHeader>
                <SidebarContent className="px-1">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarGroupLabel>{t("system.mainNavigation")}</SidebarGroupLabel>
                            <SidebarAdminMenu />
                        </SidebarGroupContent>
                    </SidebarGroup>
                    <SidebarGroup className="mt-auto">
                        <SidebarGroupContent>
                            <SidebarGroupLabel>{t("system.generalNavigation")}</SidebarGroupLabel>
                            <SidebarGeneralMenu />
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarSeparator className="mx-0" />
                    <SidebarLogo />
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
            <SidebarInset>
                <header className="flex items-center gap-2 p-4">
                    <SidebarTrigger className="ltr:-ml-1 rtl:-mr-1" />
                    <Separator orientation="vertical" className="ltr:mr-2 rtl:ml-2 h-4" />
                    {/* <SidebarNavBreadCrumb /> */}
                    <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-4">
                        <DarkModeSwitcher />
                        <LanguageSwitcher />
                        {actions}
                    </div>
                </header>
                <Separator />
                <div className="p-4" >
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
