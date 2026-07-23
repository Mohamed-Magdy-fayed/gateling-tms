import "server-only";

import { renderBaseEmail } from "@/features/core/auth/emails/base-email";
import { mainTranslations } from "@/features/core/i18n/global";
import { createI18n } from "@/features/core/i18n/lib";
import { sendMail } from "@/integrations/email";

type SendOrganizationInviteEmail = (options: {
  to: string;
  organizationName: string;
  inviterName?: string | null;
  acceptUrl: string;
  /**
   * The inviting admin's locale at the moment they submitted the invite —
   * captured from `ctx.locale` in the mutation (a real request scope) and
   * carried through the Inngest event, rather than read here via
   * `getT()`/`getLocaleCookie()`. This function runs inside an Inngest
   * function invocation, which has no browser-sent locale cookie to read;
   * calling those would have silently always fallen back to "en".
   */
  locale: string;
}) => Promise<void>;

export const sendOrganizationInviteEmail: SendOrganizationInviteEmail = async (
  options,
) => {
  const { t } = createI18n(mainTranslations, options.locale, "en");
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
    dir: options.locale === "ar" ? "rtl" : "ltr",
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
