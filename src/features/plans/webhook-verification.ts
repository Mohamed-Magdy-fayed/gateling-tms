import { createHmac } from "crypto";

export function verifyPaymobWebhook(payload: string, signature: string | null): boolean {
    if (!signature) {
        return false;
    }

    const hmac = createHmac("sha512", process.env.PAYMOB_API_SECRET!);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    return expectedSignature === signature;
}
