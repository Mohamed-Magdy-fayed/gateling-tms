import {
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { getStartedFormSchema } from "@/featurs/get-started/schema";
import { createOrganization, readOrganization } from "@/featurs/auth/organizations/actions/crud";
import { TRPCError } from "@trpc/server";
import { createUser } from "@/featurs/auth/users/actions/crud";
import { getI18n } from "@/i18n/lib/get-translations";
import { inngest } from "@/services/inngest/client";
import { err } from "inngest/types";
import { verify } from "crypto";
import z from "zod";
import { OrganizationsTable, UsersTable } from "@/server/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export const getStartedRouter = createTRPCRouter({
  init: publicProcedure
    .input(getStartedFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { t } = await getI18n(ctx.locale)

      try {
        const [org] = await createOrganization([input])
        if (!org) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: t("error", { error: "Organization creation failed" }) });

        const [user] = await createUser([{
          name: input.contactName,
          email: input.email,
          phone: input.phone || null,
          image: null,
          emailVerified: null,
          organizationId: org.id,
          roles: ["admin"],
          status: "pending_verification"
        }])
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: t("error", { error: "User creation failed" }) });

        await inngest.send({
          name: "app/org.created",
          data: { email: user.email, name: user.name, orgId: org.id, locale: ctx.locale },
        })

        return { name: user.name }
      } catch (error) {
        if (error instanceof Error && error.message.includes("duplicate key")) throw new TRPCError({
          code: "BAD_REQUEST",
          message: t("errors.emailExists"),
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
        });
      }
    }),
  verifyEmail: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const { t } = await getI18n(ctx.locale)

      const [organization] = await readOrganization([input]);
      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: t("verifyEmail.error.generic"),
        });
      }

      const [user] = await ctx.db.select().from(UsersTable).where(
        and(
          eq(UsersTable.organizationId, input),
          eq(UsersTable.roles, ["admin"]),
          eq(UsersTable.status, "active"),
          isNull(UsersTable.emailVerified)
        )
      );
      if (!!user) {
        return { success: true, message: t("verifyEmail.error.backToSignup"), user };
      }

      try {
        const [user] = await ctx.db.update(UsersTable)
          .set({ emailVerified: new Date(), status: "active" })
          .where(and(eq(UsersTable.roles, ["admin"]), eq(UsersTable.organizationId, input)))
          .returning();

        return { user, success: true, message: t("verifyEmail.success.securityNote.description") };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: t("verifyEmail.error.generic"),
        });
      }
    })
});
