import type { UserSchemaData } from "@/featurs/auth/users/schema";
import { db } from "@/server/db";
import { UsersTable } from "@/server/db/schema";
import { inArray } from "drizzle-orm";

export async function createUser(input: UserSchemaData[]) {
  return await db.insert(UsersTable).values(input).returning({ name: UsersTable.name, email: UsersTable.email });
}

export async function readUser(input?: string[]) {
  return db.select().from(UsersTable).where(input ? inArray(UsersTable.id, input) : undefined);
}

export async function updateUser({ ids, ...rest }: UserSchemaData & { ids: string[] }) {
  return db.update(UsersTable).set(rest).where(inArray(UsersTable.id, ids));
}

export async function deleteUser(input: string[]) {
  return db.delete(UsersTable).where(inArray(UsersTable.id, input));
}