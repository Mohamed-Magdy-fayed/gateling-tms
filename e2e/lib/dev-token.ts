import { and, eq } from "drizzle-orm";
import { UsersTable, UserTokensTable } from "@/drizzle/schema";
import {
  createTokenValue,
  EMAIL_TOKEN_TTL_MS,
  hashTokenValue,
} from "@/features/core/auth/core/token";
import { db } from "./db";

/** How long to watch a freshly-issued token before trusting that it survived. */
const SETTLE_WINDOW_MS = 2_000;
const POLL_INTERVAL_MS = 250;
const MAX_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The dev-mode email-verification token capture phase-08.md asks for.
 *
 * `user_tokens.tokenHash` stores a plain SHA-256 hash of the token — one-way,
 * so there is no plaintext anywhere in the database for a test to read back,
 * and the real value only ever exists momentarily inside the signup Inngest
 * function before it's emailed out (which is what this step exists to avoid
 * depending on). Instead of reading a token, this mints its own: it reuses the
 * exact same `createTokenValue`/`hashTokenValue` primitives the app's real
 * signup flow uses, and inserts an independent, valid token row for the user.
 *
 * It does have to race with `on-user-registered`, though — contrary to what
 * this helper used to claim. That function deletes **every** existing
 * `email_verification` row for the user before inserting its own (so an Inngest
 * retry leaves exactly one active token), which means a token minted here is
 * wiped if the function's delete lands afterwards. That is what it looks like
 * when it happens: signup succeeds, the token is issued, and `/auth/verify-email`
 * answers "This verification link is invalid."
 *
 * So the token is issued and then *watched*: it only counts as usable once it
 * has survived a short settle window, and it is re-minted if it disappears. The
 * Inngest delete happens once, seconds after signup, so surviving that window is
 * a real signal rather than a guess. Nothing here waits *for* Inngest — the
 * function may legitimately never run (no `inngest-cli dev` in CI), and this
 * still returns a working token in that case.
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

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const token = createTokenValue();
    const tokenHash = hashTokenValue(token);

    await db.insert(UserTokensTable).values({
      userId: user.id,
      tokenHash,
      type: "email_verification",
      expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    });

    if (await survivesSettleWindow(tokenHash)) return token;
  }

  throw new Error(
    `e2e dev-token: token for "${email}" was deleted on every one of ${MAX_ATTEMPTS} attempts — ` +
      "is something else writing email_verification tokens for this user?",
  );
}

async function survivesSettleWindow(tokenHash: string): Promise<boolean> {
  const deadline = Date.now() + SETTLE_WINDOW_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const [row] = await db
      .select({ id: UserTokensTable.id })
      .from(UserTokensTable)
      .where(
        and(
          eq(UserTokensTable.tokenHash, tokenHash),
          eq(UserTokensTable.type, "email_verification"),
        ),
      )
      .limit(1);

    if (!row) return false;
  }

  return true;
}
