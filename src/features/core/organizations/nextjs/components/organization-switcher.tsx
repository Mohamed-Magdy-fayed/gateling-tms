"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2Icon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

type OrganizationSwitcherProps = {
  activeOrganizationId: string | null;
};

type SwitchTarget = { organizationId: string; branchId: string | null };

/**
 * Academy + branch switcher (docs/designs/academy-branches.md). Each academy
 * lists the branches this member may see, plus "All branches" when there is
 * more than one. An academy with a single branch is one plain entry.
 */
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
  const switchMut = useMutation(
    trpc.organizations.switchActive.mutationOptions(),
  );

  const active = organizations?.find((org) => org.id === activeOrganizationId);
  const activeBranch = active?.branches.find(
    (branch) => branch.id === active.activeBranchId,
  );
  const activeBranchLabel = active?.canSelectAll
    ? (activeBranch?.name ?? t("organizations.switcher.allBranches"))
    : null;

  async function handleSelect(target: SwitchTarget) {
    if (
      target.organizationId === activeOrganizationId &&
      target.branchId === (active?.activeBranchId ?? null)
    ) {
      return;
    }

    try {
      await toast
        .promise(switchMut.mutateAsync(target), {
          loading: t("common.loading"),
          success: t("organizations.switcher.switched"),
          error: t("organizations.switcher.switchFailed"),
        })
        .unwrap();
      // Every branch-scoped list changes with the switch, not just the
      // academy queries.
      await queryClient.invalidateQueries();
      router.refresh();
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  if (!organizations || organizations.length === 0) return null;

  const showAcademyLabels = organizations.length > 1;

  return (
    <DropdownMenu>
      {/* A sidebar menu button, like the user menu in the footer: when the
          sidebar collapses to icons it shrinks to the building icon instead
          of overflowing the rail. */}
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size={activeBranchLabel ? "lg" : "default"}
            className="border border-sidebar-border group-data-[collapsible=icon]:border-0 data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
            disabled={switchMut.isPending}
          >
            <Building2Icon aria-hidden />
            <span className="grid flex-1 text-start leading-tight">
              <span className="truncate">
                {active?.name ?? t("organizations.switcher.label")}
              </span>
              {activeBranchLabel ? (
                <span className="truncate text-xs text-muted-foreground">
                  {activeBranchLabel}
                </span>
              ) : null}
            </span>
            <ChevronsUpDownIcon className="opacity-50" aria-hidden />
          </SidebarMenuButton>
        }
      />
      <DropdownMenuContent align="start" className="min-w-56">
        {organizations.map((org, index) => {
          const isActiveOrg = org.id === activeOrganizationId;
          // Inactive branches drop out of the switcher, except the one the
          // member is already in.
          const branches = org.branches.filter(
            (branch) =>
              branch.isActive ||
              (isActiveOrg && branch.id === org.activeBranchId),
          );

          return (
            <Fragment key={org.id}>
              {index > 0 ? <DropdownMenuSeparator /> : null}
              {org.canSelectAll ? (
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{org.name}</DropdownMenuLabel>
                  <SwitcherItem
                    label={t("organizations.switcher.allBranches")}
                    selected={isActiveOrg && org.activeBranchId === null}
                    disabled={switchMut.isPending}
                    onSelect={() =>
                      handleSelect({ organizationId: org.id, branchId: null })
                    }
                  />
                  {branches.map((branch) => (
                    <SwitcherItem
                      key={branch.id}
                      label={branch.name}
                      selected={isActiveOrg && org.activeBranchId === branch.id}
                      disabled={switchMut.isPending}
                      onSelect={() =>
                        handleSelect({
                          organizationId: org.id,
                          branchId: branch.id,
                        })
                      }
                    />
                  ))}
                </DropdownMenuGroup>
              ) : (
                <DropdownMenuGroup>
                  {showAcademyLabels ? null : (
                    <DropdownMenuLabel>
                      {t("organizations.switcher.label")}
                    </DropdownMenuLabel>
                  )}
                  <SwitcherItem
                    label={org.name}
                    selected={isActiveOrg}
                    disabled={switchMut.isPending}
                    onSelect={() =>
                      handleSelect({ organizationId: org.id, branchId: null })
                    }
                  />
                </DropdownMenuGroup>
              )}
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type SwitcherItemProps = {
  label: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
};

function SwitcherItem({
  label,
  selected,
  disabled,
  onSelect,
}: SwitcherItemProps) {
  return (
    <DropdownMenuItem disabled={disabled} onClick={onSelect}>
      <span className="flex-1 truncate">{label}</span>
      {selected ? <CheckIcon className="size-3.5" aria-hidden /> : null}
    </DropdownMenuItem>
  );
}
