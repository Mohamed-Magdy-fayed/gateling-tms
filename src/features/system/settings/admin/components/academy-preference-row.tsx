"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  InfoIcon,
  Loader2Icon,
  RotateCcwIcon,
  SaveIcon,
} from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { normalizeDigits } from "@/lib/normalize-digits";
import { cn } from "@/lib/utils";
import { academySettingValueSchema } from "../../lib/academy-settings";
import type { AcademySettingRow, AcademySettingValue } from "../../server";
import {
  AcademyPreferenceControl,
  type PreferenceDraft,
} from "./academy-preference-control";
import {
  formatPreferenceNumber,
  formatPreferenceValue,
  preferenceText,
} from "./academy-preference-labels";
import { PreferenceConfirmDialog } from "./preference-confirm-dialog";

type Confirm =
  | { kind: "reapply"; value: AcademySettingValue }
  | { kind: "reset" };

/**
 * One preference: label and description at the start, its control at the
 * end, the effect hint underneath (design 8B, R3).
 *
 * Save model (design 3A): a future-only switch or select saves the moment it
 * changes, optimistically, and rolls back on failure. A number, or anything
 * that re-applies to scheduled classes, is staged behind Save — and a
 * re-applying Save asks first. A failed staged save keeps what was typed and
 * says nothing changed (5A): the server rolled the whole save back.
 */
export function AcademyPreferenceRow({
  setting,
}: {
  setting: AcademySettingRow;
}) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const ids = useRowIds();

  const [optimistic, setOptimistic] = useState<AcademySettingValue | null>(
    null,
  );
  const [draft, setDraft] = useState<PreferenceDraft | null>(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const updateMut = useMutation(trpc.settings.academy.update.mutationOptions());
  const resetMut = useMutation(trpc.settings.academy.reset.mutationOptions());
  const pending = updateMut.isPending || resetMut.isPending;

  const isStaged =
    setting.appliesTo === "reapply" || setting.control.kind === "number";
  const shown = draft ?? optimistic ?? setting.value;
  const isDirty = draft !== null && String(draft) !== String(setting.value);
  const name = preferenceText(t, setting.code, "label");
  const describe = (value: AcademySettingValue) =>
    formatPreferenceValue(t, locale, setting.code, setting.control, value);

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.settings.academy.pathKey(),
    });

  async function saveNow(value: AcademySettingValue) {
    setOptimistic(value);
    try {
      await updateMut.mutateAsync({ code: setting.code, value });
      await refresh();
      toast.success(t("academySettings.saved"));
    } catch {
      toast.error(t("academySettings.saveFailed"));
    } finally {
      setOptimistic(null);
    }
  }

  async function commitStaged(value: AcademySettingValue) {
    try {
      await updateMut.mutateAsync({ code: setting.code, value });
      await refresh();
      setDraft(null);
      setSaveFailed(false);
      toast.success(t("academySettings.saved"));
    } catch {
      setSaveFailed(true);
    } finally {
      setConfirm(null);
    }
  }

  function handleSave() {
    const value = parseDraft(setting, draft ?? setting.value);
    if (value === undefined) {
      setIsInvalid(true);
      return;
    }
    if (setting.appliesTo === "reapply") setConfirm({ kind: "reapply", value });
    else void commitStaged(value);
  }

  async function handleReset() {
    try {
      await resetMut.mutateAsync({ code: setting.code });
      await refresh();
      setDraft(null);
      setSaveFailed(false);
      setIsInvalid(false);
      toast.success(t("academySettings.resetDone"));
    } catch {
      toast.error(t("academySettings.resetFailed"));
    } finally {
      setConfirm(null);
    }
  }

  function handleChange(value: PreferenceDraft) {
    if (!isStaged) {
      void saveNow(value);
      return;
    }
    setDraft(value);
    setIsInvalid(false);
    setSaveFailed(false);
  }

  const describedBy = [ids.description, ids.effect, isInvalid && ids.error]
    .filter(Boolean)
    .join(" ");
  // A switch stays inline at the end even on a phone; a select or number
  // box drops under its label (design 11A).
  const isInline = setting.control.kind === "boolean";

  return (
    <div className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div
        className={cn(
          "flex gap-3",
          isInline
            ? "items-start justify-between"
            : "flex-col sm:flex-row sm:items-start sm:justify-between",
        )}
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <FieldLabel htmlFor={ids.control} className="font-medium text-sm">
              {name}
            </FieldLabel>
            {setting.isCustom ? (
              <Tag color="violet">{t("academySettings.custom")}</Tag>
            ) : null}
          </div>
          <p id={ids.description} className="text-muted-foreground text-sm">
            {preferenceText(t, setting.code, "description")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 max-sm:w-full sm:justify-end">
          <AcademyPreferenceControl
            id={ids.control}
            code={setting.code}
            control={setting.control}
            value={shown}
            disabled={pending}
            isInvalid={isInvalid}
            describedBy={describedBy}
            onChange={handleChange}
          />
          {pending && !isStaged ? (
            <Loader2Icon
              aria-hidden
              className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
            />
          ) : null}
          {isStaged && isDirty ? (
            <Button
              type="button"
              size="sm"
              className="max-sm:min-h-11"
              disabled={pending}
              onClick={handleSave}
            >
              {updateMut.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin motion-reduce:animate-none" />
              ) : (
                <SaveIcon className="size-3.5" />
              )}
              {t(
                updateMut.isPending
                  ? "academySettings.saving"
                  : "academySettings.save",
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {isInvalid && setting.control.kind === "number" ? (
        <p id={ids.error} role="alert" className="text-destructive text-sm">
          {t("academySettings.invalidNumber", {
            min: formatPreferenceNumber(setting.control.min, locale),
            max: formatPreferenceNumber(setting.control.max, locale),
            step: formatPreferenceNumber(setting.control.step, locale),
          })}
        </p>
      ) : null}

      <EffectHint id={ids.effect} setting={setting} />

      {saveFailed ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription>
            {t("settings.errors.reapplyFailed")}
          </AlertDescription>
        </Alert>
      ) : null}

      {setting.isCustom ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {t("academySettings.defaultIs", {
              value: describe(setting.defaultValue),
            })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="max-sm:min-h-11"
            disabled={pending}
            onClick={() => setConfirm({ kind: "reset" })}
          >
            <RotateCcwIcon className="size-3.5" />
            {t("academySettings.reset")}
          </Button>
        </div>
      ) : null}

      <PreferenceConfirmDialog
        open={confirm !== null}
        pending={pending}
        {...confirmCopy(confirm, setting, name, describe, t)}
        onConfirm={() => {
          if (confirm?.kind === "reapply") void commitStaged(confirm.value);
          else void handleReset();
        }}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirm(null);
        }}
      />
    </div>
  );
}

