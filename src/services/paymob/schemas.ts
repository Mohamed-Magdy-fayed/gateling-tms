import { z } from "zod";

// Environment variables schema
export const paymobEnvSchema = z.object({
    PAYMOB_BASE_URL: z.string().url(),
    PAYMOB_API_KEY: z.string(),
    PAYMOB_API_SECRET: z.string(),
    PAYMOB_PUBLIC_KEY: z.string(),
});

// Subscription plan types
export const subscriptionPlanSchema = z.enum(["free", "basic", "professional", "enterprise"]);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

// Billing cycle types
export const billingCycleSchema = z.enum(["monthly", "yearly"]);
export type BillingCycle = z.infer<typeof billingCycleSchema>;

// Subscription status types
export const subscriptionStatusSchema = z.enum([
    "active",
    "canceled",
    "past_due",
    "unpaid",
    "trialing",
    "incomplete",
    "incomplete_expired",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

// Plan configuration
export interface PlanConfig {
    id: SubscriptionPlan;
    name: string;
    description: string;
    features: string[];
    limits: {
        activeStudents: number | null; // null means unlimited
        courses: number | null;
        storage: number | null; // in GB
        liveClassParticipants: number | null;
        liveClassDuration: number | null; // in minutes
    };
    pricing: {
        monthly: number; // in EGP
        yearly: number; // in EGP
    };
    popular?: boolean;
    badge?: string;
}

// Paymob API request/response types
export const paymobAuthRequestSchema = z.object({
    api_key: z.string(),
});

export const paymobAuthResponseSchema = z.object({
    token: z.string(),
});

export const paymobOrderRequestSchema = z.object({
    auth_token: z.string(),
    delivery_needed: z.boolean(),
    amount_cents: z.number(),
    currency: z.string().default("EGP"),
    items: z.array(z.object({
        name: z.string(),
        amount_cents: z.number(),
        description: z.string(),
        quantity: z.number(),
    })),
});

export const paymobOrderResponseSchema = z.object({
    id: z.number(),
    created_at: z.string(),
    delivery_needed: z.boolean(),
    merchant: z.object({
        id: z.number(),
        created_at: z.string(),
        phones: z.array(z.string()),
        company_emails: z.array(z.string()),
        company_name: z.string(),
        state: z.string(),
        country: z.string(),
        city: z.string(),
        postal_code: z.string(),
        street: z.string(),
    }),
    collector: z.any().nullable(),
    amount_cents: z.number(),
    shipping_data: z.any().nullable(),
    currency: z.string(),
    is_payment_locked: z.boolean(),
    is_return: z.boolean(),
    is_cancel: z.boolean(),
    is_returned: z.boolean(),
    is_canceled: z.boolean(),
    merchant_order_id: z.string().nullable(),
    wallet_notification: z.any().nullable(),
    paid_amount_cents: z.number(),
    notify_user_with_email: z.boolean(),
    items: z.array(z.object({
        name: z.string(),
        description: z.string(),
        amount_cents: z.number(),
        quantity: z.number(),
    })),
    order_url: z.string(),
    commission_fees: z.number(),
    delivery_fees_cents: z.number(),
    delivery_vat_cents: z.number(),
    payment_method: z.string(),
    merchant_staff_tag: z.string().nullable(),
    api_source: z.string(),
    data: z.record(z.any()),
});

export const paymobPaymentKeyRequestSchema = z.object({
    auth_token: z.string(),
    amount_cents: z.number(),
    expiration: z.number(),
    order_id: z.number(),
    billing_data: z.object({
        apartment: z.string(),
        email: z.string().email(),
        floor: z.string(),
        first_name: z.string(),
        street: z.string(),
        building: z.string(),
        phone_number: z.string(),
        shipping_method: z.string(),
        postal_code: z.string(),
        city: z.string(),
        country: z.string(),
        last_name: z.string(),
        state: z.string(),
    }),
    currency: z.string().default("EGP"),
    integration_id: z.number(),
    lock_order_when_paid: z.boolean().default(false),
});

export const paymobPaymentKeyResponseSchema = z.object({
    token: z.string(),
});

// Database schema for subscriptions
export const subscriptionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    plan: subscriptionPlanSchema,
    status: subscriptionStatusSchema,
    billingCycle: billingCycleSchema,
    currentPeriodStart: z.date(),
    currentPeriodEnd: z.date(),
    cancelAtPeriodEnd: z.boolean().default(false),
    trialEnd: z.date().nullable(),
    paymobOrderId: z.number().nullable(),
    paymobTransactionId: z.number().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

// Payment intent schema
export const paymentIntentSchema = z.object({
    id: z.string(),
    userId: z.string(),
    plan: subscriptionPlanSchema,
    billingCycle: billingCycleSchema,
    amount: z.number(),
    currency: z.string().default("EGP"),
    status: z.enum(["pending", "processing", "succeeded", "failed", "canceled"]),
    paymobOrderId: z.number().nullable(),
    paymobPaymentKey: z.string().nullable(),
    metadata: z.record(z.any()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type PaymentIntent = z.infer<typeof paymentIntentSchema>;

// tRPC input schemas
export const createSubscriptionInputSchema = z.object({
    plan: subscriptionPlanSchema,
    billingCycle: billingCycleSchema,
    billingData: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        address: z.object({
            street: z.string().min(1),
            city: z.string().min(1),
            state: z.string().min(1),
            country: z.string().default("Egypt"),
            postalCode: z.string().min(1),
            apartment: z.string().optional(),
            floor: z.string().optional(),
            building: z.string().optional(),
        }),
    }),
});

export const updateSubscriptionInputSchema = z.object({
    subscriptionId: z.string(),
    plan: subscriptionPlanSchema.optional(),
    billingCycle: billingCycleSchema.optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
});

export const cancelSubscriptionInputSchema = z.object({
    subscriptionId: z.string(),
    immediately: z.boolean().default(false),
});

// Webhook schemas
export const paymobWebhookSchema = z.object({
    type: z.string(),
    obj: z.object({
        id: z.number(),
        pending: z.boolean(),
        amount_cents: z.number(),
        success: z.boolean(),
        is_auth: z.boolean(),
        is_capture: z.boolean(),
        is_standalone_payment: z.boolean(),
        is_voided: z.boolean(),
        is_refunded: z.boolean(),
        is_3d_secure: z.boolean(),
        integration_id: z.number(),
        profile_id: z.number(),
        has_parent_transaction: z.boolean(),
        order: z.object({
            id: z.number(),
            created_at: z.string(),
            delivery_needed: z.boolean(),
            merchant: z.object({
                id: z.number(),
                created_at: z.string(),
                phones: z.array(z.string()),
                company_emails: z.array(z.string()),
                company_name: z.string(),
                state: z.string(),
                country: z.string(),
                city: z.string(),
                postal_code: z.string(),
                street: z.string(),
            }),
            collector: z.any().nullable(),
            amount_cents: z.number(),
            shipping_data: z.any().nullable(),
            currency: z.string(),
            is_payment_locked: z.boolean(),
            merchant_order_id: z.string().nullable(),
            wallet_notification: z.any().nullable(),
            paid_amount_cents: z.number(),
            notify_user_with_email: z.boolean(),
            items: z.array(z.any()),
            order_url: z.string(),
            commission_fees: z.number(),
            delivery_fees_cents: z.number(),
            delivery_vat_cents: z.number(),
            payment_method: z.string(),
            merchant_staff_tag: z.string().nullable(),
            api_source: z.string(),
            data: z.record(z.any()),
        }),
        created_at: z.string(),
        transaction_processed_callback_responses: z.array(z.any()),
        currency: z.string(),
        source_data: z.object({
            pan: z.string(),
            type: z.string(),
            tenure: z.any().nullable(),
            sub_type: z.string(),
        }),
        api_source: z.string(),
        terminal_id: z.any().nullable(),
        merchant_commission: z.number(),
        installment: z.any().nullable(),
        discount_details: z.array(z.any()),
        is_void: z.boolean(),
        is_refund: z.boolean(),
        data: z.record(z.any()),
        is_hidden: z.boolean(),
        payment_key_claims: z.object({
            user_id: z.string(),
            amount_cents: z.number(),
            currency: z.string(),
            integration_id: z.number(),
            lock_order_when_paid: z.boolean(),
            billing_data: z.object({
                apartment: z.string(),
                email: z.string(),
                floor: z.string(),
                first_name: z.string(),
                street: z.string(),
                building: z.string(),
                phone_number: z.string(),
                shipping_method: z.string(),
                postal_code: z.string(),
                city: z.string(),
                country: z.string(),
                last_name: z.string(),
                state: z.string(),
            }),
            order_id: z.number(),
            exp: z.number(),
        }),
        error_occured: z.boolean(),
        is_live: z.boolean(),
        other_endpoint_reference: z.any().nullable(),
        refunded_amount_cents: z.number(),
        source_id: z.number(),
        is_captured: z.boolean(),
        captured_amount: z.number(),
        merchant_staff_tag: z.string().nullable(),
        updated_at: z.string(),
        is_settled: z.boolean(),
        bill_balanced: z.boolean(),
        is_bill: z.boolean(),
        owner: z.number(),
        parent_transaction: z.any().nullable(),
    }),
});

export type PaymobWebhook = z.infer<typeof paymobWebhookSchema>;

// Error types
export class PaymobError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public paymobResponse?: any
    ) {
        super(message);
        this.name = "PaymobError";
    }
}

export class SubscriptionError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = "SubscriptionError";
    }
}
