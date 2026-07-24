import { eventType } from "inngest";
import { z } from "zod";

import { env } from "@/data/env/server";
import { sendContactNotificationEmail } from "@/features/marketing/emails/send-contact-notification";
import { inngest } from "../client";

export const contactMessageSubmittedEvent = eventType(
  "contact/message-submitted",
  {
    schema: z.object({
      name: z.string(),
      email: z.string(),
      subject: z.string(),
      message: z.string(),
      // Captured from ctx.locale at the point the contact mutation ran (a
      // real request scope) — same reasoning as
      // on-organization-member-invited.ts: this function has no
      // browser-sent locale cookie to read.
      locale: z.string(),
    }),
  },
);

export const onContactMessageSubmitted = inngest.createFunction(
  {
    id: "on-contact-message-submitted",
    triggers: [contactMessageSubmittedEvent],
  },
  async ({ event, step }) => {
    return step.run("send-contact-notification-email", async () => {
      // No confirmed/monitored inbox exists until Mohamed provides one —
      // falls back through the same SMTP identity used to send mail, so a
      // pre-launch environment degrades to a no-op (via sendMail's own
      // "SMTP not configured" contract) rather than throwing.
      const inboxEmail =
        env.CONTACT_INBOX_EMAIL ?? env.SMTP_FROM_EMAIL ?? env.SMTP_USER;

      if (!inboxEmail) {
        console.warn(
          "[contact] no CONTACT_INBOX_EMAIL/SMTP_FROM_EMAIL/SMTP_USER configured, skipping notification",
        );
        return { skipped: true };
      }

      await sendContactNotificationEmail({
        to: inboxEmail,
        name: event.data.name,
        fromEmail: event.data.email,
        subject: event.data.subject,
        message: event.data.message,
        locale: event.data.locale,
      });

      return { sent: true };
    });
  },
);
