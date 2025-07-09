import { env } from "./env";

// Application constants
export const APP_CONFIG = {
    name: 'Gateling TMS',
    description: 'A gateway to manage your online teaching business',
    url: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    email: 'info@gateling.com',
    phone: '201123862218',
} as const;

export const SYSTEM_FEATURES = [
    { key: "content_library", label: "Content Library", isFree: true },
    { key: "learning_flow", label: "Learning Flow", isFree: true },
    { key: "live_classes", label: "Live Classes", isFree: true },
    { key: "hr", label: "HR", isFree: false },
    { key: "course_store", label: "Course Store", isFree: false },
    { key: "crm", label: "CRM", isFree: false },
    { key: "smart_forms", label: "Smart Forms", isFree: false },
    { key: "community", label: "Community", isFree: false },
    { key: "support", label: "Support", isFree: false },
] as const;
