import { initTRPC, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import superjson from "superjson";
import z, { ZodError } from "zod";

import { db } from "@/drizzle";
import { OrganizationMembershipsTable } from "@/drizzle/schema";
import { getUserSession } from "@/features/core/auth/core";
import { LOCALE_COOKIE_NAME } from "@/features/core/i18n/lib";
import { getT } from "@/features/core/i18n/server";
import { handleDatabaseError } from "./db-error";
import { resolveOrgAccess } from "./org-access";

export const createTRPCContext = async () => {
  const cookieStore = await cookies();
  const session = await getUserSession(cookieStore);
  const { t } = await getT();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? "en";

  return { session, cookies: cookieStore, t, db, locale };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? z.treeifyError(error.cause) : null,
      },
    };
  },
});

const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({ ctx: { session: ctx.session } });
});

const databaseErrorMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    throw handleDatabaseError(err);
  }
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure.use(databaseErrorMiddleware);
export const protectedProcedure = t.procedure
  .use(authMiddleware)
  .use(databaseErrorMiddleware);
// Injects ctx.organizationId + ctx.role from the caller's *active* org
// membership. There is no `organizationId` input on any orgProcedure route —
// the tenant is always resolved from the session, never from client-supplied
// input — so a request can't be pointed at another org's data by forging a
// parameter. Defined inline (rather than as a standalone `t.middleware()`)
// so TypeScript narrows `ctx.session` to non-null using protectedProcedure's
// own guard instead of re-widening it.
export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const activeOrganizationId = ctx.session.activeOrganizationId;

  const membership = activeOrganizationId
    ? await ctx.db.query.OrganizationMembershipsTable.findFirst({
        where: and(
          eq(OrganizationMembershipsTable.userId, ctx.session.user.id),
          eq(OrganizationMembershipsTable.organizationId, activeOrganizationId),
        ),
        columns: { role: true },
      })
    : null;

  const access = resolveOrgAccess(activeOrganizationId, membership);
  if (!access) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("errors.noActiveOrganization"),
    });
  }

  return next({ ctx: access });
});

export const orgAdminProcedure = orgProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("errors.unauthorized"),
    });
  }

  return next();
});
