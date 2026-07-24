import { TRPCError } from "@trpc/server";
import { normalizeEmail } from "@/features/core/auth/core/helpers";
import { inngest } from "@/integrations/inngest/client";
import { contactMessageSubmittedEvent } from "@/integrations/inngest/functions/on-contact-message-submitted";
import {
  buildRatelimitKey,
  contactFormRatelimit,
  getRequestIp,
  isRateLimited,
} from "@/integrations/ratelimit";
import type { TRPCContext } from "@/integrations/trpc/init";
import type { ContactMessageInput } from "./schemas";

export async function submitContactMessage(
  ctx: Pick<TRPCContext, "t" | "locale">,
  input: ContactMessageInput,
) {
  const normalizedEmail = normalizeEmail(input.email);

  const ip = await getRequestIp();
  if (
    await isRateLimited(
      contactFormRatelimit,
      buildRatelimitKey(ip, normalizedEmail),
    )
  ) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: ctx.t("contact.form.error.rateLimited"),
    });
  }

  try {
    await inngest.send(
      contactMessageSubmittedEvent.create({
        name: input.name,
        email: normalizedEmail,
        subject: input.subject,
        message: input.message,
        locale: ctx.locale,
      }),
    );
  } catch (error) {
    // Mirrors organizations' inviteMember: never leak the raw transport
    // error to the client, but don't lie that the message was sent either.
    console.error("Failed to enqueue contact/message-submitted event", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: ctx.t("contact.form.error.submitFailed"),
    });
  }

  return { submitted: true };
}
