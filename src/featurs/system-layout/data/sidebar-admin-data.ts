import { useTranslation } from "@/i18n/useTranslation";
import {
    type LucideIcon,
    LayoutDashboardIcon,
    StickyNoteIcon,
    Users2Icon,
    ListChecksIcon,
    FileSearchIcon,
    CalendarClockIcon,
    FileStackIcon,
    ShieldCheckIcon,
    FileTextIcon,
    BookOpenIcon,
    LifeBuoyIcon,
} from "lucide-react";

export type NavLink = { label: string; url?: string; icon?: LucideIcon };

export const useMainNavLinks = (): (NavLink & { children?: NavLink[] })[] => {
    const { t } = useTranslation();

    return [
        {
            icon: LayoutDashboardIcon,
            label: t("nav.dashboard"),
            url: "/dashboard",
        },
        {
            icon: FileStackIcon,
            label: t("nav.contentManagement"),
            url: "/content-management",
        },
        // {
        //     icon: ClipboardListIcon,
        //     label: t("nav.operationsManagement"),
        //     children: [
        //         {
        //             icon: StickyNoteIcon,
        //             label: t("nav.notes"),
        //             url: "/admin/operations_management/notes",
        //         },
        //         {
        //             icon: Users2Icon,
        //             label: t("nav.groups"),
        //             url: "/admin/operations_management/groups",
        //         },
        //         {
        //             icon: ListChecksIcon,
        //             label: t("nav.traineeLists"),
        //             url: "/admin/operations_management/trainee_lists",
        //         },
        //         {
        //             icon: FileSearchIcon,
        //             label: t("nav.placementTests"),
        //             url: "/admin/operations_management/placement_tests",
        //         },
        //         {
        //             icon: CalendarClockIcon,
        //             label: t("nav.sessions"),
        //             url: "/admin/operations_management/sessions",
        //         },
        //     ],
        // },
        // {
        //     icon: TrendingUpIcon,
        //     label: t("nav.salesManagement"),
        //     children: [
        //         {
        //             icon: ReceiptIcon,
        //             label: t("nav.orders"),
        //             url: "/admin/sales_management/orders",
        //         },
        //         {
        //             icon: UserPlusIcon,
        //             label: t("nav.leads"),
        //             url: "/admin/sales_management/leads",
        //         },
        //     ],
        // },
        // {
        //     icon: UsersIcon,
        //     label: t("nav.usersManagement"),
        //     children: [
        //         {
        //             icon: GraduationCapIcon,
        //             label: t("nav.students"),
        //             url: "/admin/users_management/students",
        //         },
        //         {
        //             icon: UserCogIcon,
        //             label: t("nav.operationalTeam"),
        //             url: "/admin/users_management/ops_team",
        //         },
        //         {
        //             icon: CircuitBoardIcon,
        //             label: t("nav.educationalTeam"),
        //             url: "/admin/users_management/edu_team",
        //         },
        //         {
        //             icon: UserCircleIcon,
        //             label: t("nav.account"),
        //             url: "/admin/users_management/account",
        //         },
        //     ],
        // },
        // {
        //     icon: SlidersHorizontalIcon,
        //     label: t("nav.systemManagement"),
        //     children: [
        //         {
        //             icon: Settings2Icon,
        //             label: t("nav.configurations"),
        //             url: "/admin/system_management/config",
        //         },
        //         {
        //             icon: FileStackIcon,
        //             label: t("nav.contentManagement"),
        //             url: "/admin/system_management/content",
        //         },
        //         {
        //             icon: PackageOpenIcon,
        //             label: t("nav.productsManagement"),
        //             url: "/admin/system_management/products",
        //         },
        //     ],
        // },
        {
            label: t("nav.general"),
            children: [
                {
                    icon: ShieldCheckIcon,
                    label: t("nav.privacyPolicy"),
                    url: "/privacy",
                },
                {
                    icon: FileTextIcon,
                    label: t("nav.termsOfUse"),
                    url: "/terms",
                },
                {
                    icon: BookOpenIcon,
                    label: t("nav.documentation"),
                    url: "/documentation",
                },
                {
                    icon: LifeBuoyIcon,
                    label: t("nav.support"),
                    url: "/support",
                },
            ],
        },
    ];
};
