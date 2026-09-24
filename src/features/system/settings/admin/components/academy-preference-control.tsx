"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/features/core/i18n/client";
import type { AcademySettingControl } from "../../lib/academy-settings-registry";
import type { AcademySettingValue } from "../../server";
import { preferenceText } from "./academy-preference-labels";

/**
 * What the control is showing: a boolean or enum value, or — for a number —
 * the raw text in the box, which may be mid-edit and not yet a valid number.
 */
export type PreferenceDraft = AcademySettingValue;

type AcademyPreferenceControlProps = {
  id: string;
  code: string;
  control: AcademySettingControl;
  value: PreferenceDraft;
  disabled: boolean;
  isInvalid: boolean;
  describedBy: string;
  onChange: (value: PreferenceDraft) => void;
};

/**
 * The widget a preference declares (R4, design 10A): a switch, a select, or a
 * number box with its unit at the inline end. Presentational only — the row
 * decides whether a change saves at once or waits for Save.
 */
export function AcademyPreferenceControl({
  id,
  code,
  control,
  value,
  disabled,
  isInvalid,
  describedBy,
  onChange,
}: AcademyPreferenceControlProps) {
  const { t } = useTranslation();

  switch (control.kind) {
    case "boolean":
      return (
        <Switch
          id={id}
          checked={value === true}
          disabled={disabled}
          aria-describedby={describedBy}
          onCheckedChange={(checked) => onChange(checked)}
        />
      );
    case "enum":
      return (
        <Select
          value={String(value)}
          disabled={disabled}
          onValueChange={(next) => {
            if (next != null) onChange(next);
          }}
        >
          <SelectTrigger
            id={id}
            aria-describedby={describedBy}
            className="w-full max-sm:h-11 sm:min-w-44"
          >
            <SelectValue>
              {(selected) =>
                selected
                  ? preferenceText(t, code, `options.${String(selected)}`)
                  : ""
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {control.options.map((option) => (
              <SelectItem key={option} value={option}>
                {preferenceText(t, code, `options.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "number":
      return (
        <InputGroup className="max-sm:h-11 sm:w-auto sm:min-w-36">
          <InputGroupInput
            id={id}
            // Text, not type="number": an Arabic keyboard types ٣٠, which a
            // number input silently drops. The row normalises the digits.
            type="text"
            inputMode="decimal"
            dir="ltr"
            className="text-start"
            value={String(value)}
            disabled={disabled}
            aria-invalid={isInvalid || undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            {preferenceText(t, code, "unit")}
          </InputGroupAddon>
        </InputGroup>
      );
  }
}
