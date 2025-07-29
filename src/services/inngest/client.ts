import { EventSchemas, Inngest } from "inngest"

type Events = {
  "app/org.created": {
    data: {
      orgId: string
      name: string
      email: string
      locale: string
    }
  }
  "subscription/payment.succeeded": {
    data: {
      userId: string
      email: string
      name: string
      plan: string
      billingCycle: string
      amount: number
      currency: string
      locale: string
      subscriptionId: string
      transactionId: string
    }
  }
  "subscription/payment.failed": {
    data: {
      userId: string
      email: string
      name: string
      plan: string
      billingCycle: string
      amount: number
      currency: string
      locale: string
      paymentIntentId: string
      failureReason?: string
      transactionId?: number
    }
  }
  "subscription/plan.upgraded": {
    data: {
      userId: string
      email: string
      name: string
      previousPlan: string
      newPlan: string
      billingCycle: string
      amount: number
      currency: string
      locale: string
      subscriptionId: string
      effectiveDate: string
    }
  }
  "subscription/plan.downgraded": {
    data: {
      userId: string
      email: string
      name: string
      previousPlan: string
      newPlan: string
      billingCycle: string
      locale: string
      subscriptionId: string
      effectiveDate: string
    }
  }
  "subscription/cancelled": {
    data: {
      userId: string
      email: string
      name: string
      plan: string
      billingCycle: string
      locale: string
      subscriptionId: string
      cancellationDate: string
      effectiveDate: string
      immediately: boolean
    }
  }
  "subscription/trial.ending": {
    data: {
      userId: string
      email: string
      name: string
      plan: string
      locale: string
      subscriptionId: string
      trialEndDate: string
      daysRemaining: number
    }
  }
  "subscription/past_due": {
    data: {
      userId: string
      email: string
      name: string
      plan: string
      billingCycle: string
      locale: string
      subscriptionId: string
      dueDate: string
      amount: number
      currency: string
    }
  }
}

export const inngest = new Inngest({
  id: "gateling-tms",
  schemas: new EventSchemas().fromRecord<Events>(),
})
