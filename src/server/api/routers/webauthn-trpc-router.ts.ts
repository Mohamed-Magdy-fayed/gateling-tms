import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import {
    webAuthnServer,
    webAuthnRegistrationSchema,
    webAuthnAuthenticationSchema,
    type StoredCredential,
    type RegistrationChallenge,
    type AuthenticationChallenge
} from "@/featurs/webauthn/server";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { WebAuthnCredentialsTable } from "@/server/db/schema";
import { UsersTable } from "@/server/db/schema/users-table";

// In-memory storage for challenges (in production, use Redis or database)
const registrationChallenges = new Map<string, RegistrationChallenge>();
const authenticationChallenges = new Map<string, AuthenticationChallenge>();

export const webAuthnRouter = createTRPCRouter({
    getRegistrationOptions: publicProcedure
        .input(z.object({
            userId: z.string(),
            userName: z.string(),
            userDisplayName: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                const options = webAuthnServer.generateRegistrationOptions({
                    id: input.userId,
                    name: input.userName,
                    displayName: input.userDisplayName,
                });

                const challengeData: RegistrationChallenge = {
                    challenge: options.challenge,
                    userId: input.userId,
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                };

                registrationChallenges.set(options.challenge, challengeData);

                for (const [key, value] of registrationChallenges.entries()) {
                    if (value.expiresAt < new Date()) {
                        registrationChallenges.delete(key);
                    }
                }

                return {
                    success: true,
                    options,
                };
            } catch (error) {
                console.error("Failed to generate registration options:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to generate registration options",
                });
            }
        }),

    verifyRegistration: publicProcedure
        .input(z.object({
            credential: webAuthnRegistrationSchema,
            challenge: z.string(),
            userId: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                const challengeData = registrationChallenges.get(input.challenge);
                if (!challengeData) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Invalid or expired challenge",
                    });
                }

                if (challengeData.expiresAt < new Date()) {
                    registrationChallenges.delete(input.challenge);
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Challenge expired",
                    });
                }

                if (challengeData.userId !== input.userId) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "User ID mismatch",
                    });
                }

                const verification = webAuthnServer.verifyRegistration(
                    input.credential,
                    input.challenge
                );

                if (!verification.verified) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Registration verification failed",
                    });
                }

                // Drizzle: Check if credential already exists
                const existingCredential = await ctx.db.query.WebAuthnCredentialsTable.findFirst({
                    where: eq(WebAuthnCredentialsTable.credentialId, verification.credentialId),
                });

                if (existingCredential) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "This authenticator is already registered",
                    });
                }

                // Drizzle: Store the credential in the database
                const [storedCredential] = await ctx.db.insert(WebAuthnCredentialsTable).values({
                    credentialId: verification.credentialId,
                    publicKey: verification.publicKey,
                    counter: verification.counter,
                    userId: input.userId,
                    createdAt: new Date(),
                }).returning();

                if (!storedCredential) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to store credential",
                    });
                }

                registrationChallenges.delete(input.challenge);

                // Drizzle: Update user to mark as having WebAuthn enabled
                await ctx.db.update(UsersTable)
                    .set({
                        hasWebAuthn: true,
                        webAuthnEnabledAt: new Date(),
                    })
                    .where(eq(UsersTable.id, input.userId));

                return {
                    success: true,
                    message: "WebAuthn registration successful",
                    credentialId: storedCredential.credentialId,
                };
            } catch (error) {
                console.error("Registration verification failed:", error);
                if (error instanceof TRPCError) {
                    throw error;
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Registration failed",
                });
            }
        }),

    getAuthenticationOptions: publicProcedure
        .input(z.object({
            userId: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                let allowCredentials: Array<{ id: string }> | undefined;

                // Drizzle: If userId is provided, get their credentials
                if (input.userId) {
                    const userCredentials = await ctx.db.query.WebAuthnCredentialsTable.findMany({
                        where: eq(WebAuthnCredentialsTable.userId, input.userId),
                        columns: { credentialId: true },
                    });

                    allowCredentials = userCredentials.map(cred => ({
                        id: cred.credentialId,
                    }));
                }

                const options = webAuthnServer.generateAuthenticationOptions(allowCredentials);

                const challengeData: AuthenticationChallenge = {
                    challenge: options.challenge,
                    userId: input.userId,
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                };

                authenticationChallenges.set(options.challenge, challengeData);

                for (const [key, value] of authenticationChallenges.entries()) {
                    if (value.expiresAt < new Date()) {
                        authenticationChallenges.delete(key);
                    }
                }

                return {
                    success: true,
                    options,
                };
            } catch (error) {
                console.error("Failed to generate authentication options:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to generate authentication options",
                });
            }
        }),

    verifyAuthentication: publicProcedure
        .input(z.object({
            credential: webAuthnAuthenticationSchema,
            challenge: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                const challengeData = authenticationChallenges.get(input.challenge);
                if (!challengeData) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Invalid or expired challenge",
                    });
                }

                if (challengeData.expiresAt < new Date()) {
                    authenticationChallenges.delete(input.challenge);
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Challenge expired",
                    });
                }

                // Drizzle: Find the stored credential
                const storedCredential = await ctx.db.query.WebAuthnCredentialsTable.findFirst({
                    where: eq(WebAuthnCredentialsTable.credentialId, input.credential.id),
                    with: { user: true }, // Include user relation
                });

                if (!storedCredential) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Credential not found",
                    });
                }

                if (challengeData.userId && challengeData.userId !== storedCredential.userId) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "User ID mismatch",
                    });
                }

                const verification = webAuthnServer.verifyAuthentication(
                    input.credential,
                    input.challenge,
                    {
                        id: storedCredential.credentialId,
                        publicKey: storedCredential.publicKey,
                        counter: storedCredential.counter,
                        userId: storedCredential.userId,
                        createdAt: storedCredential.createdAt,
                        lastUsed: storedCredential.lastUsed || undefined, // Drizzle might return null, convert to undefined
                    }
                );

                if (!verification.verified) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Authentication verification failed",
                    });
                }

                // Drizzle: Update the credential counter and last used timestamp
                await ctx.db.update(WebAuthnCredentialsTable)
                    .set({
                        counter: verification.counter,
                        lastUsed: new Date(),
                    })
                    .where(eq(WebAuthnCredentialsTable.credentialId, input.credential.id));

                authenticationChallenges.delete(input.challenge);

                return {
                    success: true,
                    message: "Authentication successful",
                    user: {
                        id: storedCredential.user.id,
                        email: storedCredential.user.email,
                        name: storedCredential.user.name || null, // Ensure name is nullable
                    },
                };
            } catch (error) {
                console.error("Authentication verification failed:", error);
                if (error instanceof TRPCError) {
                    throw error;
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Authentication failed",
                });
            }
        }),

    getUserCredentials: protectedProcedure
        .query(async ({ ctx }) => {
            // Drizzle: Get user's WebAuthn credentials
            const credentials = await ctx.db.query.WebAuthnCredentialsTable.findMany({
                where: eq(WebAuthnCredentialsTable.userId, ctx.session.user.id),
                columns: {
                    credentialId: true,
                    createdAt: true,
                    lastUsed: true,
                },
                orderBy: WebAuthnCredentialsTable.createdAt, // Drizzle orderBy
            });

            return credentials.map(cred => ({
                id: cred.credentialId,
                createdAt: cred.createdAt,
                lastUsed: cred.lastUsed,
                deviceInfo: 'Biometric Device',
            }));
        }),

    removeCredential: protectedProcedure
        .input(z.object({
            credentialId: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            // Drizzle: Find the credential
            const credential = await ctx.db.query.WebAuthnCredentialsTable.findFirst({
                where: and(
                    eq(WebAuthnCredentialsTable.credentialId, input.credentialId),
                    eq(WebAuthnCredentialsTable.userId, ctx.session.user.id)
                ),
            });

            if (!credential) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Credential not found",
                });
            }

            // Drizzle: Delete the credential
            await ctx.db.delete(WebAuthnCredentialsTable)
                .where(eq(WebAuthnCredentialsTable.credentialId, input.credentialId));

            // Drizzle: Check if user has any remaining WebAuthn credentials
            const remainingCredentials = await ctx.db.query.WebAuthnCredentialsTable.findMany({
                where: eq(WebAuthnCredentialsTable.userId, ctx.session.user.id),
                columns: { id: true }, // Select a column to count rows
            });

            // If no credentials remain, update user's WebAuthn status
            if (remainingCredentials.length === 0) {
                await ctx.db.update(UsersTable)
                    .set({
                        hasWebAuthn: false,
                        webAuthnEnabledAt: null,
                    })
                    .where(eq(UsersTable.id, ctx.session.user.id));
            }

            return {
                success: true,
                message: "Credential removed successfully",
            };
        }),
});
