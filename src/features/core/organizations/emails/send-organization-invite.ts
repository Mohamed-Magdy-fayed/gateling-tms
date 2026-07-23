import "server-only";

import { renderBaseEmail } from "@/features/core/auth/emails/base-email";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { sendMail } from "@/integrations/email";

type SendOrganizationInviteEmail = (options: {
  to: string;
  organizationName: string;
  inviterName?: string | null;
  acceptUrl: string;
}) => Promise<void>;

export const sendOrganizationInviteEmail: SendOrganizationInviteEmail = async (
  options,
) => {
  const [{ t }, locale] = await Promise.all([getT(), getLocaleCookie()]);
  const inviterName =
    options.inviterName?.trim() || t("auth.emails.common.defaultRecipientName");

  const subject = t("organizations.emails.invite.subject", {
    organizationName: options.organizationName,
  });
  const text = t("organizations.emails.invite.text", {
    inviterName,
    organizationName: options.organizationName,
    acceptUrl: options.acceptUrl,
  });

  const html = renderBaseEmail({
    dir: locale === "ar" ? "rtl" : "ltr",
    greeting: t("auth.emails.common.greeting", {
      name: t("auth.emails.common.defaultRecipientName"),
    }),
    intro: t("organizations.emails.invite.intro", {
      inviterName,
      organizationName: options.organizationName,
    }),
    ctaLabel: t("organizations.emails.invite.ctaLabel"),
    ctaUrl: options.acceptUrl,
    notice: t("organizations.emails.invite.ignore"),
    signature: t("auth.emails.common.signature"),
  });

  await sendMail({
    toEmail: options.to,
    subject,
    text,
    html,
    fromName: t("auth.emails.common.fromName"),
  });
};
