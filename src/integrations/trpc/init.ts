import { initTRPC, TRPCError } from "@trpc/server";
import { cookies } from "next/headers";
import superjson from "superjson";
import z, { ZodError } from "zod";

import { db } from "@/drizzle";
import { LOCALE_COOKIE_NAME } from "@/features/core/i18n/lib";
import { getT } from "@/features/core/i18n/server";
import { handleDatabaseError } from "./db-error";

// Session shape lands in Phase 2 (see docs/rebuild/phases/phase-02.md); until
// then every request is anonymous, which correctly makes protectedProcedure
// always reject.
type Session = null;

export const createTRPCContext = async () => {
  const cookieStore = await cookies();
  const session: Session = null;
  const { t } = await getT();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? "en";

  return { session, cookies: cookieStore, t, db, locale };
};

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError
              ? z.treeifyError(error.cause)
              : null,
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

const orgMembershipMiddleware = t.middleware(() => {
  // Stub until Phase 2 wires organization membership onto the session.
  throw new TRPCError({
    code: "NOT_IMPLEMENTED",
    message: "Organization scoping is not available until Phase 2.",
  });
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
export const orgProcedure = protectedProcedure.use(orgMembershipMiddleware);
