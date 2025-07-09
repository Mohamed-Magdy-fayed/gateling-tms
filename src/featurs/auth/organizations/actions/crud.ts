import type { GetStartedFormData } from "@/featurs/get-started/schema";
import { db } from "@/server/db";
import { OrganizationsTable } from "@/server/db/schema";
import { inArray } from "drizzle-orm";

export async function createOrganization(input: GetStartedFormData[]) {
    return await db.insert(OrganizationsTable).values(input).returning({ id: OrganizationsTable.id, orgName: OrganizationsTable.businessName, email: OrganizationsTable.email });
}

export async function readOrganization(input?: string[]) {
    return db.select().from(OrganizationsTable).where(input ? inArray(OrganizationsTable.id, input) : undefined);
}

export async function updateOrganization({ ids, ...rest }: GetStartedFormData & { ids: string[] }) {
    return db.update(OrganizationsTable).set(rest).where(inArray(OrganizationsTable.id, ids));
}

export async function deleteOrganization(input: string[]) {
    return db.delete(OrganizationsTable).where(inArray(OrganizationsTable.id, input));
}