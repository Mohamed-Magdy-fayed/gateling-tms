import "server-only";

import { renderBaseEmail } from "@/features/core/auth/emails/base-email";
import { mainTranslations } from "@/features/core/i18n/global";
import { createI18n } from "@/features/core/i18n/lib";
import { sendMail } from "@/integrations/email";

type SendContactNotificationEmail = (options: {
  to: string;
  name: string;
  fromEmail: string;
  subject: string;
  message: string;
  /**
   * The submitter's locale at the moment they submitted the form — captured
   * from `ctx.locale` in the mutation (a real request scope) and carried
   * through the Inngest event, same reasoning as
   * `sendOrganizationInviteEmail` (this function also runs inside an
   * Inngest function invocation with no browser-sent locale cookie).
   */
  locale: string;
}) => Promise<void>;

export const sendContactNotificationEmail: SendContactNotificationEmail =
  async (options) => {
    const { t } = createI18n(mainTranslations, options.locale, "en");

    const subject = t("contact.emails.notification.subject", {
      subject: options.subject,
    });
    const intro = t("contact.emails.notification.intro", {
      name: options.name,
      email: options.fromEmail,
      subject: options.subject,
    });

    const html = renderBaseEmail({
      dir: options.locale === "ar" ? "rtl" : "ltr",
      greeting: t("contact.emails.notification.greeting"),
      intro,
      notice: options.message,
      signature: t("auth.emails.common.signature"),
    });

    await sendMail({
      toEmail: options.to,
      subject,
      text: `${intro}\n\n${options.message}`,
      html,
      fromName: t("auth.emails.common.fromName"),
    });
  };
