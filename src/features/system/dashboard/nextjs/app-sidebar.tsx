"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/drizzle/schema";
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

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <Sidebar collapsible="icon" variant="inset" side={dir === "rtl" ? "right" : "left"} dir={dir}>
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
          <SidebarGroupLabel>{t("dashboard.nav.generalGroup")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {GENERAL_NAV_ITEMS.map(({ href, translationKey, Icon }) => (
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
