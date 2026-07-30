import { eq } from "drizzle-orm";
import { UsersTable, UserTokensTable } from "@/drizzle/schema";
import {
  createTokenValue,
  EMAIL_TOKEN_TTL_MS,
  hashTokenValue,
} from "@/features/core/auth/core/token";
import { db } from "./db";

/**
 * The dev-mode email-verification token capture phase-08.md asks for.
 *
 * `user_tokens.tokenHash` stores a plain SHA-256 hash of the token — one-way,
 * so there is no plaintext anywhere in the database for a test to read back,
 * and the real value only ever exists momentarily inside the signup Inngest
 * function before it's emailed out (which is what this step exists to avoid
 * depending on). Instead of reading a token, this mints its own: it reuses
 * the exact same `createTokenValue`/`hashTokenValue` primitives the app's
 * real signup flow uses, and inserts a second, independent, valid token row
 * for the same user. `verify-email`'s lookup only cares that a row's hash
 * matches an unexpired, unconsumed token — it doesn't care how many other
 * valid tokens the user has — so this can't race with (or need to touch)
 * whatever the real `on-user-registered` Inngest function does.
 */
export async function issueDevEmailVerificationToken(
  email: string,
): Promise<string> {
  const [user] = await db
    .select({ id: UsersTable.id })
    .from(UsersTable)
    .where(eq(UsersTable.email, email))
    .limit(1);

  if (!user) {
    throw new Error(`e2e dev-token: no user found for email "${email}"`);
  }

  const token = createTokenValue();
  await db.insert(UserTokensTable).values({
    userId: user.id,
    tokenHash: hashTokenValue(token),
    type: "email_verification",
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
  });

  return token;
}
