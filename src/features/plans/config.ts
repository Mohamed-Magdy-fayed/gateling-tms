import type { PlanConfig, SubscriptionPlan } from "@/services/paymob/schemas";

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
    free: {
        id: "free",
        name: "Starter",
        description: "Perfect for individual educators and small academies starting their digital journey",
        features: [
            "Content Library (Basic)",
            "Learning Flow (Core)",
            "Live Classes (Limited)",
            "Community Support",
            "Basic Analytics",
        ],
        limits: {
            activeStudents: 50,
            courses: 5,
            storage: 2, // GB
            liveClassParticipants: 10,
            liveClassDuration: 60, // minutes
        },
        pricing: {
            monthly: 0,
            yearly: 0,
        },
    },
    basic: {
        id: "basic",
        name: "Growth",
        description: "Essential business tools for growing academies ready to scale operations",
        features: [
            "Everything in Starter",
            "HR Management",
            "Course Store (Basic)",
            "Email Support",
            "Advanced Analytics",
            "Student Progress Tracking",
            "Basic Automation",
        ],
        limits: {
            activeStudents: 500,
            courses: 50,
            storage: 20, // GB
            liveClassParticipants: 50,
            liveClassDuration: 180, // minutes
        },
        pricing: {
            monthly: 299, // EGP (~$10 USD)
            yearly: 2990, // EGP (10 months price for 12 months)
        },
    },
    professional: {
        id: "professional",
        name: "Scale",
        description: "Comprehensive solution for established academies focused on growth and optimization",
        features: [
            "Everything in Growth",
            "CRM System (Advanced)",
            "Smart Forms & Automation",
            "Advanced Analytics & Reports",
            "Priority Support",
            "White-label Options",
            "API Access (Limited)",
            "Marketing Tools",
        ],
        limits: {
            activeStudents: 2000,
            courses: null, // unlimited
            storage: 100, // GB
            liveClassParticipants: 200,
            liveClassDuration: null, // unlimited
        },
        pricing: {
            monthly: 799, // EGP (~$26 USD)
            yearly: 7990, // EGP (10 months price for 12 months)
        },
        popular: true,
        badge: "Most Popular",
    },
    enterprise: {
        id: "enterprise",
        name: "Enterprise",
        description: "Custom solution for large institutions with advanced needs and dedicated support",
        features: [
            "Everything in Scale",
            "Community Platform",
            "Advanced Support System",
            "Dedicated Account Manager",
            "Custom Integrations",
            "Full API Access",
            "Advanced Security",
            "Custom Training",
            "SLA Guarantee",
        ],
        limits: {
            activeStudents: null, // unlimited
            courses: null, // unlimited
            storage: null, // unlimited
            liveClassParticipants: null, // unlimited
            liveClassDuration: null, // unlimited
        },
        pricing: {
            monthly: 1999, // EGP (~$65 USD)
            yearly: 19990, // EGP (10 months price for 12 months)
        },
        badge: "Enterprise",
    },
};

// Feature mapping to system features
export const FEATURE_MAPPING = {
    content_library: {
        free: "Basic content storage and organization",
        basic: "Enhanced content library with advanced search",
        professional: "Full content management with versioning",
        enterprise: "Enterprise content library with custom workflows",
    },
    learning_flow: {
        free: "Basic course creation and student progress",
        basic: "Advanced learning paths with prerequisites",
        professional: "Intelligent learning flows with AI recommendations",
        enterprise: "Custom learning flows with advanced analytics",
    },
    live_classes: {
        free: "Basic live sessions (10 participants, 1 hour)",
        basic: "Enhanced live classes (50 participants, 3 hours)",
        professional: "Professional live streaming (200 participants, unlimited)",
        enterprise: "Enterprise live platform with custom features",
    },
    hr: {
        free: null,
        basic: "Basic staff management and payroll integration",
        professional: "Advanced HR with performance tracking",
        enterprise: "Full HR suite with custom workflows",
    },
    course_store: {
        free: null,
        basic: "Basic course marketplace with payment processing",
        professional: "Advanced store with marketing tools",
        enterprise: "White-label marketplace with custom features",
    },
    crm: {
        free: null,
        basic: null,
        professional: "Advanced CRM with lead management and automation",
        enterprise: "Enterprise CRM with custom integrations",
    },
    smart_forms: {
        free: null,
        basic: null,
        professional: "Intelligent forms with workflow automation",
        enterprise: "Custom forms with advanced logic and integrations",
    },
    community: {
        free: null,
        basic: null,
        professional: null,
        enterprise: "Full community platform with social learning",
    },
    support: {
        free: "Community support",
        basic: "Email support (48h response)",
        professional: "Priority support (24h response) + chat",
        enterprise: "Dedicated support + account manager + SLA",
    },
};

