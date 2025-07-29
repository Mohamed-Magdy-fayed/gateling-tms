import { inngest } from "../client"
import { resend } from "@/services/resend/client"
import { env } from "@/env"
import { getI18n } from "@/i18n/lib/get-translations"
import EmailLayout from "@/services/resend/components/email-layout"
import SubscriptionConfirmation from "@/services/resend/components/subscription-confirmation"
import PaymentFailed from "@/services/resend/components/payment-failed"
import PlanUpgraded from "@/services/resend/components/plan-upgraded"
import PlanDowngraded from "@/services/resend/components/plan-downgraded"
import SubscriptionCancelled from "@/services/resend/components/subscription-cancelled"
import TrialEnding from "@/services/resend/components/trial-ending"
import PaymentPastDue from "@/services/resend/components/payment-past-due"

export const sendSubscriptionConfirmation = inngest.createFunction(
  {
    id: "send-subscription-confirmation",
    name: "Send Subscription Confirmation Email",
  },
  { event: "subscription/payment.succeeded" },
  async ({ event, step }) => {
    const { 
      email, 
      name, 
      plan, 
      billingCycle, 
      amount, 
      currency, 
      locale, 
      subscriptionId,
      transactionId 
    } = event.data

    await step.run("send-confirmation-email", async () => {
      const translation = await getI18n(locale)
      await resend.emails.send({
        from: "Gateling TMS <billing@gatelingtms.com>",
        to: email,
        subject: translation.t("subscriptionEmails.confirmation.subject"),
        react: EmailLayout({
          translation,
          Child: SubscriptionConfirmation,
          childProps: {
            userName: name,
            plan,
            billingCycle,
            amount,
            currency,
            subscriptionId,
            transactionId,
            dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
            t: translation.t,
          },
          logoUrl: `${env.NEXT_PUBLIC_APP_URL}/logo.png`,
        }),
      })
    })
  }
)

export const sendPaymentFailedEmail = inngest.createFunction(
  {
    id: "send-payment-failed-email",
    name: "Send Payment Failed Email",
  },
  { event: "subscription/payment.failed" },
  async ({ event, step }) => {
    const { 
      email, 
      name, 
      plan, 
      billingCycle, 
      amount, 
      currency, 
      locale, 
      paymentIntentId,
      failureReason 
    } = event.data

    await step.run("send-payment-failed-email", async () => {
      const translation = await getI18n(locale)
      await resend.emails.send({
        from: "Gateling TMS <billing@gatelingtms.com>",
        to: email,
        subject: translation.t("subscriptionEmails.paymentFailed.subject"),
        react: EmailLayout({
          translation,
          Child: PaymentFailed,
          childProps: {
            userName: name,
            plan,
            billingCycle,
            amount,
            currency,
            failureReason,
            retryUrl: `${env.NEXT_PUBLIC_APP_URL}/pricing?retry=${paymentIntentId}`,
            supportUrl: `${env.NEXT_PUBLIC_APP_URL}/contact`,
            t: translation.t,
          },
          logoUrl: `${env.NEXT_PUBLIC_APP_URL}/logo.png`,
        }),
      })
    })
  }
)

export const sendPlanUpgradedEmail = inngest.createFunction(
  {
    id: "send-plan-upgraded-email",
    name: "Send Plan Upgraded Email",
  },
  { event: "subscription/plan.upgraded" },
  async ({ event, step }) => {
    const { 
      email, 
      name, 
      previousPlan, 
      newPlan, 
      billingCycle, 
      amount, 
      currency, 
      locale, 
      subscriptionId,
      effectiveDate 
    } = event.data

    await step.run("send-plan-upgraded-email", async () => {
      const translation = await getI18n(locale)
      await resend.emails.send({
        from: "Gateling TMS <billing@gatelingtms.com>",
        to: email,
        subject: translation.t("subscriptionEmails.planUpgraded.subject"),
        react: EmailLayout({
          translation,
          Child: PlanUpgraded,
          childProps: {
            userName: name,
            previousPlan,
            newPlan,
            billingCycle,
            amount,
            currency,
            effectiveDate,
            dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
            featuresUrl: `${env.NEXT_PUBLIC_APP_URL}/features`,
            t: translation.t,
          },
          logoUrl: `${env.NEXT_PUBLIC_APP_URL}/logo.png`,
        }),
      })
    })
  }
)

