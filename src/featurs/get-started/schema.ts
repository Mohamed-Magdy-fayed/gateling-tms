import { features } from "@/server/db/schema";
import z from "zod";

export const getStartedFormSchema = z.object({
    contactName: z.string().min(1, 'Contact name is required'),
    businessName: z.string().min(1, 'Business name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    currentWebsiteUrl: z.string().url().optional().or(z.literal('')),
    additionalNotes: z.string().optional(),
    features: z.array(z.enum(features)),
});

export type GetStartedFormData = z.infer<typeof getStartedFormSchema>;
