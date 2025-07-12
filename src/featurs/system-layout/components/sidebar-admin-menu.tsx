"use client"

import { useMemo, type ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronRight } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuAction,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { useMainNavLinks } from "@/featurs/system-layout/data/sidebar-admin-data";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { hasPermission } from "@/server/permissions";
import { allowedByDefault } from "@/app/[lang]/(system)/layout";
import { useTranslation } from "@/i18n/useTranslation";
import WrapWithTooltip from "@/components/general/wrap-with-tooltip";

export default function SidebarAdminMenu({ className, ...props }: ComponentProps<"div">) {
    const pathname = usePathname();
    const { t } = useTranslation()
    const mainNavLinks = useMainNavLinks();
    const { data: session } = useSession();

    const allowedNavLinks = useMemo(
        () =>
            mainNavLinks
                .filter(
                    (link) =>
                        session?.user
                    // && hasPermission(session.user, "screens", "view", link)
                )
                .map((link) => ({
                    ...link,
                    children: link.children?.filter(
                        (ch) =>
                            session?.user
                        // && hasPermission(session.user, "screens", "view", ch)
                    ),
                })),
        [session?.user]
    );

    function renderSidebarItems(items: typeof allowedNavLinks, pathname: string) {
        return items
            .filter((navLink) => navLink.label !== t("nav.general"))
            .filter(
                (l) =>
                    session?.user
                // && (hasPermission(session.user, "screens", "view", { url: l.url })
                //     || !allowedByDefault.some((url) => l.url?.startsWith(url)))
            )
            .map((navLink) =>
                navLink.children && navLink.children.length ? (
                    <Collapsible
                        key={navLink.label + "Collapsible"}
                        defaultOpen={navLink.children.some(
                            (child) => child.url && pathname.startsWith(child.url)
                        )}
                    >
                        <CollapsibleTrigger
                            asChild
                            aria-activedescendant={
                                navLink.children.some(
                                    (child) => child.url && pathname.startsWith(child.url)
                                )
                                    ? "true"
                                    : "false"
                            }
                            className="w-full group group-data-[collapsible=icon]:hidden"
                        >
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip={navLink.label}
                                    size="sm"
                                    className="w-full flex items-center aria-[activedescendant=true]:bg-accent/60"
                                >
                                    {navLink.icon ? <navLink.icon /> : null}
                                    <WrapWithTooltip delay={2000} text={navLink.label}>
                                        <span className="text-left truncate">{navLink.label}</span>
                                    </WrapWithTooltip>
                                    <SidebarMenuAction asChild className="transition-transform duration-200 group-data-[state=open]:rotate-90 ml-auto">
                                        <ChevronRight />
                                    </SidebarMenuAction>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                            <SidebarMenuSub>
                                {navLink.children.map((subItem) => (
                                    <SidebarMenuSubItem key={subItem.url || subItem.label}>
                                        <SidebarMenuSubButton
                                            asChild
                                            aria-activedescendant={
                                                subItem.url && pathname.startsWith(subItem.url)
                                                    ? "true"
                                                    : "false"
                                            }
                                            className="aria-[activedescendant=true]:bg-accent/60"
                                        >
                                            {subItem.url ? (
                                                <Link href={subItem.url}>
                                                    {subItem.icon ? <subItem.icon /> : null}
                                                    <WrapWithTooltip delay={2000} text={subItem.label}>
                                                        <span className="text-xs truncate">{subItem.label}</span>
                                                    </WrapWithTooltip>
                                                </Link>
                                            ) : (
                                                <span>
                                                    <WrapWithTooltip delay={2000} text={subItem.label}>
                                                        <span className="text-xs truncate">{subItem.label}</span>
                                                    </WrapWithTooltip>
                                                </span>
                                            )}
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </Collapsible>
                ) : (
                    <SidebarMenuItem key={navLink.url || navLink.label}>
                        <SidebarMenuButton
                            asChild
                            tooltip={navLink.label}
                            size="sm"
                            aria-activedescendant={
                                navLink.url && pathname.startsWith(navLink.url)
                                    ? "true"
                                    : "false"
                            }
                            className="aria-[activedescendant=true]:bg-accent/60"
                        >
                            {navLink.url ? (
                                <Link href={navLink.url}>
                                    {navLink.icon ? <navLink.icon /> : null}
                                    <WrapWithTooltip delay={2000} text={navLink.label}>
                                        <span className="truncate">{navLink.label}</span>
                                    </WrapWithTooltip>
                                </Link>
                            ) : (
                                <span className="flex items-center">
                                    {navLink.icon ? <navLink.icon /> : null}
                                    <WrapWithTooltip delay={2000} text={navLink.label}>
                                        <span className="truncate">{navLink.label}</span>
                                    </WrapWithTooltip>
                                </span>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            );
    }

    function renderDropdownMenuForItem(navLink: typeof allowedNavLinks[number], pathname: string) {
        if (navLink.children && navLink.children.length) {
            return (
                <DropdownMenu key={navLink.label + "DropdownMenu"}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="sm" tooltip={navLink.label}>
                                {navLink.icon ? <navLink.icon size={20} /> : null}
                                <WrapWithTooltip delay={2000} text={navLink.label}>
                                    <span>{navLink.label}</span>
                                </WrapWithTooltip>
                                <SidebarMenuAction asChild className="transition-transform duration-200 ml-auto">
                                    <ChevronRight />
                                </SidebarMenuAction>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right">
                        <DropdownMenuGroup>
                            {navLink.children.map((subItem) => (
                                <DropdownMenuItem
                                    asChild
                                    key={subItem.url || subItem.label}
                                    aria-activedescendant={
                                        subItem.url && pathname.startsWith(subItem.url)
                                            ? "true"
                                            : "false"
                                    }
                                    className="aria-[activedescendant=true]:bg-accent/60"
                                >
                                    {subItem.url ? (
                                        <Link href={subItem.url}>
                                            {subItem.icon ? <subItem.icon size={20} /> : null}
                                            <WrapWithTooltip delay={2000} text={subItem.label}>
                                                <span>{subItem.label}</span>
                                            </WrapWithTooltip>
                                        </Link>
                                    ) : (
                                        <span>
                                            <WrapWithTooltip delay={2000} text={subItem.label}>
                                                <span>{subItem.label}</span>
                                            </WrapWithTooltip>
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        } else {
            return (
                <SidebarMenuItem key={navLink.url || navLink.label}>
                    <SidebarMenuButton
                        asChild
                        tooltip={navLink.label}
                        size="sm"
                        aria-activedescendant={
                            navLink.url && pathname.startsWith(navLink.url)
                                ? "true"
                                : "false"
                        }
                        className="aria-[activedescendant=true]:bg-accent/60"
                    >
                        {navLink.url ? (
                            <Link href={navLink.url}>
                                {navLink.icon ? <navLink.icon size={20} /> : null}
                                <WrapWithTooltip delay={2000} text={navLink.label}>
                                    <span>{navLink.label}</span>
                                </WrapWithTooltip>
                            </Link>
                        ) : (
                            <span className="flex items-center">
                                {navLink.icon ? <navLink.icon size={20} /> : null}
                                <WrapWithTooltip delay={2000} text={navLink.label}>
                                    <span>{navLink.label}</span>
                                </WrapWithTooltip>
                            </span>
                        )}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            );
        }
    }

    return (
        <div className={className} {...props}>
            <SidebarMenu>
                {/* Sidebar (Collapsible) */}
                <div className="group-data-[collapsible=icon]:hidden">
                    {renderSidebarItems(allowedNavLinks, pathname)}
                </div>
                {/* Dropdown (Collapsed/rail) */}
                <div className="hidden group-data-[collapsible=icon]:block">
                    {allowedNavLinks
                        .filter((navLink) => navLink.label !== t("nav.general"))
                        .map((item) => renderDropdownMenuForItem(item, pathname))}
                </div>
            </SidebarMenu>
        </div>
    );
}
