"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPinIcon,
  MoreHorizontalIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type OrganizationMembershipRole,
  organizationMembershipRoleValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import type { OrganizationMemberRow } from "@/features/core/organizations/server/queries";
import { useTRPC } from "@/integrations/trpc/client";

export type SetMemberRowAction = (row: OrganizationMemberRow | null) => void;

type MemberRowActionsProps = {
  row: OrganizationMemberRow;
  setRemoveTarget: SetMemberRowAction;
  /** Absent when the academy has a single branch. */
  setBranchesTarget?: SetMemberRowAction;
};

export function MemberRowActions({
  row,
  setRemoveTarget,
  setBranchesTarget,
}: MemberRowActionsProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const updateRoleMut = useMutation(
    trpc.organizations.members.updateRole.mutationOptions(),
  );

  async function handleRoleChange(role: OrganizationMembershipRole) {
    if (role === row.role) return;

    try {
      await toast
        .promise(updateRoleMut.mutateAsync({ userId: row.userId, role }), {
          loading: t("common.loading"),
          success: t("organizations.members.roleUpdated"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("organizations.members.roleUpdateFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.organizations.members.pathKey(),
      });
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8"
            aria-label={t("common.actions")}
          >
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={updateRoleMut.isPending}>
            <ShieldIcon className="size-3.5" />
            {t("organizations.members.changeRole")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={row.role}
              onValueChange={(value) =>
                handleRoleChange(value as OrganizationMembershipRole)
              }
            >
              {organizationMembershipRoleValues.map((role) => (
                <DropdownMenuRadioItem
                  key={role}
                  value={role}
                  disabled={updateRoleMut.isPending}
                >
                  {t(`organizations.members.role.${role}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {/* Admins always see every branch, so there is nothing to assign. */}
        {setBranchesTarget && row.role !== "admin" ? (
          <DropdownMenuItem onClick={() => setBranchesTarget(row)}>
            <MapPinIcon className="size-3.5" aria-hidden />
            {t("organizations.members.editBranches")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={updateRoleMut.isPending}
          onClick={() => setRemoveTarget(row)}
        >
          <Trash2Icon className="size-3.5 text-destructive" />
          <span className="text-destructive">{t("actions.delete")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
