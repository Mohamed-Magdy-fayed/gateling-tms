import { userRoles, userStatuses } from "@/server/db/schema";
import z from "zod";

export const userSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    image: z.string().nullable(),
    emailVerified: z.date().nullable(),
    organizationId: z.string(),
    roles: z.array(z.enum(userRoles)),
    status: z.enum(userStatuses),
})

export type UserSchemaData = z.infer<typeof userSchema>;
