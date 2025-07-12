"use client"

import { useState } from "react"
import {
    BellIcon,
    ChevronsUpDown,
    FilesIcon,
    ListChecksIcon,
    LogOut,
    User2Icon,
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { ScreenShareIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/i18n/useTranslation"
import { UserCard } from "@/featurs/system-layout/components/user-card"
// import { NotificationsSheet } from "@/components/general/notifications/notifications-sheet"

export function SidebarUser() {
    const { isMobile } = useSidebar()
    const { t } = useTranslation()

    // // Define menu items for each user role
    // const userRoleMenuItems = [
    //     {
    //         roles: ["Admin"] as const,
    //         items: [
    //             {
    //                 text: t("Leads"),
    //                 href: "/admin/sales_management/leads",
    //                 icon: ListChecksIcon,
    //             },
    //             {
    //                 text: t("Sessions"),
    //                 href: "/admin/operations_management/sessions",
    //                 icon: ScreenShareIcon,
    //             },
    //         ],
    //     },
    //     {
    //         roles: ["SalesAgent"] as const,
    //         items: [
    //             {
    //                 text: t("myleads"),
    //                 href: "/admin/sales_management/leads/my_leads",
    //                 icon: ListChecksIcon,
    //             },
    //         ],
    //     },
    //     {
    //         roles: ["Teacher"] as const,
    //         items: [
    //             {
    //                 text: t("mySessions"),
    //                 href: "/admin/users_management/edu_team/my_sessions",
    //                 icon: ScreenShareIcon,
    //             },
    //         ],
    //     },
    //     {
    //         roles: ["Tester"] as const,
    //         items: [
    //             {
    //                 text: t("myTasks"),
    //                 href: "/admin/users_management/edu_team/my_tasks",
    //                 icon: ListChecksIcon,
    //             },
    //         ],
    //     },
    //     {
    //         roles: ["Student"] as const,
    //         items: [
    //             {
    //                 text: t("myAccount"),
    //                 href: "/student/my_account",
    //                 icon: User2Icon,
    //             },
    //             {
    //                 text: t("myCourses"),
    //                 href: "/student/my_courses",
    //                 icon: FilesIcon,
    //             },
    //         ],
    //     },
    // ];

    const [isOpen, setIsOpen] = useState(false)

    const user = useSession().data?.user
    if (!user) return <Skeleton className="w-full h-12" />

    const userRoles = user.roles || []

    // // Helper to get menu items for current user roles
    // function getMenuItemsForRoles() {
    //     return userRoleMenuItems
    //         .find(roleGroup => roleGroup.roles.some(role => userRoles.includes(role)))?.items || []
    // }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                {/* <NotificationsSheet isOpen={isOpen} setIsOpen={setIsOpen} /> */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group/user-card data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <UserCard />
                            <ChevronsUpDown className="ltr:ml-auto rtl:mr-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <UserCard />
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuSeparator />
                        {/* <DropdownMenuGroup> */}
                            {/* Dynamic role-based items */}
                            {/* {getMenuItemsForRoles().map((item, idx) => (
                                <DropdownMenuItem asChild key={item.text + idx}>
                                    <Link href={item.href}>
                                        <item.icon className="mr-2 w-4 h-4" />
                                        {item.text}
                                    </Link>
                                </DropdownMenuItem>
                            ))} */}
                        {/* </DropdownMenuGroup> */}
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {/* Notes menu group */}
                            <DropdownMenuItem onClick={() => setTimeout(() => setIsOpen(true), 100)}>
                                <BellIcon className="mr-2 w-4 h-4" />
                                {t("sidebar.notifications")}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut({ callbackUrl: `/auth/signin` })}>
                            <LogOut />
                            {t("sidebar.logout")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
