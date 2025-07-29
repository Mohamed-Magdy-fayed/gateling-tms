import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import {
    paymentTransactions,
    subscriptions,
    type NewPaymentTransaction
} from "@/server/db/schema";
import { paymobWebhookSchema } from "./schemas";
import type { auth } from "@/server/auth";
import { env } from "@/env";

export class PaymobService {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly apiSecret: string;

    constructor() {
        this.baseUrl = env.PAYMOB_BASE_URL || "https://accept.paymob.com";
        this.apiKey = env.PAYMOB_API_KEY;
        this.apiSecret = env.PAYMOB_API_SECRET;
    }

    async authenticate(): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/auth/tokens`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: this.apiKey,
            }),
        });

        if (!response.ok) {
            throw new Error(`Authentication failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.token;
    }

    async createPaymentIntent(params: {
        amount: number;
        currency: string;
        customer: {
            email: string;
            firstName: string;
            lastName: string;
            phone?: string;
        };
        metadata?: Record<string, any>;
        returnUrl: string;
    }): Promise<{
        clientSecret: string;
        orderId: string;
    }> {
        try {
            const token = await this.authenticate();

            const intentData = {
                auth_token: token,
                special_reference: params.metadata?.subscriptionId || "", // Use subscriptionId as special_reference
                amount: Math.round(params.amount * 100), // Amount in cents
                currency: params.currency,
                payment_methods: [4618117, 4617984], // Example payment methods (replace with actual)
                items: [
                    {
                        name: params.metadata?.planName || "Subscription",
                        amount: Math.round(params.amount * 100),
                        description: params.metadata?.planDescription || "Gateling TMS Subscription",
                        quantity: 1,
                    }
                ],
                billing_data: {
                    first_name: params.customer.firstName,
                    last_name: params.customer.lastName,
                    phone_number: params.customer.phone || "+201000000000",
                    email: params.customer.email,
                    apartment: "NA",
                    floor: "NA",
                    street: "NA",
                    building: "NA",
                    postal_code: "NA",
                    city: "NA",
                    country: "EG",
                    state: "NA",
                },
                customer: {
                    first_name: params.customer.firstName,
                    last_name: params.customer.lastName,
                    email: params.customer.email,
                },
            };

            const intentResponse = await fetch(`${this.baseUrl}/v1/intention/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${this.apiSecret}`,
                },
                body: JSON.stringify(intentData)
            });

            if (!intentResponse.ok) {
                const errorData = await intentResponse.json();
                console.error("Paymob intent creation error:", errorData);
                throw new Error(`Payment intent creation failed: ${intentResponse.statusText} - ${JSON.stringify(errorData)}`);
            }

            const data = await intentResponse.json();
            if (!data.client_secret) {
                throw new Error("Client secret not received from Paymob");
            }

            return {
                clientSecret: data.client_secret,
                orderId: data.id.toString(), // Paymob intention ID can be used as orderId
            };
        } catch (error) {
            console.error("Paymob payment intent creation failed:", error);
            throw new Error("Failed to create payment intent");
        }
    }

    async processWebhook(payload: any): Promise<{
        success: boolean;
        transactionId: string;
        subscriptionId?: string;
    }> {
        try {
            const transaction = paymobWebhookSchema.parse(payload);

            // Find the subscription associated with this transaction
            const subscription = await db
                .select()
                .from(subscriptions)
                .where(eq(subscriptions.paymobOrderId, transaction.obj.order?.id?.toString() || ""))
                .limit(1);

            const currentSubscription = subscription[0];
            if (!currentSubscription) {
                throw new Error("Subscription not found for transaction");
            }


            // Create or update payment transaction record
            const existingTransaction = await db
                .select()
                .from(paymentTransactions)
                .where(eq(paymentTransactions.paymobTransactionId, transaction.obj.id.toString()))
                .limit(1);

            const transactionData: Partial<NewPaymentTransaction> = {
                subscriptionId: currentSubscription.id,
                userId: currentSubscription.userId,
                amount: (transaction.obj.amount_cents / 100).toString(),
                currency: transaction.obj.currency,
                status: transaction.obj.success ? "succeeded" : "failed",
                paymobTransactionId: transaction.obj.id.toString(),
                paymobOrderId: transaction.obj.order?.id?.toString(),
                paymentMethod: transaction.obj.source_data?.type || "unknown",
                processedAt: new Date(),
            };

            if (!transaction.obj.success) {
                transactionData.failureReason = this.getFailureReason(transaction);
            }

            if (existingTransaction[0]) {
                // Update existing transaction
                await db
                    .update(paymentTransactions)
                    .set({
                        ...transactionData,
                        updatedAt: new Date(),
                    })
                    .where(eq(paymentTransactions.id, existingTransaction[0].id));
            } else {
                // Create new transaction
                await db
                    .insert(paymentTransactions)
                    .values(transactionData as NewPaymentTransaction);
            }

            return {
                success: transaction.obj.success,
                transactionId: transaction.obj.id.toString(),
                subscriptionId: currentSubscription.id,
            };
        } catch (error) {
            console.error("Webhook processing error:", error);
            throw error;
        }
    }

    async refundTransaction(params: {
        transactionId: string;
        amount?: number;
        reason?: string;
    }): Promise<{ success: boolean; refundId: string }> {
        const token = await this.authenticate();

        // Get transaction details
        const transaction = await db
            .select()
            .from(paymentTransactions)
            .where(eq(paymentTransactions.paymobTransactionId, params.transactionId))
            .limit(1);

        const currentTransaction = transaction[0];
        if (!currentTransaction) {
            throw new Error("Transaction not found");
        }

        const refundAmount = params.amount || parseFloat(currentTransaction.amount);

        const response = await fetch(`${this.baseUrl}/api/acceptance/void_refund/refund`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                auth_token: token,
                transaction_id: parseInt(params.transactionId),
                amount_cents: Math.round(refundAmount * 100),
            }),
        });

        if (!response.ok) {
            throw new Error(`Refund failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Update transaction record
        await db
            .update(paymentTransactions)
            .set({
                status: "refunded",
                refundReason: params.reason,
                refundedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(paymentTransactions.id, currentTransaction.id));

        return {
            success: true,
            refundId: data.id.toString(),
        };
    }

    private getFailureReason(transaction: any): string {
        if (transaction.error_occured) {
            return transaction.error_description || "Payment processing error";
        }

        if (transaction.pending) {
            return "Payment is pending approval";
        }

        if (!transaction.success) {
            return transaction.decline_reason || "Payment was declined";
        }

        return "Unknown error";
    }

    async getTransactionDetails(transactionId: string): Promise<any> {
        const token = await this.authenticate();

        const response = await fetch(
            `${this.baseUrl}/api/acceptance/transactions/${transactionId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to get transaction details: ${response.statusText}`);
        }

        return response.json();
    }

    async validateWebhookSignature(payload: string, signature: string): Promise<boolean> {
        // Implement webhook signature validation based on Paymob's documentation
        // This is a placeholder - implement according to Paymob's security requirements
        return true;
    }
}
