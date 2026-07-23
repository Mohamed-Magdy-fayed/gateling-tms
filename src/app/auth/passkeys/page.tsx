import { H3, Muted } from "@/components/ui/typography";
import { PasskeyManager } from "@/features/core/auth/nextjs/components/passkey-manager";
import { getCurrentUser } from "@/features/core/auth/nextjs/currentUser";
import { getT } from "@/features/core/i18n/server";

// Temporary home for passkey management until the dashboard shell (phase-02
// step 8) exists — this is the only authed page in this segment, so it's
// where Mohamed can register/remove a passkey to test the sign-in flow.
export default async function PasskeysPage() {
  await getCurrentUser({ redirectIfNotFound: true });
  const { t } = await getT();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <H3>{t("auth.passkeys.pageTitle")}</H3>
        <Muted>{t("auth.passkeys.pageDescription")}</Muted>
      </div>
      <PasskeyManager />
    </div>
  );
}
