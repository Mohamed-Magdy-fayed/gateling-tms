import { getCurrentUser } from "@/features/core/auth/nextjs/currentUser";
import { SystemSettingsPage } from "@/features/system/settings/admin";

export default async function SettingsPage() {
  // Read off the user row, not `organizations.getActive`, so an owner who has
  // no active academy can still reach the page.
  const user = await getCurrentUser({
    withFullUser: true,
    redirectIfNotFound: true,
  });

  return <SystemSettingsPage isPlatformOwner={user.isPlatformOwner} />;
}
