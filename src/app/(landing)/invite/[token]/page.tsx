import { TRPCError } from "@trpc/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/core/auth/nextjs/currentUser";
import { getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";

type AcceptInvitePageProps = {
  params: Promise<{ token: string }>;
};

function InvalidInvite({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <h1 className="font-semibold text-xl">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export default async function AcceptInvitePage({
  params,
}: AcceptInvitePageProps) {
  const { token } = await params;
  const user = await getCurrentUser();
  const { t } = await getT();
  const caller = await api();

  if (!user) {
    const returnTo = encodeURIComponent(`/invite/${token}`);
    let destination = `/auth/sign-in?returnTo=${returnTo}`;

    // Route a not-yet-signed-in visitor to sign-up or sign-in depending on
    // whether the invited email already has an account — otherwise someone
    // invited for the first time lands on the sign-in form with no idea
    // what credentials to use (see STATE.md D49).
    try {
      const preview = await caller.organizations.invites.preview({ token });
      const email = encodeURIComponent(preview.email);
      destination = preview.hasAccount
        ? `/auth/sign-in?returnTo=${returnTo}&email=${email}`
        : `/auth/sign-up?returnTo=${returnTo}&email=${email}`;
    } catch (error) {
      const message =
        error instanceof TRPCError
          ? error.message
          : t("organizations.invite.invalid");
      return (
        <InvalidInvite
          title={t("organizations.invite.invalidTitle")}
          message={message}
        />
      );
    }

    redirect(destination);
  }

  try {
    await caller.organizations.invites.accept({ token });
  } catch (error) {
    const message =
      error instanceof TRPCError
        ? error.message
        : t("organizations.invite.invalid");

    return (
      <InvalidInvite
        title={t("organizations.invite.invalidTitle")}
        message={message}
      />
    );
  }

  redirect("/");
}
