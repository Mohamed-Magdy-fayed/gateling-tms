"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2Icon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

type OrganizationSwitcherProps = {
  activeOrganizationId: string | null;
};

export function OrganizationSwitcher({
  activeOrganizationId,
}: OrganizationSwitcherProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: organizations } = useQuery(
    trpc.organizations.listMine.queryOptions(),
  );
  const switchMut = useMutation(trpc.organizations.switchActive.mutationOptions());

  const active = organizations?.find((org) => org.id === activeOrganizationId);

  async function handleSelect(organizationId: string) {
    if (organizationId === activeOrganizationId) return;

    try {
      await toast
        .promise(switchMut.mutateAsync({ organizationId }), {
          loading: t("common.loading"),
          success: t("organizations.switcher.switched"),
          error: t("organizations.switcher.switchFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.organizations.pathKey(),
      });
      router.refresh();
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  if (!organizations || organizations.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-between gap-2 sm:w-56"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Building2Icon className="size-3.5 shrink-0" />
              <span className="truncate">
                {active?.name ?? t("organizations.switcher.label")}
              </span>
            </span>
            <ChevronsUpDownIcon className="size-3.5 shrink-0 opacity-50" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56">
        {organizations.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => handleSelect(org.id)}>
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === activeOrganizationId ? (
              <CheckIcon className="size-3.5" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
