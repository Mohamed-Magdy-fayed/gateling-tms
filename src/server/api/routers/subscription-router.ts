import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "@/server/db";
import {
    subscriptions,
    paymentTransactions,
    subscriptionUsage,
    planConfigurations,
    type Subscription,
    type NewSubscription
} from "@/server/db/schema";
import { PaymobService } from "@/services/paymob/service";
import { inngest } from "@/services/inngest/client";
import type { SubscriptionPlan, SubscriptionStatus } from "@/services/paymob/schemas";
import { env } from "@/env";

// Plan configurations with features mapping
const PLAN_CONFIGS = {
    free: {
        limits: { students: 50, courses: 5, storage: 1 },
        pricing: { monthly: 0, yearly: 0 },
        features: ['contentlibrary', 'learningflow', 'liveclasses']
    },
    basic: {
        limits: { students: 200, courses: 25, storage: 10 },
        pricing: { monthly: 299, yearly: 2988 },
        features: ['contentlibrary', 'learningflow', 'liveclasses', 'hr', 'coursestore']
    },
    professional: {
        limits: { students: 1000, courses: 100, storage: 50 },
        pricing: { monthly: 799, yearly: 7990 },
        features: ['contentlibrary', 'learningflow', 'liveclasses', 'hr', 'coursestore', 'crm', 'smartforms']
    },
    enterprise: {
        limits: { students: 999999, courses: 999999, storage: 500 },
        pricing: { monthly: 1999, yearly: 19990 },
        features: ['contentlibrary', 'learningflow', 'liveclasses', 'hr', 'coursestore', 'crm', 'smartforms', 'community', 'support']
    }
} as const;

const CreateSubscriptionSchema = z.object({
    plan: z.enum(["free", "basic", "professional", "enterprise"]),
    billingCycle: z.enum(["monthly", "yearly"]),
    organizationId: z.string().optional(),
});

const UpdateSubscriptionSchema = z.object({
    subscriptionId: z.string(),
    plan: z.enum(["free", "basic", "professional", "enterprise"]).optional(),
    billingCycle: z.enum(["monthly", "yearly"]).optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
});

const CreatePaymentIntentSchema = z.object({
    subscriptionId: z.string(),
    returnUrl: z.string().url(),
});

const paymobService = new PaymobService();

