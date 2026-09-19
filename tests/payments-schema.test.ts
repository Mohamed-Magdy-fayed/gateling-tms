import { describe, expect, test } from "vitest";
import {
  MAX_PAYMENT_AMOUNT,
  paymentMutationSchema,
  paymentUpdateSchema,
} from "../src/features/system/students/payments/server/schemas";

const TRAINEE = "11111111-1111-4111-8111-111111111111";
const ENROLLMENT = "22222222-2222-4222-8222-222222222222";
const PAYMENT = "33333333-3333-4333-8333-333333333333";

function payment(overrides: Record<string, unknown> = {}) {
  return {
    traineeId: TRAINEE,
    amount: 1500,
    paidAt: "2026-09-01",
    method: "cash",
    enrollmentId: "",
    reference: "",
    note: "",
    ...overrides,
  };
}

function issueFor(
  result: ReturnType<typeof paymentMutationSchema.safeParse>,
  field: string,
) {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === field)?.message;
}

describe("paymentMutationSchema", () => {
  test("accepts a cash payment with no course, reference or note", () => {
    expect(paymentMutationSchema.safeParse(payment()).success).toBe(true);
  });

  test("accepts an enrollment, a reference and a note", () => {
    const result = paymentMutationSchema.safeParse(
      payment({
        enrollmentId: ENROLLMENT,
        method: "instapay",
        reference: "INS-20260901-0042",
        note: "Second instalment.",
      }),
    );
    expect(result.success).toBe(true);
  });

  test("accepts amounts to the cent", () => {
    expect(
      paymentMutationSchema.safeParse(payment({ amount: 0.07 })).success,
    ).toBe(true);
    expect(
      paymentMutationSchema.safeParse(payment({ amount: 1234.56 })).success,
    ).toBe(true);
  });

  test("rejects a missing amount with the amount message key", () => {
    // A cleared number field submits null — the message must be ours, not
    // Zod's "expected number, received null".
    const result = paymentMutationSchema.safeParse(payment({ amount: null }));
    expect(result.success).toBe(false);
    expect(issueFor(result, "amount")).toBe("payments.validation.amount");
  });

  test("rejects zero and negative amounts", () => {
    expect(
      issueFor(
        paymentMutationSchema.safeParse(payment({ amount: 0 })),
        "amount",
      ),
    ).toBe("payments.validation.amount");
    expect(
      issueFor(
        paymentMutationSchema.safeParse(payment({ amount: -5 })),
        "amount",
      ),
    ).toBe("payments.validation.amount");
  });

  test("rejects more than two decimal places", () => {
    expect(
      issueFor(
        paymentMutationSchema.safeParse(payment({ amount: 10.005 })),
        "amount",
      ),
    ).toBe("payments.validation.amountPrecision");
  });

  test("rejects an amount the column cannot hold", () => {
    expect(
      issueFor(
        paymentMutationSchema.safeParse(
          payment({ amount: MAX_PAYMENT_AMOUNT + 1 }),
        ),
        "amount",
      ),
    ).toBe("payments.validation.amountMax");
  });

  test("rejects an impossible calendar date", () => {
    expect(
      issueFor(
        paymentMutationSchema.safeParse(payment({ paidAt: "2026-02-30" })),
        "paidAt",
      ),
    ).toBe("payments.validation.date");
  });

  test("rejects an unknown method", () => {
    expect(
      paymentMutationSchema.safeParse(payment({ method: "cheque" })).success,
    ).toBe(false);
  });

  test("rejects a reference over 128 characters with the matching message key", () => {
    expect(
      issueFor(
        paymentMutationSchema.safeParse(
          payment({ reference: "x".repeat(129) }),
        ),
        "reference",
      ),
    ).toBe("forms.validation.max128");
  });
});

describe("paymentUpdateSchema", () => {
  test("requires the payment id on top of the mutation fields", () => {
    expect(paymentUpdateSchema.safeParse(payment()).success).toBe(false);
    expect(
      paymentUpdateSchema.safeParse({ id: PAYMENT, ...payment() }).success,
    ).toBe(true);
  });
});
