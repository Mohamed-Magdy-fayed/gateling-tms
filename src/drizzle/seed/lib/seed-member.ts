import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  type OrganizationMembershipRole,
  OrganizationMembershipsTable,
  UserCredentialsTable,
  UsersTable,
} from "@/drizzle/schema";
import {
  generateSalt,
  hashPassword,
} from "@/features/core/auth/core/passwordHasher";
import { seedIfMissing } from "../base";
import { SEED_DEFAULT_PASSWORD, SEED_SYSTEM_ACTOR } from "../constants";

/**
 * Seeds one user + credentials + org membership, all additive-only/idempotent
 * (natural keys: email for the user, userId for credentials, the
 * organizationId/userId pair for the membership). Shared by every profile
 * that needs a signed-in account — extracted out of `baseline.ts` once
 * `demo`/`performance` needed the exact same three inserts.
 */
export async function seedMember({
  id,
  email,
  name,
  organizationId,
  role,
}: {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: OrganizationMembershipRole;
}) {
  const user = await seedIfMissing({
    label: `${role} user ${email}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(UsersTable)
        .where(eq(UsersTable.email, email))
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(UsersTable)
        .values({
          id,
          email,
          name,
          emailVerifiedAt: new Date(),
          createdBy: SEED_SYSTEM_ACTOR,
        })
        .returning();
      return row;
    },
  });

  await seedIfMissing({
    label: `credentials for ${email}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(UserCredentialsTable)
        .where(eq(UserCredentialsTable.userId, user.id))
        .limit(1);
      return row;
    },
    insert: async () => {
      const salt = generateSalt();
      const passwordHash = await hashPassword(SEED_DEFAULT_PASSWORD, salt);
      const [row] = await db
        .insert(UserCredentialsTable)
        .values({
          userId: user.id,
          passwordHash,
          passwordSalt: salt,
        })
        .returning();
      return row;
    },
  });

  await seedIfMissing({
    label: `membership of ${email} in org ${organizationId} as ${role}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(OrganizationMembershipsTable)
        .where(
          and(
            eq(OrganizationMembershipsTable.organizationId, organizationId),
            eq(OrganizationMembershipsTable.userId, user.id),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(OrganizationMembershipsTable)
        .values({ organizationId, userId: user.id, role })
        .returning();
      return row;
    },
  });

  return user;
}
