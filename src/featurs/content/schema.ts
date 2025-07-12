import z from "zod";

export const courseFormSchema = z.object({
    name: z.string().min(1, 'Contact name is required'),
    description: z.string().min(1, 'Business name is required'),
    image: z.string().nullable().optional(),
});

export type CourseFormData = z.infer<typeof courseFormSchema>;
