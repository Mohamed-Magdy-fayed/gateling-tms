import "server-only";

import type { OrganizationPlan } from "@/drizzle/schema";
import { renderBaseEmail } from "@/features/core/auth/emails/base-email";
import { mainTranslations } from "@/features/core/i18n/global";
import { createI18n } from "@/features/core/i18n/lib";
import { sendMail } from "@/integrations/email";
import { PLAN_LIMITS } from "../server/limits";

const BYTES_PER_GB = 1024 * 1024 * 1024;

type SendPlanGrantedEmail = (options: {
  to: string;
  recipientName?: string | null;
  organizationName: string;
  plan: OrganizationPlan;
  settingsUrl: string;
  /**
   * The granting owner's locale, captured from `ctx.locale` in the mutation
   * and carried through the Inngest event — users have no stored locale, and
   * this runs inside an Inngest invocation with no cookie to read (same
   * reasoning as send-organization-invite.ts).
   */
  locale: string;
}) => Promise<void>;

/**
 * One neutral template for every plan change, up or down (design doc
 * `academy-preferences.md` R11): it states the plan the academy is on now and
 * that plan's limits, and never calls the change an upgrade.
 */
export const sendPlanGrantedEmail: SendPlanGrantedEmail = async (options) => {
  const { t } = createI18n(mainTranslations, options.locale, "en");
  const numbers = new Intl.NumberFormat(options.locale);
  const limits = PLAN_LIMITS[options.plan];
  const plan = t(`organizations.plan.${options.plan}`);

  const values = {
    organizationName: options.organizationName,
    plan,
    students:
      limits.maxStudents === null
        ? t("organizations.emails.planGranted.studentsUnlimited")
        : t("organizations.emails.planGranted.students", {
            count: numbers.format(limits.maxStudents),
          }),
    courses:
      limits.maxCourses === null
        ? t("organizations.emails.planGranted.coursesUnlimited")
        : t("organizations.emails.planGranted.courses", {
            count: numbers.format(limits.maxCourses),
          }),
    storage: t("organizations.emails.planGranted.gigabytes", {
      amount: numbers.format(limits.maxStorageBytes / BYTES_PER_GB),
    }),
  };

  const subject = t("organizations.emails.planGranted.subject", { plan });
  const intro = t("organizations.emails.planGranted.intro", values);
  const limitsLine = t("organizations.emails.planGranted.limits", values);
  const name =
    options.recipientName?.trim() ||
    t("auth.emails.common.defaultRecipientName");

  const html = renderBaseEmail({
    dir: options.locale === "ar" ? "rtl" : "ltr",
    greeting: t("auth.emails.common.greeting", { name }),
    intro: `${intro} ${limitsLine}`,
    ctaLabel: t("organizations.emails.planGranted.ctaLabel"),
    ctaUrl: options.settingsUrl,
    notice: t("organizations.emails.planGranted.notice"),
    signature: t("auth.emails.common.signature"),
  });

  await sendMail({
    toEmail: options.to,
    subject,
    text: `${intro} ${limitsLine}\n\n${options.settingsUrl}`,
    html,
    fromName: t("auth.emails.common.fromName"),
  });
};
