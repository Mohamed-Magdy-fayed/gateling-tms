import { eq } from "drizzle-orm";
import { eventType } from "inngest";
import { z } from "zod";

import { env } from "@/data/env/server";
import { db } from "@/drizzle";
import { UsersTable, UserTokensTable } from "@/drizzle/schema";
import {
  createTokenValue,
  EMAIL_TOKEN_TTL_MS,
  hashTokenValue,
} from "@/features/core/auth/core/token";
import { sendEmailVerificationEmail } from "@/features/core/auth/emails/send-email-verification";
import { inngest } from "../client";

export const userRegisteredEvent = eventType("user/registered", {
  schema: z.object({ userId: z.string() }),
});

export const onUserRegistered = inngest.createFunction(
  { id: "on-user-registered", triggers: [userRegisteredEvent] },
  async ({ event }) => {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, event.data.userId),
      columns: { name: true, email: true },
    });

    if (!user?.email) return { skipped: true };

    const rawToken = createTokenValue();
    await db.insert(UserTokensTable).values({
      userId: event.data.userId,
      tokenHash: hashTokenValue(rawToken),
      type: "email_verification",
      expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    });

    const verificationUrl = new URL("/auth/verify-email", env.BASE_URL);
    verificationUrl.searchParams.set("token", rawToken);

    await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl: verificationUrl.toString(),
    });

    return { sent: true };
  },
);