function EffectHint({
  id,
  setting,
}: {
  id: string;
  setting: AcademySettingRow;
}) {
  const { t, locale } = useTranslation();
  const isReapply = setting.appliesTo === "reapply";
  const range =
    setting.control.kind === "number"
      ? t("academySettings.range", {
          min: formatPreferenceNumber(setting.control.min, locale),
          max: formatPreferenceNumber(setting.control.max, locale),
          unit: preferenceText(t, setting.code, "unit"),
        })
      : null;

  return (
    <p
      id={id}
      className={cn(
        "flex items-start gap-1.5 text-xs",
        isReapply ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {isReapply ? (
        <AlertTriangleIcon
          aria-hidden
          className="mt-px size-3.5 shrink-0 text-warning"
        />
      ) : (
        <InfoIcon aria-hidden className="mt-px size-3.5 shrink-0" />
      )}
      <span>
        {range ? <span className="me-1">{range} ·</span> : null}
        {t(
          isReapply
            ? "academySettings.effectReapply"
            : "academySettings.effectFuture",
        )}
      </span>
    </p>
  );
}

/** The draft as a storable value, or `undefined` when it isn't one. */
function parseDraft(
  setting: AcademySettingRow,
  draft: PreferenceDraft,
): AcademySettingValue | undefined {
  const candidate =
    setting.control.kind === "number" && typeof draft === "string"
      ? parseNumberText(draft)
      : draft;
  const parsed = academySettingValueSchema(setting.control).safeParse(
    candidate,
  );
  return parsed.success ? parsed.data : undefined;
}

function parseNumberText(text: string): number | undefined {
  const normalized = normalizeDigits(text).trim();
  if (normalized === "") return undefined;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

type Translate = ReturnType<typeof useTranslation>["t"];

function confirmCopy(
  confirm: Confirm | null,
  setting: AcademySettingRow,
  name: string,
  describe: (value: AcademySettingValue) => string,
  t: Translate,
) {
  if (confirm?.kind === "reapply") {
    return {
      title: t("academySettings.reapplyTitle"),
      description: t("academySettings.reapplyDescription", {
        name,
        value: describe(confirm.value),
      }),
      confirmLabel: t("academySettings.reapplyConfirm"),
    };
  }
  const reset = t("academySettings.resetDescription", {
    value: describe(setting.defaultValue),
  });
  return {
    title: t("academySettings.resetTitle", { name }),
    description:
      setting.appliesTo === "reapply"
        ? `${reset} ${t("academySettings.resetReapply")}`
        : reset,
    confirmLabel: t("academySettings.resetConfirm"),
  };
}

function useRowIds() {
  const base = useId();
  return {
    control: `${base}-control`,
    description: `${base}-description`,
    effect: `${base}-effect`,
    error: `${base}-error`,
  };
}
