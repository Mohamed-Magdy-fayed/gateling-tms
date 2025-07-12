import { CoursesTable } from "@/server/db/schema/content/courses-table";
import { UsersTable } from "@/server/db/schema/users-table";
import { createdAt, id, updatedAt } from "@/server/db/schemaHelpers";
import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable } from "drizzle-orm/pg-core";

export const features = [
    "content_library",
    "learning_flow",
    "live_classes",
    "hr",
    "course_store",
    "crm",
    "smart_forms",
    "community",
    "support"
] as const
export type feature = (typeof features)[number]
export const featuresEnum = pgEnum(
    "features",
    features
)

export const OrganizationsTable = pgTable(
    "organizations",
    (d) => ({
        id,
        contactName: d.varchar({ length: 256 }).notNull(),
        businessName: d.varchar({ length: 256 }).notNull(),
        email: d.varchar({ length: 256 }).notNull().unique(),
        phone: d.varchar({ length: 256 }),
        currentWebsiteUrl: d.varchar({ length: 256 }),
        additionalNotes: d.text(),
        features: featuresEnum().array().default([]),
        createdAt,
        updatedAt,
    }),
    (t) => [
        index("org_email_idx").on(t.email),
    ],
);

export const organizationRelations = relations(OrganizationsTable, ({ one, many }) => ({
    users: many(UsersTable),
    courses: many(CoursesTable,)
}))

