"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GroupScheduleSlot } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

/** Index matches JS `Date#getDay()`, which is what schedule.ts expands. */
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const DEFAULT_SLOT: GroupScheduleSlot = {
  day: 1,
  startTime: "18:00",
  endTime: "20:00",
};

type GroupScheduleEditorProps = {
  disabled?: boolean;
  onChange: (schedule: GroupScheduleSlot[]) => void;
  value: GroupScheduleSlot[];
};

/**
 * Repeating weekly slots, edited as plain day + time inputs.
 *
 * Deliberately not a calendar: the thing being described is a recurring
 * pattern ("Mondays and Wednesdays at 18:00"), not a set of dates. A date
 * picker would make the operator click through individual days to express
 * something they already think of as one rule.
 */
export function GroupScheduleEditor({
  disabled,
  onChange,
  value,
}: GroupScheduleEditorProps) {
  const { t } = useTranslation();

  const updateSlot = (index: number, patch: Partial<GroupScheduleSlot>) => {
    onChange(
      value.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    );
  };

  const removeSlot = (index: number) => {
    onChange(value.filter((_slot, slotIndex) => slotIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{t("groups.slots.title")}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...value, DEFAULT_SLOT])}
        >
          <PlusIcon className="size-3.5" />
          {t("groups.slots.addSlot")}
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("groups.slots.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {value.map((slot, index) => (
            <li
              // Slots have no stable identity — they're positional entries in
              // a jsonb array, and the inputs below are fully controlled, so
              // there's no per-row state for an index key to attach wrongly.
              // biome-ignore lint/suspicious/noArrayIndexKey: positional by nature, see above
              key={index}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/40 p-3"
            >
              <div className="min-w-36 flex-1 space-y-1">
                <Label
                  htmlFor={`group-schedule-slot-${index}-day`}
                  className="text-xs"
                >
                  {t("groups.slots.day")}
                </Label>
                <Select
                  value={String(slot.day)}
                  onValueChange={(next) =>
                    updateSlot(index, { day: Number(next) })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger
                    id={`group-schedule-slot-${index}-day`}
                    className="w-full"
                  >
                    {/* Base-UI's SelectValue renders the raw value, not the
                        matching item's children — without this mapper the
                        trigger would show "1" instead of "Monday". */}
                    <SelectValue>
                      {(selected) =>
                        t(
                          `groups.days.${DAY_KEYS[Number(selected)] ?? "sunday"}`,
                        )
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_KEYS.map((dayKey, dayIndex) => (
                      <SelectItem key={dayKey} value={String(dayIndex)}>
                        {t(`groups.days.${dayKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-28 space-y-1">
                <Label
                  htmlFor={`group-schedule-slot-${index}-start-time`}
                  className="text-xs"
                >
                  {t("groups.slots.startTime")}
                </Label>
                <Input
                  id={`group-schedule-slot-${index}-start-time`}
                  type="time"
                  value={slot.startTime}
                  disabled={disabled}
                  onChange={(event) =>
                    updateSlot(index, { startTime: event.target.value })
                  }
                />
              </div>

              <div className="w-28 space-y-1">
                <Label
                  htmlFor={`group-schedule-slot-${index}-end-time`}
                  className="text-xs"
                >
                  {t("groups.slots.endTime")}
                </Label>
                <Input
                  id={`group-schedule-slot-${index}-end-time`}
                  type="time"
                  value={slot.endTime}
                  disabled={disabled}
                  onChange={(event) =>
                    updateSlot(index, { endTime: event.target.value })
                  }
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                disabled={disabled}
                aria-label={t("groups.slots.removeSlot")}
                onClick={() => removeSlot(index)}
              >
                <XIcon className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
