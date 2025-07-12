"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { LogoPrimary } from "@/components/general/logos"
import { useTranslation } from "@/i18n/useTranslation"
import { H3 } from "@/components/ui/typography"

export function SidebarLogo() {
    // const { data } = api.siteIdentity.getSiteIdentity.useQuery()
    const { t } = useTranslation()

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <Link href={'/'} className="flex items-center gap-1 justify-center w-full">
                    <SidebarMenuButton
                        tooltip={t("header.navigation.home")}
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                        <LogoPrimary className="!w-8 !h-8" />
                        {/* {data?.siteIdentity ? (
                            <>
                                <Image src={data?.siteIdentity.logoForeground} height={1000} width={1000} alt="Logo" className='w-8 rounded-full dark:hidden' />
                                <Image src={data?.siteIdentity.logoPrimary} height={1000} width={1000} alt="Logo" className='w-8 rounded-full hidden dark:block' />
                            </>
                        ) : (
                            <LogoPrimary className="w-8 h-8" />
                        )} */}
                        <H3 className="!text-lg !leading-none !font-extrabold text-primary">
                            {"Gateling"}
                        </H3>
                        <H3 className="!text-lg !leading-none !font-extrabold text-primary">
                            {"TMS"}
                        </H3>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
