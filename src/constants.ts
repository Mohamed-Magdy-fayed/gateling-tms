import { link } from "fs";
import { env } from "./env";

// Application constants
export const APP_CONFIG = {
    name: 'Gateling TMS',
    description: 'A gateway to manage your online teaching business',
    url: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    email: 'info@gateling.com',
    phone: '201123862218',
    facebook: 'https://www.facebook.com/GatelingSolutions',
    youtube: 'https://www.youtube.com/@gatelingsolutions',
    linkedin: 'https://www.linkedin.com/in/mohamed-magdy-fayed/',
    instagram: 'https://www.instagram.com/gatelingsolutions/',
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

// Request statuses with display information
export const REQUEST_STATUSES = {
    new_request: {
        label: 'New Request',
        color: 'blue',
        description: 'Fresh submission from client form',
    },
    in_review: {
        label: 'In Review',
        color: 'yellow',
        description: 'Admin is reviewing the request and requirements',
    },
    needs_clarification: {
        label: 'Needs Clarification',
        color: 'orange',
        description: 'Waiting for additional information from client',
    },
    consultation_scheduled: {
        label: 'Consultation Scheduled',
        color: 'purple',
        description: 'Meeting/call scheduled with client',
    },
    quoted: {
        label: 'Quoted',
        color: 'indigo',
        description: 'Proposal/quote has been sent to client',
    },
    negotiating: {
        label: 'Negotiating',
        color: 'cyan',
        description: 'Back-and-forth on pricing or scope',
    },
    accepted: {
        label: 'Accepted',
        color: 'green',
        description: 'Client has accepted the proposal',
    },
    in_progress: {
        label: 'In Progress',
        color: 'emerald',
        description: 'Project is actively being worked on',
    },
    client_review: {
        label: 'Client Review',
        color: 'teal',
        description: 'Project completed, waiting for client approval',
    },
    completed: {
        label: 'Completed',
        color: 'green',
        description: 'Project finished and delivered',
    },
    on_hold: {
        label: 'On Hold',
        color: 'gray',
        description: 'Project paused',
    },
    cancelled: {
        label: 'Cancelled',
        color: 'red',
        description: 'Project cancelled',
    },
    archived: {
        label: 'Archived',
        color: 'slate',
        description: 'Old/completed requests moved to archive',
    },
} as const;

// Priority levels
export const PRIORITY_LEVELS = {
    low: {
        label: 'Low',
        color: 'gray',
        description: 'Budget <$5k, unclear requirements',
    },
    medium: {
        label: 'Medium',
        color: 'yellow',
        description: 'Budget $5k-$10k, good fit projects',
    },
    high: {
        label: 'High',
        color: 'red',
        description: 'Budget >$10k, referral clients, repeat clients',
    },
} as const;

// Form field options
export const FORM_OPTIONS = {
    yearsInBusiness: [
        'Startup',
        '1-2 years',
        '3-5 years',
        '5+ years',
    ],
    companySize: [
        'Solo',
        '2-10 employees',
        '11-50 employees',
        '50+ employees',
    ],
    reasonForNewWebsite: [
        'First website',
        'Redesign',
        'Rebrand',
        'Poor performance',
        'Outdated',
        'Other',
    ],
    primaryGoal: [
        'Generate leads',
        'Sell products online',
        'Provide information',
        'Build brand awareness',
        'Portfolio showcase',
        'Other',
    ],
    websiteType: [
        'Business/Corporate',
        'E-commerce',
        'Portfolio',
        'Blog',
        'Landing page',
        'Directory',
        'Membership',
        'Other',
    ],
    budgetRange: [
        'Under $2,000',
        '$2,000-$5,000',
        '$5,000-$10,000',
        '$10,000-$20,000',
        '$20,000+',
        'Prefer to discuss',
    ],
    timelineFlexibility: [
        'Fixed deadline',
        'Flexible',
        'ASAP',
        'Other',
    ],
    preferredCommunication: [
        'Email',
        'Phone',
        'Video calls',
        'Project management tool',
    ],
} as const;

// Essential features options
export const ESSENTIAL_FEATURES = [
    'Contact forms',
    'Online store/shopping cart',
    'Blog/news section',
    'Photo gallery',
    'Video integration',
    'Social media integration',
    'Newsletter signup',
    'Online booking/scheduling',
    'User registration/login',
    'Search functionality',
    'Multi-language support',
    'Live chat',
    'Payment processing',
    'Membership area',
    'Event calendar',
    'Testimonials section',
    'FAQ section',
] as const;

// Design style options
export const DESIGN_STYLES = [
    'Modern/minimalist',
    'Traditional/classic',
    'Bold/creative',
    'Professional/corporate',
    'Fun/playful',
    'Luxury/elegant',
] as const;

// Age range options
export const AGE_RANGES = [
    '18-25',
    '26-35',
    '36-45',
    '46-55',
    '55+',
] as const;

// Communication types
export const COMMUNICATION_TYPES = {
    email: {
        label: 'Email',
        icon: 'Mail',
    },
    phone: {
        label: 'Phone',
        icon: 'Phone',
    },
    meeting: {
        label: 'Meeting',
        icon: 'Calendar',
    },
    note: {
        label: 'Note',
        icon: 'FileText',
    },
} as const;

// Email templates
export const EMAIL_TEMPLATES = {
    REQUEST_RECEIVED: 'request_received',
    REQUEST_CLARIFICATION: 'request_clarification',
    CONSULTATION_SCHEDULED: 'consultation_scheduled',
    QUOTE_SENT: 'quote_sent',
    PROJECT_STARTED: 'project_started',
    PROJECT_UPDATE: 'project_update',
    PROJECT_COMPLETED: 'project_completed',
    ADMIN_NEW_REQUEST: 'admin_new_request',
} as const;

// Theme configuration
export const THEME_CONFIG = {
    defaultTheme: 'light' as 'light' | 'dark' | 'system',
    enableDarkMode: true,
    enableSystemTheme: true,
} as const;

// Internationalization configuration (for future use)
export const I18N_CONFIG = {
    defaultLocale: 'en',
    locales: ['en'], // Can be extended to ['en', 'ar', 'fr', 'es'] etc.
    enableMultiLanguage: false, // Set to true when implementing
} as const;

// Pagination defaults
export const PAGINATION = {
    defaultLimit: 10,
    maxLimit: 100,
} as const;

// File upload configuration
export const UPLOAD_CONFIG = {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;
