import { cookies } from "next/headers";
import type { PropsWithChildren } from "react";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getUserSession } from "@/features/core/auth/core";
import { getCurrentUser } from "@/features/core/auth/nextjs/currentUser";
import { LanguageToggle } from "@/features/core/i18n/client";
import { AppSidebar } from "@/features/system/dashboard/nextjs/app-sidebar";

export default async function SystemLayout({ children }: PropsWithChildren) {
  const user = await getCurrentUser({
    withFullUser: true,
    redirectIfNotFound: true,
  });
  const session = await getUserSession(await cookies());

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        activeOrganizationId={session?.activeOrganizationId ?? null}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-2 h-4" />
          <div className="ms-auto flex items-center gap-2">
            <LanguageToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