// Pricing strategy rationale
export const PRICING_STRATEGY = {
    // Free tier: Loss leader to attract users and demonstrate value
    free: {
        purpose: "User acquisition and product demonstration",
        conversionTarget: "basic",
        limitations: "Designed to show value but create upgrade pressure",
    },

    // Basic tier: Entry point for paying customers
    basic: {
        purpose: "Convert free users and capture small-medium academies",
        conversionTarget: "professional",
        pricePoint: "Affordable for small businesses (~$10 USD)",
        valueProposition: "Essential business tools that save time and money",
    },

    // Professional tier: Primary revenue driver
    professional: {
        purpose: "Main revenue generator for established academies",
        conversionTarget: "enterprise",
        pricePoint: "Mid-market sweet spot (~$26 USD)",
        valueProposition: "Complete solution for growth-focused academies",
        positioning: "Most popular - best value for money",
    },

    // Enterprise tier: High-value customers
    enterprise: {
        purpose: "Capture large institutions and maximize revenue per customer",
        pricePoint: "Premium pricing for premium features (~$65 USD)",
        valueProposition: "Custom solution with dedicated support",
        positioning: "For serious institutions requiring advanced features",
    },
};

// Upgrade incentives and conversion tactics
export const CONVERSION_TACTICS = {
    freeToBasic: [
        "Student limit reached notification",
        "Course limit reached notification",
        "Storage limit reached notification",
        "Advanced analytics preview",
        "HR management feature highlight",
    ],
    basicToProfessional: [
        "CRM system preview with lead management",
        "Advanced automation showcase",
        "Priority support benefits",
        "Unlimited courses highlight",
        "White-label options preview",
    ],
    professionalToEnterprise: [
        "Community platform demonstration",
        "Dedicated account manager introduction",
        "Custom integration consultation",
        "Advanced security features",
        "SLA guarantee benefits",
    ],
};

// Market-specific considerations for Egypt
export const EGYPT_MARKET_ADAPTATIONS = {
    pricing: {
        currency: "EGP",
        paymentMethods: ["Credit Card", "Debit Card", "Fawry", "Vodafone Cash", "Bank Transfer"],
        annualDiscount: 0.167, // ~17% discount (2 months free)
        vatRate: 0.14, // 14% VAT in Egypt
    },
    localization: {
        languages: ["Arabic", "English"],
        timezone: "Africa/Cairo",
        businessHours: "9 AM - 5 PM (GMT+2)",
        supportLanguages: ["Arabic", "English"],
    },
    trust_building: {
        localSupport: true,
        arabicContent: true,
        localPaymentMethods: true,
        transparentPricing: true,
        freeTrialPeriod: 14, // days
    },
};

// Helper functions
export function getPlanConfig(plan: SubscriptionPlan): PlanConfig {
    return PLAN_CONFIGS[plan];
}

export function calculatePrice(plan: SubscriptionPlan, billingCycle: "monthly" | "yearly"): number {
    const config = getPlanConfig(plan);
    return config.pricing[billingCycle];
}

export function getUpgradeIncentives(currentPlan: SubscriptionPlan): string[] {
    switch (currentPlan) {
        case "free":
            return CONVERSION_TACTICS.freeToBasic;
        case "basic":
            return CONVERSION_TACTICS.basicToProfessional;
        case "professional":
            return CONVERSION_TACTICS.professionalToEnterprise;
        default:
            return [];
    }
}

export function getNextPlan(currentPlan: SubscriptionPlan): SubscriptionPlan | null {
    const planOrder: SubscriptionPlan[] = ["free", "basic", "professional", "enterprise"];
    const currentIndex = planOrder.indexOf(currentPlan);
    return currentIndex < planOrder.length - 1 ? planOrder[currentIndex + 1]! : null;
}

export function canDowngrade(fromPlan: SubscriptionPlan, toPlan: SubscriptionPlan): boolean {
    const planOrder: SubscriptionPlan[] = ["free", "basic", "professional", "enterprise"];
    const fromIndex = planOrder.indexOf(fromPlan);
    const toIndex = planOrder.indexOf(toPlan);
    return fromIndex > toIndex;
}

export function getFeatureAvailability(feature: keyof typeof FEATURE_MAPPING, plan: SubscriptionPlan): string | null {
    return FEATURE_MAPPING[feature][plan];
}
