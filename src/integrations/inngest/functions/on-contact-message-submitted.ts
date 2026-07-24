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
      // Unlike other dormant-integration paths (e.g. sendMail's own
      // "SMTP not configured" no-op), the contact mutation has *already*
      // told the sender their message was submitted successfully by the
      // time this runs — a silent skip here would lose the message with no
      // trace anywhere and no way for the sender to know. Throw instead, so
      // the job fails, stays retryable, and shows up as a real failure in
      // Inngest rather than disappearing.
      const inboxEmail =
        env.CONTACT_INBOX_EMAIL ?? env.SMTP_FROM_EMAIL ?? env.SMTP_USER;

      if (!inboxEmail) {
        throw new Error(
          "Contact inbox is not configured (CONTACT_INBOX_EMAIL/SMTP_FROM_EMAIL/SMTP_USER); refusing to silently discard a submitted message",
        );
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