export const subscriptionRouter = createTRPCRouter({
    // Get current user's subscription
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
        try {
            const subscription = await ctx.db
                .select()
                .from(subscriptions)
                .where(eq(subscriptions.userId, ctx.session.user.id))
                .orderBy(desc(subscriptions.createdAt))
                .limit(1);

            return subscription[0] || null;
        } catch (error) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to fetch current subscription",
            });
        }
    }),

    // Get subscription by ID
    getById: protectedProcedure
        .input(z.object({ subscriptionId: z.string() }))
        .query(async ({ ctx, input }) => {
            const subscription = await db
                .select()
                .from(subscriptions)
                .where(
                    and(
                        eq(subscriptions.id, input.subscriptionId),
                        eq(subscriptions.userId, ctx.session.user.id)
                    )
                )
                .limit(1);

            if (!subscription.length) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Subscription not found",
                });
            }

            return subscription[0];
        }),

    // Create new subscription
    create: protectedProcedure
        .input(
            z.object({
                plan: z.enum(["free", "basic", "professional", "enterprise"]),
                billingCycle: z.enum(["monthly", "yearly"]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                const planConfig = PLAN_CONFIGS[input.plan];
                const price = planConfig.pricing[input.billingCycle];

                // Check if user already has an active subscription
                const existingSubscription = await ctx.db
                    .select()
                    .from(subscriptions)
                    .where(
                        and(
                            eq(subscriptions.userId, ctx.session.user.id),
                            eq(subscriptions.status, "active")
                        )
                    )
                    .limit(1);

                if (existingSubscription.length > 0) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "User already has an active subscription",
                    });
                }

                const subscriptionData: NewSubscription = {
                    userId: ctx.session.user.id,
                    plan: input.plan,
                    billingCycle: input.billingCycle,
                    status: input.plan === "free" ? "active" : "unpaid",
                    maxStudents: planConfig.limits.students,
                    maxCourses: planConfig.limits.courses,
                    maxStorageGB: planConfig.limits.storage,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + (input.billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
                    amount: price.toString(),
                    currency: "EGP",
                };

                const [newSubscription] = await ctx.db
                    .insert(subscriptions)
                    .values(subscriptionData)
                    .returning();

                if (!newSubscription) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to create subscription",
                    });
                }

                // For free plans, activate immediately and send confirmation email
                if (input.plan === "free") {
                    await inngest.send({
                        name: "subscription/payment.succeeded",
                        data: {
                            userId: ctx.session.user.id,
                            email: ctx.session.user.email!,
                            name: ctx.session.user.name!,
                            locale: ctx.locale,
                            transactionId: newSubscription.id,
                            subscriptionId: newSubscription.id,
                            plan: input.plan,
                            billingCycle: input.billingCycle,
                            amount: 0,
                            currency: "EGP",
                        },
                    });
                }

                return newSubscription;
            } catch (error) {
                console.error("Subscription creation error:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create subscription",
                });
            }
        }),

    // Update subscription (plan change, cancellation, etc.)
    update: protectedProcedure
        .input(UpdateSubscriptionSchema)
        .mutation(async ({ ctx, input }) => {
            const subscription = await db
                .select()
                .from(subscriptions)
                .where(
                    and(
                        eq(subscriptions.id, input.subscriptionId),
                        eq(subscriptions.userId, ctx.session.user.id)
                    )
                )
                .limit(1);

            const currentSubscription = subscription[0];
            if (!currentSubscription) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Subscription not found",
                });
            }

            const updateData: Partial<Subscription> = {};

            // Handle plan change
            if (input.plan && input.plan !== currentSubscription.plan) {
                const newPlanConfig = PLAN_CONFIGS[input.plan];
                if (!newPlanConfig) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Invalid plan",
                    });
                }

                updateData.previousPlan = currentSubscription.plan;
                updateData.plan = input.plan;
                updateData.maxStudents = newPlanConfig.limits.students;
                updateData.maxCourses = newPlanConfig.limits.courses;
                updateData.maxStorageGB = newPlanConfig.limits.storage;

                // Update amount if billing cycle is provided
                if (input.billingCycle) {
                    updateData.amount = (input.billingCycle === "yearly"
                        ? newPlanConfig.pricing.yearly
                        : newPlanConfig.pricing.monthly).toString();
                }

                // If changing to free plan, activate immediately
                if (input.plan === "free") {
                    updateData.status = "active";
                } else {
                    updateData.status = "incomplete"; // Will be activated after payment
                }
            }

            // Handle billing cycle change
            if (input.billingCycle && input.billingCycle !== currentSubscription.billingCycle) {
                updateData.billingCycle = input.billingCycle;

                if (updateData.plan || currentSubscription.plan !== "free") {
                    const planConfig = PLAN_CONFIGS[updateData.plan || currentSubscription.plan];
                    updateData.amount = (input.billingCycle === "yearly"
                        ? planConfig.pricing.yearly
                        : planConfig.pricing.monthly).toString();
                }
            }

            // Handle cancellation
            if (input.cancelAtPeriodEnd !== undefined) {
                updateData.cancelAtPeriodEnd = input.cancelAtPeriodEnd;
                if (input.cancelAtPeriodEnd) {
                    updateData.cancelledAt = new Date();
                } else {
                    updateData.cancelledAt = null;
                }
            }

            updateData.updatedAt = new Date();

            const [updatedSubscription] = await db
                .update(subscriptions)
                .set(updateData)
                .where(eq(subscriptions.id, input.subscriptionId))
                .returning();

            return updatedSubscription;
        }),

    // Create payment intent for subscription
    createPaymentIntent: protectedProcedure
        .input(CreatePaymentIntentSchema)
        .mutation(async ({ ctx, input }) => {
            const subscription = await db
                .select()
                .from(subscriptions)
                .where(
                    and(
                        eq(subscriptions.id, input.subscriptionId),
                        eq(subscriptions.userId, ctx.session.user.id)
                    )
                )
                .limit(1);

            const currentSubscription = subscription[0];
            if (!currentSubscription) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Subscription not found",
                });
            }

            if (currentSubscription.plan === "free") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot create payment intent for free plan",
                });
            }

            const paymobService = new PaymobService();

            try {
                // Create payment intent with Paymob
                const paymentIntent = await paymobService.createPaymentIntent({
                    amount: parseFloat(currentSubscription.amount),
                    currency: currentSubscription.currency,
                    customer: {
                        email: ctx.session.user.email,
                        firstName: ctx.session.user.name?.split(" ")[0] || "Customer",
                        lastName: ctx.session.user.name?.split(" ").slice(1).join(" ") || "",
                    },
                    metadata: {
                        subscriptionId: currentSubscription.id,
                        userId: ctx.session.user.id,
                        plan: currentSubscription.plan,
                        billingCycle: currentSubscription.billingCycle,
                    },
                    returnUrl: input.returnUrl,
                });

                // Create payment transaction record
                await db.insert(paymentTransactions).values({
                    subscriptionId: currentSubscription.id,
                    userId: ctx.session.user.id,
                    amount: currentSubscription.amount,
                    currency: currentSubscription.currency,
                    status: "pending",
                    paymobOrderId: paymentIntent.orderId,
                    paymobIntegrationId: paymentIntent.clientSecret,
                });

                // Update subscription with PayMob order ID
                await db
                    .update(subscriptions)
                    .set({
                        paymobOrderId: paymentIntent.orderId,
                        updatedAt: new Date(),
                    })
                    .where(eq(subscriptions.id, currentSubscription.id));

                return {
                    paymentUrl: `${env.PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${env.PAYMOB_PUBLIC_KEY}&clientSecret=${paymentIntent.clientSecret}`,
                    orderId: paymentIntent.orderId,
                };

            } catch (error) {
                console.error("Failed to create payment intent:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create payment intent",
                });
            }
        }),

    // Get payment history
    getPaymentHistory: protectedProcedure
        .input(z.object({
            subscriptionId: z.string().optional(),
            limit: z.number().min(1).max(100).default(10),
            offset: z.number().min(0).default(0),
        }))
        .query(async ({ ctx, input }) => {
            const whereConditions = [eq(paymentTransactions.userId, ctx.session.user.id)];

            if (input.subscriptionId) {
                whereConditions.push(eq(paymentTransactions.subscriptionId, input.subscriptionId));
            }

            const transactions = await db
                .select()
                .from(paymentTransactions)
                .where(and(...whereConditions))
                .orderBy(desc(paymentTransactions.createdAt))
                .limit(input.limit)
                .offset(input.offset);

            return transactions;
        }),

    // Get subscription usage
    getUsage: protectedProcedure
        .input(z.object({ subscriptionId: z.string() }))
        .query(async ({ ctx, input }) => {
            try {
                const subscription = await ctx.db
                    .select()
                    .from(subscriptions)
                    .where(
                        and(
                            eq(subscriptions.id, input.subscriptionId),
                            eq(subscriptions.userId, ctx.session.user.id)
                        )
                    )
                    .limit(1);

                if (!subscription.length) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Subscription not found",
                    });
                }

                // TODO: Implement actual usage tracking
                // For now, return mock data
                return {
                    subscription: subscription[0],
                    usage: {
                        currentStudents: 25,
                        currentCourses: 3,
                        currentStorageGB: "0.5",
                    },
                };
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch usage data",
                });
            }
        }),

    // Update subscription usage
    updateUsage: protectedProcedure
        .input(z.object({
            subscriptionId: z.string(),
            students: z.number().optional(),
            courses: z.number().optional(),
            storageGB: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const subscription = await db
                .select()
                .from(subscriptions)
                .where(
                    and(
                        eq(subscriptions.id, input.subscriptionId),
                        eq(subscriptions.userId, ctx.session.user.id)
                    )
                )
                .limit(1);

            const currentSubscription = subscription[0];
            if (!currentSubscription) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Subscription not found",
                });
            }

            // Check limits
            if (input.students && input.students > currentSubscription.maxStudents) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Student limit exceeded. Maximum allowed: ${currentSubscription.maxStudents}`,
                });
            }

            if (input.courses && input.courses > currentSubscription.maxCourses) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Course limit exceeded. Maximum allowed: ${currentSubscription.maxCourses}`,
                });
            }

            if (input.storageGB && input.storageGB > currentSubscription.maxStorageGB) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Storage limit exceeded. Maximum allowed: ${currentSubscription.maxStorageGB}GB`,
                });
            }

            // Get current usage
            const currentUsage = await db
                .select()
                .from(subscriptionUsage)
                .where(eq(subscriptionUsage.subscriptionId, input.subscriptionId))
                .orderBy(desc(subscriptionUsage.createdAt))
                .limit(1);

            const updateData: any = {
                updatedAt: new Date(),
            };

            if (input.students !== undefined) {
                updateData.currentStudents = input.students;
            }
            if (input.courses !== undefined) {
                updateData.currentCourses = input.courses;
            }
            if (input.storageGB !== undefined) {
                updateData.currentStorageGB = input.storageGB.toString();
            }

            if (currentUsage[0]) {
                const [updatedUsage] = await db
                    .update(subscriptionUsage)
                    .set(updateData)
                    .where(eq(subscriptionUsage.id, currentUsage[0].id))
                    .returning();

                return updatedUsage;
            } else {
                // Create new usage record
                const [newUsage] = await db
                    .insert(subscriptionUsage)
                    .values({
                        subscriptionId: input.subscriptionId,
                        currentStudents: input.students || 0,
                        currentCourses: input.courses || 0,
                        currentStorageGB: input.storageGB?.toString() || "0",
                        periodStart: new Date(),
                        periodEnd: currentSubscription.currentPeriodEnd,
                    })
                    .returning();

                return newUsage;
            }
        }),

    // Cancel subscription
    cancel: protectedProcedure
        .input(z.object({
            subscriptionId: z.string(),
            immediately: z.boolean().default(false),
            reason: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const subscription = await db
                .select()
                .from(subscriptions)
                .where(
                    and(
                        eq(subscriptions.id, input.subscriptionId),
                        eq(subscriptions.userId, ctx.session.user.id)
                    )
                )
                .limit(1);

            const currentSubscription = subscription[0];
            if (!currentSubscription) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Subscription not found",
                });
            }

            if (currentSubscription.status === "cancelled") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Subscription is already cancelled",
                });
            }

            const updateData: Partial<Subscription> = {
                cancelledAt: new Date(),
                cancelAtPeriodEnd: !input.immediately,
                updatedAt: new Date(),
            };

            if (input.immediately) {
                updateData.status = "cancelled";
            }

            const [updatedSubscription] = await db
                .update(subscriptions)
                .set(updateData)
                .where(eq(subscriptions.id, input.subscriptionId))
                .returning();

            // Trigger cancellation email
            await inngest.send({
                name: "subscription/cancelled",
                data: {
                    userId: ctx.session.user.id,
                    email: ctx.session.user.email,
                    name: ctx.session.user.name || "Valued Customer",
                    plan: currentSubscription.plan,
                    billingCycle: currentSubscription.billingCycle || "monthly",
                    locale: ctx.locale || "en",
                    subscriptionId: currentSubscription.id,
                    cancellationDate: new Date().toISOString(),
                    effectiveDate: input.immediately
                        ? new Date().toISOString()
                        : currentSubscription.currentPeriodEnd.toISOString(),
                    immediately: input.immediately,
                }
            });

            return updatedSubscription;
        }),

    // Get available plans
    getPlans: publicProcedure.query(async ({ ctx }) => {
        try {
            return Object.entries(PLAN_CONFIGS).map(([planKey, config]) => ({
                id: planKey,
                plan: planKey as SubscriptionPlan,
                displayName: planKey.charAt(0).toUpperCase() + planKey.slice(1) + ' Plan',
                monthlyPrice: config.pricing.monthly.toString(),
                yearlyPrice: config.pricing.yearly.toString(),
                currency: 'EGP',
                maxStudents: config.limits.students,
                maxCourses: config.limits.courses,
                maxStorageGB: config.limits.storage,
                features: config.features,
                isPopular: planKey === 'professional',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));
        } catch (error) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to fetch plans",
            });
        }
    }),
});
