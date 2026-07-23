import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { H1, Lead } from "@/components/ui/typography";
import { getUserSession } from "@/features/core/auth/core";
import { getT } from "@/features/core/i18n/server";
import { GetStartedWizard } from "@/features/core/organizations/nextjs/components/get-started-wizard";
import { OrganizationOnlyOnboardingForm } from "@/features/core/organizations/nextjs/components/organization-only-onboarding-form";

// Reachable both by a brand-new anonymous visitor (the primary entry point,
// phase-02.md step 7) and by an authed-without-org user redirected here by
// proxy.ts (e.g. after Google OAuth, which creates a user but no org yet —
// "the inverse order" the phase doc calls out). Which form renders depends
// on the session: no session -> full wizard; session but no active org ->
// the shorter org-only step; session with an active org already -> nothing
// to do here, send them on to the dashboard (this route isn't in
// proxy.ts's protected prefixes, so a signed-in user with an org can reach
// it directly by URL and would otherwise see a form they don't need).
export default async function GetStartedPage() {
  const session = await getUserSession(await cookies());
  const { t } = await getT();

  if (session?.activeOrganizationId) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="space-y-2 text-center">
        <H1>{t("getStarted.hero.title")}</H1>
        <Lead className="text-muted-foreground">
          {t("getStarted.hero.description")}
        </Lead>
      </div>
      {session?.user ? <OrganizationOnlyOnboardingForm /> : <GetStartedWizard />}
    </div>
  );
}
