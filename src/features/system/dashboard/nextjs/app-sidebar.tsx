"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { User } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { OrganizationSwitcher } from "@/features/core/organizations/nextjs";
import { GENERAL_NAV_ITEMS, SYSTEM_NAV_ITEMS } from "./nav";
import { UserMenu } from "./user-menu";

type AppSidebarProps = {
  user: User;
  activeOrganizationId: string | null;
};

export function AppSidebar({ user, activeOrganizationId }: AppSidebarProps) {
  const pathname = usePathname() ?? "/";
  const { t, dir } = useTranslation();

  // Display gate only: the owner's routes re-check the flag server-side.
  const generalNavItems = GENERAL_NAV_ITEMS.filter(
    (item) => !item.platformOwnerOnly || user.isPlatformOwner,
  );

  // The item whose href is the longest prefix of the current path is the
  // active one. A plain prefix test would light up both "Students"
  // (/students) and "Groups" (/students/groups) on the groups page, since
  // the students area's sub-pages live under the students list's own path.
  const activeHref = [...SYSTEM_NAV_ITEMS, ...generalNavItems]
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  function isActive(href: string) {
    return href === activeHref;
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      side={dir === "rtl" ? "right" : "left"}
      dir={dir}
    >
      <SidebarHeader>
        <OrganizationSwitcher activeOrganizationId={activeOrganizationId} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SYSTEM_NAV_ITEMS.map(({ href, translationKey, Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={isActive(href)}
                    tooltip={t(translationKey)}
                    render={<Link href={href} />}
                  >
                    <Icon aria-hidden />
                    <span>{t(translationKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            {t("dashboard.nav.generalGroup")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalNavItems.map(({ href, translationKey, Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={isActive(href)}
                    tooltip={t(translationKey)}
                    render={<Link href={href} />}
                  >
                    <Icon aria-hidden />
                    <span>{t(translationKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
