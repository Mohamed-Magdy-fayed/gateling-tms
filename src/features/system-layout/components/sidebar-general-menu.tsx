"use client"

import Link from "next/link";
import { Loader2Icon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useMainNavLinks } from "@/features/system-layout/data/sidebar-admin-data";
import { useTranslation } from "@/i18n/useTranslation";
import type { ComponentProps } from "react";

export default function SidebarGeneralMenu({ className, ...props }: ComponentProps<"div">) {
    const pathname = usePathname()
    const { t } = useTranslation()
    const mainNavLinks = useMainNavLinks();
    const generalLinks = mainNavLinks.find(navLink => navLink.label === t("nav.general"))?.children || [];

    return (
        <div className={className} {...props}>
            <SidebarMenu>
                {generalLinks.map(link => (
                    <SidebarMenuItem key={link.url || link.label}>
                        <SidebarMenuButton
                            tooltip={link.label}
                            asChild
                            size="sm"
                            aria-activedescendant={link.url && pathname.startsWith(link.url) ? "true" : "false"}
                            className="aria-[activedescendant=true]:bg-accent/60"
                        >
                            {link.url ? (
                                <Link href={link.url}>
                                    {link.icon ? <link.icon /> : <Loader2Icon />}
                                    <span>{link.label}</span>
                                </Link>
                            ) : (
                                <span className="flex items-center">
                                    {link.icon ? <link.icon /> : <Loader2Icon />}
                                    <span>{link.label}</span>
                                </span>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </div>
    );
}
