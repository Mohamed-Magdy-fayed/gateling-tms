import { eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  OrganizationMembershipsTable,
  OrganizationsTable,
  UsersTable,
} from "@/drizzle/schema";
import { mainTranslations } from "@/features/core/i18n/global";
import { createI18n } from "@/features/core/i18n/lib";
import {
  createCallerFactory,
  type TRPCContext,
} from "@/integrations/trpc/init";
import { appRouter } from "@/integrations/trpc/routers/_app";

const createCaller = createCallerFactory(appRouter);

export type TenantFixture = {
  organizationId: string;
  userId: string;
  email: string;
  caller: ReturnType<typeof createCaller>;
};

/**
 * A tRPC context built by hand rather than through `createTRPCContext`.
 *
 * `createTRPCContext` reads `next/headers`, which does not exist outside a
 * request. Everything it produces is reproducible here: `createI18n` is pure,
 * `db` is the same singleton, and the session is the plain object
 * `getUserSession` would have returned from Redis. The cookie store is a stub
 * that records writes — only `organizations.switchActive` touches it, and these
 * tests never call that.
 *
 * The important part is what is *not* faked: the caller goes through the real
 * `orgProcedure`, which resolves the membership from the database. A forged
 * session for org A therefore still cannot reach org B's rows unless the
 * queries themselves leak them, which is the whole point.
 */
function buildContext(userId: string, organizationId: string): TRPCContext {
  const { t } = createI18n(mainTranslations, "en", "en");

  return {
    session: {
      sessionId: `integration-${userId}`,
      exp: Math.floor(Date.now() / 1000) + 3600,
      hasPassword: true,
      activeOrganizationId: organizationId,
      user: {
        id: userId,
        email: `${userId}@integration.test`,
        name: "Integration User",
        emailVerifiedAt: new Date().toISOString(),
      },
    },
    cookies: {
      get: () => undefined,
      set: () => undefined,
    } as unknown as TRPCContext["cookies"],
    t,
    db,
    locale: "en",
  };
}

/**
 * One organization with one admin, and a caller acting as that admin.
 *
 * `shortCode` is caller-supplied and must be unique — these are fixtures, and a
 * collision should fail loudly rather than silently reuse another test's org.
 */
export async function createTenant(
  shortCode: string,
  name: string,
): Promise<TenantFixture> {
  const email = `isolation-${shortCode.toLowerCase()}-${Date.now()}@integration.test`;

  const [user] = await db
    .insert(UsersTable)
    .values({
      email,
      name: `${name} Admin`,
      emailVerifiedAt: new Date(),
      createdBy: "integration-test",
    })
    .returning({ id: UsersTable.id });

  const [organization] = await db
    .insert(OrganizationsTable)
    .values({ shortCode, name })
    .returning({ id: OrganizationsTable.id });

  await db.insert(OrganizationMembershipsTable).values({
    organizationId: organization.id,
    userId: user.id,
    role: "admin",
  });

  await db
    .update(OrganizationsTable)
    .set({ ownerId: user.id })
    .where(eq(OrganizationsTable.id, organization.id));

  return {
    organizationId: organization.id,
    userId: user.id,
    email,
    caller: createCaller(buildContext(user.id, organization.id)),
  };
}

/** Removes a fixture tenant. Every tenant-owned row cascades with the org. */
export async function destroyTenant(tenant: TenantFixture) {
  await db
    .delete(OrganizationsTable)
    .where(eq(OrganizationsTable.id, tenant.organizationId));
  await db.delete(UsersTable).where(eq(UsersTable.id, tenant.userId));
}

/**
 * Runs `call` and returns the tRPC error code it threw, or `null` if it
 * resolved. Isolation is satisfied by either outcome depending on the route —
 * a `get` should refuse, a `list` should simply not contain the row — so the
 * assertions need to distinguish "threw NOT_FOUND" from "returned nothing"
 * rather than treating any rejection as a pass.
 */
export async function errorCodeOf(
  call: Promise<unknown>,
): Promise<string | null> {
  try {
    await call;
    return null;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    return code ?? "UNKNOWN";
  }
}
