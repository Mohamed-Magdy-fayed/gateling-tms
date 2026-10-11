"use client";

import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useId, useMemo, useState } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/features/core/i18n/client";
import { translationKey } from "@/features/core/i18n/global";
import { useTRPC } from "@/integrations/trpc/client";

/**
 * Where a new student, group or availability slot goes
 * (docs/designs/academy-branches.md). With one branch selected — or only one
 * the member may write to — there is nothing to ask; with "All branches"
 * selected, create forms show a Branch select (`needsChoice`).
 */
export function useWriteBranches() {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.organizations.branches.writable.queryOptions(),
  );

  return useMemo(() => {
    const branches = data ?? [];
    return {
      options: branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
      })),
      needsChoice: branches.length > 1,
      /** Sent when there is no choice to make. */
      onlyBranchId: branches.length === 1 ? branches[0].id : null,
    };
  }, [data]);
}

/** Field validator for the Branch select: it must be picked. */
export function requireBranch({ value }: { value: string | null | undefined }) {
  return value ? undefined : translationKey("errors.chooseBranch");
}

/**
 * The branch an import writes into. Returns the Branch select to show above
 * the upload (null when there is nothing to choose) and the branch to send;
 * `branchId` is null until one is picked, which blocks the upload.
 */
export function useImportBranch(): {
  branchId: string | null;
  slot: ReactNode;
} {
  const { t } = useTranslation();
  const id = useId();
  const writeBranches = useWriteBranches();
  const [picked, setPicked] = useState<string | null>(null);

  const branchId = picked ?? writeBranches.onlyBranchId;
  const slot = writeBranches.needsChoice ? (
    <Field>
      <FieldLabel htmlFor={id}>{t("organizations.branches.choose")}</FieldLabel>
      <Select
        value={picked}
        onValueChange={(value) => setPicked((value as string) ?? null)}
      >
        <SelectTrigger id={id} className="w-full sm:max-w-xs">
          <SelectValue>
            {(value) =>
              writeBranches.options.find((o) => o.value === value)?.label ?? ""
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {writeBranches.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>
        {t("organizations.branches.chooseHint")}
      </FieldDescription>
    </Field>
  ) : null;

  return { branchId, slot };
}
