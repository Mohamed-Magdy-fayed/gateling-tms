"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, SaveIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { OverlayFormFooterActions } from "@/components/forms/overlay-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import type { BranchRow } from "@/features/core/organizations/server/branches";
import type { OrganizationMemberRow } from "@/features/core/organizations/server/queries";
import { useTRPC } from "@/integrations/trpc/client";

type MemberBranchesDialogProps = {
  member: OrganizationMemberRow | null;
  branches: BranchRow[];
  onOpenChange: (open: boolean) => void;
};

/**
 * Which branches a teacher or staff member works in. Nothing ticked means
 * every branch — how members behaved before branches existed.
 */
export function MemberBranchesDialog({
  member,
  branches,
  onOpenChange,
}: MemberBranchesDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const setBranchesMut = useMutation(
    trpc.organizations.members.setBranches.mutationOptions(),
  );

  // Keyed by member in the parent, so this starts fresh for each member.
  const [selected, setSelected] = useState<string[]>(
    () => member?.branchIds ?? [],
  );

  function toggle(branchId: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...current, branchId]
        : current.filter((id) => id !== branchId),
    );
  }

  async function handleSave() {
    if (!member) return;
    try {
      await toast
        .promise(
          setBranchesMut.mutateAsync({
            userId: member.userId,
            branchIds: selected,
          }),
          {
            loading: t("common.loading"),
            success: t("organizations.members.branchesSaved"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("organizations.members.branchesFailed"),
          },
        )
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.organizations.members.pathKey(),
      });
      onOpenChange(false);
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  const pending = setBranchesMut.isPending;
  const memberName = member?.name ?? member?.email ?? "";

  return (
    <Dialog open={member != null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("organizations.members.branchesTitle", { name: memberName })}
          </DialogTitle>
          <DialogDescription>
            {t("organizations.members.branchesHint")}
          </DialogDescription>
        </DialogHeader>

        <FieldSet disabled={pending} className="max-h-[50vh] overflow-y-auto">
          <FieldGroup className="gap-3">
            {branches.map((branch) => {
              const id = `member-branch-${branch.id}`;
              return (
                <Field key={branch.id} orientation="horizontal">
                  <Checkbox
                    id={id}
                    checked={selected.includes(branch.id)}
                    onCheckedChange={(checked) =>
                      toggle(branch.id, checked === true)
                    }
                  />
                  <FieldLabel htmlFor={id} className="font-normal">
                    {branch.name}
                    {branch.isActive ? null : (
                      <Tag>{t("organizations.branches.inactive")}</Tag>
                    )}
                  </FieldLabel>
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>

        <DialogFooter>
          <OverlayFormFooterActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              <XIcon className="size-3.5" aria-hidden />
              {t("actions.cancel")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={pending}>
              {pending ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <SaveIcon className="size-3.5" aria-hidden />
              )}
              {t("actions.save")}
            </Button>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
