import { env } from "./env";

// Application constants
export const APP_CONFIG = {
    name: 'Gateling TMS',
    description: 'A gateway to manage your online teaching business',
    url: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    email: 'info@gateling.com',
    phone: '+20 (112) 386-2218',
} as const;