import type { CourseFormData } from "@/features/content/schema";
import { db } from "@/server/db";
import { CoursesTable } from "@/server/db/schema";
import { inArray } from "drizzle-orm";

export async function createCourse(input: (CourseFormData & { organizationId: string })[]) {
    return await db.insert(CoursesTable).values(input).returning();
}

export async function readCourse(input?: string[]) {
    return db.select().from(CoursesTable).where(input ? inArray(CoursesTable.id, input) : undefined);
}

export async function updateCourse({ ids, ...rest }: Partial<CourseFormData> & { ids: string[] }) {
    return db.update(CoursesTable).set(rest).where(inArray(CoursesTable.id, ids)).returning();
}

export async function deleteCourse(input: string[]) {
    return db.delete(CoursesTable).where(inArray(CoursesTable.id, input));
}