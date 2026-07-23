import { cookies } from "next/headers";
import type { PropsWithChildren } from "react";
import { getUserSession } from "@/features/core/auth/core";
import { SiteFooter } from "@/features/marketing/nextjs/components/site-footer";
import { SiteHeader } from "@/features/marketing/nextjs/components/site-header";

export default async function LandingLayout({ children }: PropsWithChildren) {
  const session = await getUserSession(await cookies());

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader isAuthenticated={session != null} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
