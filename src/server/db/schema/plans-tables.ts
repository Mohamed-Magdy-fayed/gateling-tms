import { OrganizationsTable } from "@/server/db/schema/organizations-table";
import { UsersTable } from "@/server/db/schema/users-table";
import { createdAt, id, updatedAt } from "@/server/db/schemaHelpers";
import { pgTable, text, timestamp, integer, boolean, decimal, pgEnum, uuid } from "drizzle-orm/pg-core";

// Enums
export const subscriptionStatusEnum = pgEnum("subscription_status", [
    "active",
    "cancelled",
    "past_due",
    "trialing",
    "incomplete",
    "incomplete_expired",
    "unpaid"
]);

export const planEnum = pgEnum("plan", [
    "free",
    "basic",
    "professional",
    "enterprise"
]);

export const billingCycleEnum = pgEnum("billing_cycle", [
    "monthly",
    "yearly"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
    "pending",
    "succeeded",
    "failed",
    "cancelled",
    "refunded"
]);

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
    id,
    userId: uuid("user_id").references(() => UsersTable.id).notNull(),
    organizationId: uuid("organization_id").references(() => OrganizationsTable.id),

    // Plan and billing information
    plan: planEnum("plan").notNull().default("free"),
    previousPlan: planEnum("previous_plan"),
    billingCycle: billingCycleEnum("billing_cycle").default("monthly"),
    status: subscriptionStatusEnum("status").notNull().default("active"),

    // Pricing
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
    currency: text("currency").notNull().default("EGP"),

    // Paymob integration
    paymobSubscriptionId: text("paymob_subscription_id"),
    paymobCustomerId: text("paymob_customer_id"),
    paymobOrderId: text("paymob_order_id"),
    paymobTransactionId: text("paymob_transaction_id"),

    // Subscription lifecycle
    currentPeriodStart: timestamp("current_period_start").defaultNow().notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),
    cancelledAt: timestamp("cancelled_at"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),

    // Payment tracking
    lastPaymentDate: timestamp("last_payment_date"),
    nextPaymentDate: timestamp("next_payment_date"),
    failedPaymentAttempts: integer("failed_payment_attempts").default(0),

    // Feature limits based on plan
    maxStudents: integer("max_students").notNull().default(50),
    maxCourses: integer("max_courses").notNull().default(5),
    maxStorageGB: integer("max_storage_gb").notNull().default(1),

    // Metadata
    metadata: text("metadata"), // JSON string for additional data

    createdAt,
    updatedAt,
});

// Payment transactions table
export const paymentTransactions = pgTable("payment_transactions", {
    id,
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id).notNull(),
    userId: uuid("user_id").references(() => UsersTable.id).notNull(),

    // Payment details
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("EGP"),
    status: paymentStatusEnum("status").notNull().default("pending"),

    // Paymob transaction details
    paymobTransactionId: text("paymob_transaction_id").unique(),
    paymobOrderId: text("paymob_order_id"),
    paymobIntegrationId: text("paymob_integration_id"),

    // Transaction metadata
    paymentMethod: text("payment_method"), // card, wallet, etc.
    failureReason: text("failure_reason"),
    refundReason: text("refund_reason"),

    // Timestamps
    processedAt: timestamp("processed_at"),
    refundedAt: timestamp("refunded_at"),

    createdAt,
    updatedAt,
});

// Subscription usage tracking
export const subscriptionUsage = pgTable("subscription_usage", {
    id,
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id).notNull(),

    // Current usage
    currentStudents: integer("current_students").default(0),
    currentCourses: integer("current_courses").default(0),
    currentStorageGB: decimal("current_storage_gb", { precision: 10, scale: 2 }).default("0"),

    // Usage tracking period
    periodStart: timestamp("period_start").defaultNow().notNull(),
    periodEnd: timestamp("period_end").notNull(),

    createdAt,
    updatedAt,
});

// Email logs for tracking sent emails
export const emailLogs = pgTable("email_logs", {
    id,
    userId: uuid("user_id").references(() => UsersTable.id).notNull(),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),

    // Email details
    type: text("type").notNull(), // subscription_confirmation, payment_failed, etc.
    recipient: text("recipient").notNull(),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("sent"), // sent, failed, bounced

    // Provider details
    provider: text("provider").default("resend"),
    providerId: text("provider_id"), // Resend email ID

    // Error tracking
    errorMessage: text("error_message"),

    sentAt: timestamp("sent_at").defaultNow().notNull(),
    createdAt,
});

// Plan configurations
export const planConfigurations = pgTable("plan_configurations", {
    id,
    plan: planEnum("plan").notNull().unique(),

    // Pricing
    monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
    yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("EGP"),

    // Limits
    maxStudents: integer("max_students").notNull(),
    maxCourses: integer("max_courses").notNull(),
    maxStorageGB: integer("max_storage_gb").notNull(),

    // Features (JSON array of feature keys)
    features: text("features").notNull(), // JSON string array

    // Display information
    displayName: text("display_name").notNull(),
    description: text("description"),
    isPopular: boolean("is_popular").default(false),
    isActive: boolean("is_active").default(true),

    createdAt,
    updatedAt,
});

// Webhook events log
export const webhookEvents = pgTable("webhook_events", {
    id,

    // Event details
    eventType: text("event_type").notNull(),
    provider: text("provider").notNull().default("paymob"),
    eventId: text("event_id"), // Provider's event ID

    // Payload
    payload: text("payload").notNull(), // JSON string
    signature: text("signature"),

    // Processing
    processed: boolean("processed").default(false),
    processedAt: timestamp("processed_at"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").default(0),

    createdAt,
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;

export type SubscriptionUsage = typeof subscriptionUsage.$inferSelect;
export type NewSubscriptionUsage = typeof subscriptionUsage.$inferInsert;

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;

export type PlanConfiguration = typeof planConfigurations.$inferSelect;
export type NewPlanConfiguration = typeof planConfigurations.$inferInsert;

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
