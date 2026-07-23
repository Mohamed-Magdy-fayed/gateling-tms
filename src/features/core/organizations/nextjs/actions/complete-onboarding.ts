"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/drizzle";
import { UserCredentialsTable, UsersTable } from "@/drizzle/schema";
import { normalizeEmail } from "@/features/core/auth/core/helpers";
import { generateSalt, hashPassword } from "@/features/core/auth/core/passwordHasher";
import { createUserSession } from "@/features/core/auth/core/session";
import { validateInput } from "@/features/core/auth/nextjs/actions/helpers";
import { getPostAuthRedirect } from "@/features/core/auth/nextjs/lib/post-auth-redirect";
import type { PartialUser, TypedResponse } from "@/features/core/auth/types";
import { getT } from "@/features/core/i18n/server";
import { createOrganizationForUser } from "@/features/core/organizations/server";
import { inngest } from "@/integrations/inngest/client";
import { userRegisteredEvent } from "@/integrations/inngest/functions/on-user-registered";
import {
  buildRatelimitKey,
  getRequestIp,
  isRateLimited,
  signUpRatelimit,
} from "@/integrations/ratelimit";
import { getStartedSchema } from "../get-started-schema";

function onboardingError(error: unknown): TypedResponse<never> {
  const message = error instanceof Error ? error.message : "Unknown error";
  return { isError: true, message };
}

/**
 * The primary get-started entry: creates the account AND its organization
 * together for a brand-new visitor (phase-02.md step 7). User creation and
 * org creation are two sequential transactions rather than one atomic one —
 * `createOrganizationForUser`'s short-code-conflict retry loop needs to be
 * able to retry its own transaction (docs/rebuild/STATE.md D49's pattern),
 * which doesn't compose with nesting it inside a single outer transaction.
 * If org creation fails after the user was created, the user is left
 * account-only — proxy.ts already sends an authed-without-org user back to
 * /get-started, and that page's "already signed in" branch lets them finish
 * organization creation from where they left off, so this failure mode is
 * self-healing rather than a dead end.
 */
export async function completeOnboardingAction(
  rawInput: unknown,
): Promise<TypedResponse<never>> {
  const { t } = await getT();

  let contactName: string;
  let businessName: string;
  let email: string;
  let phone: string;
  let password: string;
  try {
    ({ contactName, businessName, email, phone, password } =
      await validateInput(getStartedSchema, rawInput));
  } catch (error) {
    return onboardingError(error);
  }

  const normalizedEmail = normalizeEmail(email);

  const ip = await getRequestIp();
  if (
    await isRateLimited(signUpRatelimit, buildRatelimitKey(ip, normalizedEmail))
  ) {
    return { isError: true, message: t("auth.error.rateLimited") };
  }

  const user = await db.transaction(async (trx) => {
    const existing = await trx.query.UsersTable.findFirst({
      columns: { id: true },
      where: eq(UsersTable.email, normalizedEmail),
    });

    if (existing) {
      throw new Error(t("auth.signUp.error.duplicate"));
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    const [createdUser] = await trx
      .insert(UsersTable)
      .values({
        name: contactName,
        email: normalizedEmail,
        phone,
        createdBy: "self-signup",
      })
      .returning({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        emailVerifiedAt: UsersTable.emailVerifiedAt,
      });

    if (!createdUser) {
      throw new Error(t("auth.signUp.error.generic"));
    }

    await trx.insert(UserCredentialsTable).values({
      userId: createdUser.id,
      passwordHash,
      passwordSalt: salt,
    });

    return createdUser satisfies PartialUser;
  });

  let activeOrganizationId: string | null = null;
  try {
    const { organizationId } = await createOrganizationForUser(db, user.id, {
      name: businessName,
    });
    activeOrganizationId = organizationId;
  } catch (error) {
    // Non-fatal, by design — see the function doc comment above.
    console.error("Failed to create organization during onboarding", error);
  }

  try {
    await inngest.send(userRegisteredEvent.create({ userId: user.id }));
  } catch (error) {
    console.error(
      "Failed to enqueue user/registered event after onboarding",
      error,
    );
  }

  try {
    await createUserSession(
      { user, hasPassword: true, activeOrganizationId },
      await cookies(),
    );
  } catch (error) {
    console.error("Failed to create session after onboarding", error);
    redirect("/auth/sign-in?error=session_failed");
  }

  redirect(getPostAuthRedirect(user));
}
