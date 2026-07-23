"use client";

import { ChevronsUpDownIcon, KeyRoundIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import type { User } from "@/drizzle/schema";
import { signOutAction } from "@/features/core/auth/nextjs/actions";
import { useTranslation } from "@/features/core/i18n/client";

type UserMenuProps = {
  user: User;
};

function userInitials(user: User): string {
  const name = user.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    const initials = `${first}${last}`.toUpperCase();
    if (initials) return initials;
  }
  return user.email.slice(0, 2).toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const { t } = useTranslation();
  const { isMobile } = useSidebar();

  const display = user.name?.trim() || user.email;
  const initials = userInitials(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-medium">{display}</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {user.email}
              </span>
            </div>
            <ChevronsUpDownIcon className="ms-auto size-4" aria-hidden />
          </SidebarMenuButton>
        }
      />
      <DropdownMenuContent
        align="end"
        side={isMobile ? "bottom" : "right"}
        className="w-56"
      >
        <DropdownMenuItem render={<Link href="/auth/passkeys" />}>
          <KeyRoundIcon className="size-3.5" />
          {t("auth.passkeys.pageTitle")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOutAction();
          }}
        >
          <LogOutIcon className="size-3.5" />
          {t("auth.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
