import { HomeIcon } from "lucide-react";
import { Suspense } from "react";

import { LinkButton } from "@/components/general/link-button";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { H3 } from "@/components/ui/typography";
import { getAuth } from "@/features/core/auth/nextjs/actions";
import { verifyEmailTokenAction } from "@/features/core/auth/nextjs/actions/email";
import { AuthProvider } from "@/features/core/auth/nextjs/components/auth-provider";
import { EmailVerificationNotice } from "@/features/core/auth/nextjs/components/email-verification-notice";
import { getT } from "@/features/core/i18n/server";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { t } = await getT();
  const { token } = await searchParams;

  return (
    <div className="space-y-4">
      <H3>{t("auth.emailVerification.heading")}</H3>
      <Suspense
        fallback={
          <Status variant="default">
            <StatusIndicator />
            <StatusLabel>{t("common.loading")}</StatusLabel>
          </Status>
        }
      >
        <VerifyEmailBody token={token} />
      </Suspense>
      <LinkButton href="/">
        <HomeIcon />
        {t("auth.emailVerification.backHome")}
      </LinkButton>
    </div>
  );
}

async function VerifyEmailBody({ token }: { token?: string }) {
  const { t } = await getT();

  if (token) {
    const result = await verifyEmailTokenAction({ token });
    return (
      <Status variant={result.isError ? "error" : "success"}>
        <StatusIndicator />
        <StatusLabel>
          {result.isError
            ? result.message
            : t("auth.emailVerification.success.verified")}
        </StatusLabel>
      </Status>
    );
  }

  const auth = await getAuth();
  if (!auth.isAuthenticated) {
    return (
      <Status variant="warning">
        <StatusIndicator />
        <StatusLabel>
          {t("auth.emailVerification.notice.signInRequired")}
        </StatusLabel>
      </Status>
    );
  }

  return (
    <AuthProvider value={auth}>
      <EmailVerificationNotice />
    </AuthProvider>
  );
}
