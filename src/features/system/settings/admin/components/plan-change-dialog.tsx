"use client";

import { AlertTriangleIcon, CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/features/core/i18n/client";
import { toStorageDisplay } from "@/features/core/organizations/lib/plan-usage";
import { PLAN_LIMITS } from "@/features/core/organizations/server/limits";
import type { PlanChangeRequest } from "./academies-table-columns";

type PlanChangeDialogProps = {
  request: PlanChangeRequest | null;
  pending: boolean;
  onConfirm: (request: PlanChangeRequest) => void;
  onOpenChange: (open: boolean) => void;
};

/**
 * Names the academy and the change before a plan is set (design 6A). For a
 * downgrade, every limit the academy is already past gets its own warning:
 * nothing is deleted, but it can't add more. Cancel is first in the footer
 * and takes focus, so an accidental Enter changes nothing.
 */
export function PlanChangeDialog({
  request,
  pending,
  onConfirm,
  onOpenChange,
}: PlanChangeDialogProps) {
  const { t } = useTranslation();
  const warnings = request ? overLimitWarnings(request, t) : [];

  return (
    <AlertDialog open={request != null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle dir="auto">
            {request
              ? t("settings.academies.confirmTitle", {
                  name: request.organization.name,
                })
              : ""}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {request
              ? t("settings.academies.confirmDescription", {
                  from: t(`organizations.plan.${request.organization.plan}`),
                  to: t(`organizations.plan.${request.plan}`),
                })
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {warnings.length ? (
          <Alert variant="warning">
            <AlertTriangleIcon />
            <AlertDescription>
              <p>{t("settings.academies.confirmDowngrade")}</p>
              <ul className="list-disc space-y-1 ps-5">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel autoFocus disabled={pending}>
            <XIcon className="size-3.5" />
            {t("actions.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              if (request) onConfirm(request);
            }}
          >
            {pending ? (
              <Loader2Icon className="size-3.5 animate-spin motion-reduce:animate-none" />
            ) : (
              <CheckIcon className="size-3.5" />
            )}
            {t("settings.academies.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type Translate = ReturnType<typeof useTranslation>["t"];

function overLimitWarnings(
  { organization, plan }: PlanChangeRequest,
  t: Translate,
): string[] {
  const limits = PLAN_LIMITS[plan];
  const warnings: string[] = [];

  if (
    limits.maxStudents !== null &&
    organization.studentCount > limits.maxStudents
  ) {
    warnings.push(
      t("settings.academies.overStudents", {
        used: organization.studentCount,
        limit: limits.maxStudents,
      }),
    );
  }
  if (
    limits.maxCourses !== null &&
    organization.courseCount > limits.maxCourses
  ) {
    warnings.push(
      t("settings.academies.overCourses", {
        used: organization.courseCount,
        limit: limits.maxCourses,
      }),
    );
  }
  if (organization.storageBytes > limits.maxStorageBytes) {
    const format = (bytes: number) => {
      const { amount, unit } = toStorageDisplay(bytes);
      return unit === "gb"
        ? t("organizations.usage.gigabytes", { amount })
        : t("organizations.usage.megabytes", { amount });
    };
    warnings.push(
      t("settings.academies.overStorage", {
        used: format(organization.storageBytes),
        limit: format(limits.maxStorageBytes),
      }),
    );
  }

  return warnings;
}