export const sendPlanDowngradedEmail = inngest.createFunction(
  {
    id: "send-plan-downgraded-email",
    name: "Send Plan Downgraded Email",
  },
  { event: "subscription/plan.downgraded" },
  async ({ event, step }) => {
    const { 
      email, 
      name, 
      previousPlan, 
      newPlan, 
      billingCycle, 
      locale, 
      subscriptionId,
      effectiveDate 
    } = event.data

    await step.run("send-plan-downgraded-email", async () => {
      const translation = await getI18n(locale)
      await resend.emails.send({
        from: "Gateling TMS <billing@gatelingtms.com>",
        to: email,
        subject: translation.t("subscriptionEmails.planDowngraded.subject"),
        react: EmailLayout({
          translation,
          Child: PlanDowngraded,
          childProps: {
            userName: name,
            previousPlan,
            newPlan,
            billingCycle,
            effectiveDate,
            upgradeUrl: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
            dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
            t: translation.t,
          },
          logoUrl: `${env.NEXT_PUBLIC_APP_URL}/logo.png`,
        }),
      })
    })
  }
)

export const sendSubscriptionCancelledEmail = inngest.createFunction(
  {
    id: "send-subscription-cancelled-email",
    name: "Send Subscription Cancelled Email",
  },
  { event: "subscription/cancelled" },
  async ({ event, step }) => {
    const { 
      email, 
      name, 
      plan, 
      billingCycle, 
      locale, 
      subscriptionId,
      cancellationDate,
      effectiveDate,
      immediately 
    } = event.data

    await step.run("send-subscription-cancelled-email", async () => {
      const translation = await getI18n(locale)
      await resend.emails.send({
        from: "Gateling TMS <billing@gatelingtms.com>",
        to: email,
        subject: translation.t("subscriptionEmails.cancelled.subject"),
        react: EmailLayout({
          translation,
          Child: SubscriptionCancelled,
          childProps: {
            userName: name,
            plan,
            billingCycle,
            cancellationDate,
            effectiveDate,
            immediately,
            reactivateUrl: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
            feedbackUrl: `${env.NEXT_PUBLIC_APP_URL}/feedback`,
            t: translation.t,
          },
          logoUrl: `${env.NEXT_PUBLIC_APP_URL}/logo.png`,
        }),
      })
    })
  }
)

export const sendTrialEndingEmail = inngest.createFunction(
  {
    id: "send-trial-ending-email",
    name: "Send Trial Ending Email",
  },
  { event: "subscription/trial.ending" },
  async ({ event, step }) => {
    const { 
      email, 
      name, 
      plan, 
      locale, 
      subscriptionId,
      trialEndDate,
      daysRemaining 
    } = event.data

    await step.run("send-trial-ending-email", async () => {
      const translation = await getI18n(locale)
      await resend.emails.send({
        from: "Gateling TMS <billing@gatelingtms.com>",
        to: email,
        subject: translation.t("subscriptionEmails.trialEnding.subject", { days: daysRemaining }),
        react: EmailLayout({
          translation,
          Child: TrialEnding,
          childProps: {
            userName: name,
            plan,
            trialEndDate,
            daysRemaining,
            upgradeUrl: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
            dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
            t: translation.t,
          },
          logoUrl: `${env.NEXT_PUBLIC_APP_URL}/logo.png`,
        }),
      })
    })
  }
)

export const sendPaymentPastDueEmail = inngest.createFunction(
  {
    id: "send-payment-past-due-email",
    name: "Send Payment Past Due Email",
  },
  { event: "subscription/past_due" },
  async ({ event, step }) => {
    const { 
      email, 
      name, 
      plan, 
      billingCycle, 
      locale, 
      subscriptionId,
      dueDate,
      amount,
      currency 
    } = event.data

    await step.run("send-payment-past-due-email", async () => {
      const translation = await getI18n(locale)
      await resend.emails.send({
        from: "Gateling TMS <billing@gatelingtms.com>",
        to: email,
        subject: translation.t("subscriptionEmails.pastDue.subject"),
        react: EmailLayout({
          translation,
          Child: PaymentPastDue,
          childProps: {
            userName: name,
            plan,
            billingCycle,
            dueDate,
            amount,
            currency,
            updatePaymentUrl: `${env.NEXT_PUBLIC_APP_URL}/billing/payment-methods`,
            supportUrl: `${env.NEXT_PUBLIC_APP_URL}/contact`,
            t: translation.t,
          },
          logoUrl: `${env.NEXT_PUBLIC_APP_URL}/logo.png`,
        }),
      })
    })
  }
)
