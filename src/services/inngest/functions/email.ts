import { inngest } from "../client"
import { resend } from "@/services/resend/client"
import { env } from "@/env"
import { getI18n } from "@/i18n/lib/get-translations"
import EmailLayout from "@/services/resend/components/email-layout"
import VerifyEmail from "@/services/resend/components/verify-email"

export const sendEmailVerification = inngest.createFunction(
  {
    id: "send-email-verification",
    name: "Send Email Verification",
  },
  { event: "app/org.created" },
  async ({ event, step }) => {
    const { email, name, orgId, locale } = event.data

    await step.run("send-email", async () => {
      const translation = await getI18n(locale)
      await resend.emails.send({
        from: "Gateling-TMS <onboarding@resend.dev>",
        to: email,
        subject: "Please verify your email",
        react: EmailLayout({
          translation,
          Child: VerifyEmail,
          childProps: {
            confirmLink: `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${orgId}`,
            userName: name,
            t: translation.t,
          },
          logoUrl: "https://placehold.co/300x80/transparent/ff4433?text=G",
        }),
      })
    })
  }
)
