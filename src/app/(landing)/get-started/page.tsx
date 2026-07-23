import { H1, Lead } from "@/components/ui/typography";
import { getCurrentUser } from "@/features/core/auth/nextjs/currentUser";
import { getT } from "@/features/core/i18n/server";
import { GetStartedWizard } from "@/features/core/organizations/nextjs/components/get-started-wizard";
import { OrganizationOnlyOnboardingForm } from "@/features/core/organizations/nextjs/components/organization-only-onboarding-form";

// Reachable both by a brand-new anonymous visitor (the primary entry point,
// phase-02.md step 7) and by an authed-without-org user redirected here by
// proxy.ts (e.g. after Google OAuth, which creates a user but no org yet —
// "the inverse order" the phase doc calls out). Which form renders depends
// on whether a session already exists.
export default async function GetStartedPage() {
  const user = await getCurrentUser();
  const { t } = await getT();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="space-y-2 text-center">
        <H1>{t("getStarted.hero.title")}</H1>
        <Lead className="text-muted-foreground">
          {t("getStarted.hero.description")}
        </Lead>
      </div>
      {user ? <OrganizationOnlyOnboardingForm /> : <GetStartedWizard />}
    </div>
  );
}
