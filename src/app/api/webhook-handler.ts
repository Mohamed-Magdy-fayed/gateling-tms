import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import {
    subscriptions,
    paymentTransactions,
    webhookEvents,
    UsersTable as users,
    type NewWebhookEvent
} from "@/server/db/schema";
import { inngest } from "@/services/inngest/client";
import { paymobWebhookSchema } from "@/services/paymob/schemas";
import { verifyPaymobWebhook } from "@/features/plans/webhook-verification";

// Enhanced webhook payload schema
const WebhookPayloadSchema = z.object({
    type: z.enum([
        "transaction.obj.processed",
        "transaction.obj.failed",
        "subscription.created",
        "subscription.updated",
        "subscription.cancelled"
    ]),
    obj: paymobWebhookSchema,
    created_at: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("paymob-signature");

        // Verify webhook signature
        if (!verifyPaymobWebhook(body, signature)) {
            console.error("Invalid webhook signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const payload = WebhookPayloadSchema.parse(JSON.parse(body));
        const { type, obj: transaction } = payload;

        console.log(`Processing webhook: ${type}`, { transactionId: transaction.obj.id });

        // Log webhook event
        const webhookEvent: NewWebhookEvent = {
            eventType: type,
            provider: "paymob",
            eventId: transaction.obj.id.toString(),
            payload: body,
            signature: signature || "",
            processed: false,
        };

        const [loggedEvent] = await db
            .insert(webhookEvents)
            .values(webhookEvent)
            .returning();

        if (!loggedEvent) {
            console.error("Failed to log webhook event");
            return NextResponse.json({ error: "Failed to log webhook event" }, { status: 500 });
        }

        try {
            // Get subscription and user details from database
            const subscriptionWithUser = await db
                .select({
                    subscription: subscriptions,
                    user: {
                        id: users.id,
                        name: users.name,
                        email: users.email,
                    }
                })
                .from(subscriptions)
                .innerJoin(users, eq(subscriptions.userId, users.id))
                .where(
                    and(
                        eq(subscriptions.paymobOrderId, transaction.obj.order?.id?.toString() || "")
                    )
                )
                .limit(1);

            if (!subscriptionWithUser[0]) {
                console.error("Subscription or user not found", {
                    orderId: transaction.obj.order?.id,
                    transactionId: transaction.obj.id
                });

                // Mark webhook as processed even if subscription not found
                await db
                    .update(webhookEvents)
                    .set({
                        processed: true,
                        processedAt: new Date(),
                        errorMessage: "Subscription not found"
                    })
                    .where(eq(webhookEvents.id, loggedEvent.id));

                return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
            }

            const { subscription: currentSubscription, user } = subscriptionWithUser[0];

            switch (type) {
                case "transaction.obj.processed":
                    if (transaction.obj.success) {
                        // Update subscription status
                        const periodEnd = new Date();
                        if (currentSubscription.billingCycle === "yearly") {
                            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                        } else {
                            periodEnd.setMonth(periodEnd.getMonth() + 1);
                        }

                        await db
                            .update(subscriptions)
                            .set({
                                status: "active",
                                currentPeriodEnd: periodEnd,
                                lastPaymentDate: new Date(),
                                paymobTransactionId: transaction.obj.id.toString(),
                                failedPaymentAttempts: 0, // Reset failed attempts
                                updatedAt: new Date(),
                            })
                            .where(eq(subscriptions.id, currentSubscription.id));

                        // Update or create payment transaction
                        await db
                            .insert(paymentTransactions)
                            .values({
                                subscriptionId: currentSubscription.id,
                                userId: user.id,
                                amount: (transaction.obj.amount_cents / 100).toString(),
                                currency: transaction.obj.currency,
                                status: "succeeded",
                                paymobTransactionId: transaction.obj.id.toString(),
                                paymobOrderId: transaction.obj.order?.id?.toString(),
                                paymentMethod: transaction.obj.source_data?.type || "unknown",
                                processedAt: new Date(),
                            })
                            .onConflictDoUpdate({
                                target: paymentTransactions.paymobTransactionId,
                                set: {
                                    status: "succeeded",
                                    processedAt: new Date(),
                                    updatedAt: new Date(),
                                }
                            });

                        // Check if this is an upgrade/downgrade
                        const previousPlan = currentSubscription.previousPlan;
                        if (previousPlan && previousPlan !== currentSubscription.plan) {
                            if (isUpgrade(previousPlan, currentSubscription.plan)) {
                                // Trigger plan upgraded email
                                await inngest.send({
                                    name: "subscription/plan.upgraded",
                                    data: {
                                        userId: user.id,
                                        email: user.email,
                                        name: user.name || "Valued Customer",
                                        previousPlan,
                                        newPlan: currentSubscription.plan,
                                        billingCycle: currentSubscription.billingCycle || "monthly",
                                        amount: transaction.obj.amount_cents / 100,
                                        locale: "en",
                                        currency: transaction.obj.currency,
                                        subscriptionId: currentSubscription.id,
                                        effectiveDate: new Date().toISOString(),
                                    }
                                });
                            } else {
                                // Trigger plan downgraded email
                                await inngest.send({
                                    name: "subscription/plan.downgraded",
                                    data: {
                                        userId: user.id,
                                        email: user.email,
                                        name: user.name || "Valued Customer",
                                        previousPlan,
                                        newPlan: currentSubscription.plan,
                                        billingCycle: currentSubscription.billingCycle || "monthly",
                                        locale: "en",
                                        subscriptionId: currentSubscription.id,
                                        effectiveDate: new Date().toISOString(),
                                    }
                                });
                            }

                            // Clear previous plan
                            await db
                                .update(subscriptions)
                                .set({
                                    previousPlan: null,
                                    updatedAt: new Date(),
                                })
                                .where(eq(subscriptions.id, currentSubscription.id));
                        } else {
                            // Regular subscription confirmation
                            await inngest.send({
                                name: "subscription/payment.succeeded",
                                data: {
                                    userId: user.id,
                                    email: user.email,
                                    name: user.name || "Valued Customer",
                                    plan: currentSubscription.plan,
                                    billingCycle: currentSubscription.billingCycle || "monthly",
                                    amount: transaction.obj.amount_cents / 100,
                                    currency: transaction.obj.currency,
                                    locale: "en",
                                    subscriptionId: currentSubscription.id,
                                    transactionId: transaction.obj.id,
                                }
                            });
                        }

                        console.log("Payment processed successfully", {
                            userId: user.id,
                            subscriptionId: currentSubscription.id,
                            transactionId: transaction.obj.id
                        });
                    }
                    break;

                case "transaction.obj.failed":
                    // Update subscription to past due
                    await db
                        .update(subscriptions)
                        .set({
                            status: "past_due",
                            failedPaymentAttempts: (currentSubscription.failedPaymentAttempts || 0) + 1,
                            updatedAt: new Date(),
                        })
                        .where(eq(subscriptions.id, currentSubscription.id));

                    // Create failed payment transaction record
                    await db
                        .insert(paymentTransactions)
                        .values({
                            subscriptionId: currentSubscription.id,
                            userId: user.id,
                            amount: (transaction.obj.amount_cents / 100).toString(),
                            currency: transaction.obj.currency,
                            status: "failed",
                            paymobTransactionId: transaction.obj.id.toString(),
                            paymobOrderId: transaction.obj.order?.id?.toString(),
                            paymentMethod: transaction.obj.source_data?.type || "unknown",
                            failureReason: getFailureReason(transaction),
                            processedAt: new Date(),
                        })
                        .onConflictDoUpdate({
                            target: paymentTransactions.paymobTransactionId,
                            set: {
                                status: "failed",
                                failureReason: getFailureReason(transaction),
                                processedAt: new Date(),
                                updatedAt: new Date(),
                            }
                        });

                    // Trigger payment failed email
                    await inngest.send({
                        name: "subscription/payment.failed",
                        data: {
                            userId: user.id,
                            email: user.email,
                            name: user.name || "Valued Customer",
                            plan: currentSubscription.plan,
                            billingCycle: currentSubscription.billingCycle || "monthly",
                            amount: transaction.obj.amount_cents / 100,
                            currency: transaction.obj.currency,
                            locale: "en",
                            paymentIntentId: transaction.obj.id.toString(),
                            failureReason: getFailureReason(transaction),
                            transactionId: transaction.obj.id,
                        }
                    });

                    console.log("Payment failed", {
                        userId: user.id,
                        subscriptionId: currentSubscription.id,
                        transactionId: transaction.obj.id
                    });
                    break;

                case "subscription.cancelled":
                    const cancellationDate = new Date();
                    const immediately = false;
                    const effectiveDate = immediately ? cancellationDate : currentSubscription.currentPeriodEnd;

                    // Update subscription status
                    await db
                        .update(subscriptions)
                        .set({
                            status: "cancelled",
                            cancelledAt: cancellationDate,
                            cancelAtPeriodEnd: !immediately,
                            updatedAt: new Date(),
                        })
                        .where(eq(subscriptions.id, currentSubscription.id));

                    // Trigger subscription cancelled email
                    await inngest.send({
                        name: "subscription/cancelled",
                        data: {
                            userId: user.id,
                            email: user.email,
                            name: user.name || "Valued Customer",
                            plan: currentSubscription.plan,
                            billingCycle: currentSubscription.billingCycle || "monthly",
                            locale: "en",
                            subscriptionId: currentSubscription.id,
                            cancellationDate: cancellationDate.toISOString(),
                            effectiveDate: effectiveDate?.toISOString() || cancellationDate.toISOString(),
                            immediately,
                        }
                    });

                    console.log("Subscription cancelled", {
                        userId: user.id,
                        subscriptionId: currentSubscription.id,
                        immediately
                    });
                    break;

                default:
                    console.log(`Unhandled webhook type: ${type}`);
            }

            // Mark webhook as successfully processed
            await db
                .update(webhookEvents)
                .set({
                    processed: true,
                    processedAt: new Date(),
                })
                .where(eq(webhookEvents.id, loggedEvent.id));

        } catch (processingError) {
            console.error("Webhook processing error:", processingError);

            // Mark webhook as failed
            await db
                .update(webhookEvents)
                .set({
                    processed: false,
                    errorMessage: processingError instanceof Error ? processingError.message : "Unknown error",
                    retryCount: (loggedEvent.retryCount || 0) + 1,
                })
                .where(eq(webhookEvents.id, loggedEvent.id));

            throw processingError;
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Helper function to determine if a plan change is an upgrade
function isUpgrade(previousPlan: string, newPlan: string): boolean {
    const planHierarchy = {
        "FREE": 0,
        "BASIC": 1,
        "PROFESSIONAL": 2,
        "ENTERPRISE": 3
    };

    const previousLevel = planHierarchy[previousPlan as keyof typeof planHierarchy] ?? 0;
    const newLevel = planHierarchy[newPlan as keyof typeof planHierarchy] ?? 0;

    return newLevel > previousLevel;
}

// Helper function to extract failure reason from transaction
function getFailureReason(transaction: any): string | undefined {
    if (transaction.obj.error_occured) {
        return transaction.obj.error_description || "Payment processing error";
    }

    if (transaction.obj.pending) {
        return "Payment is pending approval";
    }

    if (!transaction.obj.success) {
        return transaction.obj.decline_reason || "Payment was declined";
    }

    return undefined;
}

// Background job to check for trials ending
export async function checkTrialsEnding() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const trialEndingSoon = await db
        .select({
            subscription: subscriptions,
            user: {
                id: users.id,
                name: users.name,
                email: users.email,
            }
        })
        .from(subscriptions)
        .innerJoin(users, eq(subscriptions.userId, users.id))
        .where(
            and(
                eq(subscriptions.status, "trialing"),
                eq(subscriptions.currentPeriodEnd, sevenDaysFromNow) // Trials ending in exactly 7 days
            )
        );

    for (const { subscription, user } of trialEndingSoon) {
        const daysRemaining = Math.ceil(
            (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        // Only send at specific intervals (7, 3, 1 days)
        if ([7, 3, 1].includes(daysRemaining)) {
            await inngest.send({
                name: "subscription/trial.ending",
                data: {
                    userId: user.id,
                    email: user.email,
                    name: user.name || "Valued Customer",
                    plan: subscription.plan,
                    locale: "en",
                    subscriptionId: subscription.id,
                    trialEndDate: subscription.currentPeriodEnd.toISOString(),
                    daysRemaining,
                }
            });
        }
    }
}

// Background job to check for past due payments
export async function checkPastDuePayments() {
    const now = new Date();

    const pastDueSubscriptions = await db
        .select({
            subscription: subscriptions,
            user: {
                id: users.id,
                name: users.name,
                email: users.email,
            }
        })
        .from(subscriptions)
        .innerJoin(users, eq(subscriptions.userId, users.id))
        .where(
            and(
                eq(subscriptions.status, "past_due"),
                eq(subscriptions.currentPeriodEnd, now) // Past due as of now
            )
        );

    for (const { subscription, user } of pastDueSubscriptions) {
        const daysPastDue = Math.ceil(
            (Date.now() - subscription.currentPeriodEnd.getTime()) / (1000 * 60 * 60 * 24)
        );

        await inngest.send({
            name: "subscription/past_due",
            data: {
                userId: user.id,
                email: user.email,
                name: user.name || "Valued Customer",
                plan: subscription.plan,
                billingCycle: subscription.billingCycle || "monthly",
                locale: "en",
                subscriptionId: subscription.id,
                dueDate: subscription.currentPeriodEnd.toISOString(),
                amount: parseFloat(subscription.amount),
                currency: subscription.currency,
                daysPastDue,
            }
        });
    }
}

// Background job to automatically cancel subscriptions after extended past due period
export async function cancelPastDueSubscriptions() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const subscriptionsToCancel = await db
        .select()
        .from(subscriptions)
        .where(
            and(
                eq(subscriptions.status, "past_due"),
                eq(subscriptions.currentPeriodEnd, thirtyDaysAgo) // Past due for 30+ days
            )
        );

    for (const subscription of subscriptionsToCancel) {
        await db
            .update(subscriptions)
            .set({
                status: "cancelled",
                cancelledAt: new Date(),
                cancelAtPeriodEnd: false,
                updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, subscription.id));

        console.log(`Auto-cancelled subscription ${subscription.id} due to extended past due period`);
    }
}
