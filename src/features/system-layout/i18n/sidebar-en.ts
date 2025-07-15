import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    sidebar: {
        notifications: "Notifications",
        logout: "Logout"
    },
    nav: {
        dashboard: "Dashboard",
        operationsManagement: "Operations Management",
        notes: "Notes",
        groups: "Groups",
        traineeLists: "Trainee Lists",
        placementTests: "Placement Tests",
        sessions: "Sessions",
        salesManagement: "Sales Management",
        orders: "Orders",
        leads: "Leads",
        usersManagement: "Users Management",
        students: "Students",
        operationalTeam: "Operational Team",
        educationalTeam: "Educational Team",
        account: "Account",
        systemManagement: "System Management",
        configurations: "Configurations",
        contentManagement: "Content Management",
        productsManagement: "Products Management",
        general: "General",
        privacyPolicy: "Privacy Policy",
        termsOfUse: "Terms of Use",
        documentation: "Documentation",
        support: "Support"
    }
} as const satisfies LanguageMessages;
