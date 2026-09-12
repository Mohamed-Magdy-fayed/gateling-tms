"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, SaveIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAppForm } from "@/components/forms/hooks";
import { Button } from "@/components/ui/button";
import { FieldSet } from "@/components/ui/field";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import type { SystemSettingRow } from "@/features/system/settings/server";
import { updateSystemSettingSchema } from "@/features/system/settings/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

const valueFormSchema = z.object({
  value: updateSystemSettingSchema.shape.value,
});

type SettingValueFormProps = {
  setting: SystemSettingRow;
};

/**
 * One setting, one field, one Save. A secret's stored value never comes back
 * from the server, so its field starts empty with a "paste to replace"
 * placeholder and a Set / Not set tag beside the label says whether there is
 * one; Clear writes an empty value, which is how an integration is
 * disconnected.
 */
export function SettingValueForm({ setting }: SettingValueFormProps) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateMut = useMutation(trpc.settings.update.mutationOptions());

  const form = useAppForm({
    defaultValues: { value: setting.value ?? "" },
    validators: { onSubmit: valueFormSchema },
    onSubmit: async ({ value }) => submit(value.value),
  });

  // A secret's field is deliberately reset to empty after every save — what
  // was typed is now stored and must not linger on screen.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when the row itself changes
  useEffect(() => {
    form.reset({ value: setting.value ?? "" });
  }, [setting.value, setting.updatedAt]);

  async function submit(value: string) {
    try {
      await updateMut.mutateAsync({ code: setting.code, value });
      await queryClient.invalidateQueries({
        queryKey: trpc.settings.pathKey(),
      });
      // Live classes switch on or off with these values, so the agenda's
      // "not set up" notice has to follow immediately.
      await queryClient.invalidateQueries({
        queryKey: trpc.sessions.pathKey(),
      });
      toast.success(t("settings.saved"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("settings.saveFailed"),
      );
    }
  }

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form],
  );

  const pending = updateMut.isPending;
  const label = t(`settings.names.${setting.code}`);
  const description = t(`settings.descriptions.${setting.code}`);
  const updatedAt = setting.updatedAt
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(setting.updatedAt)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FieldSet disabled={pending}>
        <form.AppField name="value">
          {(field) =>
            setting.isSecret ? (
              <field.PasswordField
                label={label}
                description={description}
                placeholder={
                  setting.hasValue ? t("settings.secretPlaceholder") : undefined
                }
              />
            ) : (
              <field.StringField
                label={label}
                description={description}
                inputType="url"
              />
            )
          }
        </form.AppField>
      </FieldSet>

      <div className="flex flex-wrap items-center gap-2">
        <Tag color={setting.hasValue ? "green" : "neutral"}>
          {t(setting.hasValue ? "settings.set" : "settings.notSet")}
        </Tag>
        {updatedAt ? (
          <span className="text-muted-foreground text-xs">
            {t("settings.updatedAt", { time: updatedAt })}
          </span>
        ) : null}
        <div className="ms-auto flex items-center gap-2">
          {setting.hasValue ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => submit("")}
            >
              <Trash2Icon className="size-3.5" />
              {t("settings.clear")}
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <SaveIcon className="size-3.5" />
            )}
            {t("settings.save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
