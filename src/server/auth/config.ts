import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Passkey from "next-auth/providers/passkey"
import "next-auth/jwt"
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import { AccountsTable, UsersTable, type UserRole } from "@/server/db/schema";
import { AuthenticatorTable } from "@/server/db/schema/auth/authenticators-table";
import { eq } from "drizzle-orm";
import type { AdapterUser } from "next-auth/adapters";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string
    user: {
      id: string;
      name: string;
      email: string;
      organizationId: string;
      roles: UserRole[];
      // ...other properties
    } & DefaultSession["user"];
  }
}

export type Awaitable<T> = T | PromiseLike<T>

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Passkey({
      getUserInfo: async (opts, req) => {
        const email = req.query.email
        if (!email) return null

        const user = await db.query.UsersTable.findFirst({
          where: eq(UsersTable.email, email)
        })
        if (!user) {
          console.error(`Passkey attempt for non-existent user: ${email}`);
          return null
        }

        const authenticator = await db.query.AuthenticatorTable.findFirst({
          where: eq(AuthenticatorTable.userId, user.id)
        })

        if (!authenticator) return {
          exists: false,
          user
        }

        return {
          exists: true,
          user
        }
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: UsersTable,
    accountsTable: AccountsTable,
    authenticatorsTable: AuthenticatorTable
  }),
  callbacks: {
    async signIn(params) {
      if (params.account) {
        const existingAccount = await db.query.AccountsTable.findFirst({
          where: eq(AccountsTable.providerAccountId, params.account.providerAccountId)
        })
        if (existingAccount) return true

        await db.insert(AccountsTable).values({
          provider: params.account.provider,
          providerAccountId: params.account.providerAccountId,
          userId: params.user.id,
          type: params.account.type,
        } as unknown as typeof AccountsTable.$inferInsert);
      }

      return true;
    },
  },
  experimental: { enableWebAuthn: true },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  }
} satisfies NextAuthConfig;
