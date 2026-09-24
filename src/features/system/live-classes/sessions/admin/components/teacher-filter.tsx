"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import type { TeacherOption } from "./session-edit-dialog";

export const TEACHER_PARAM = "teacher";
const ALL_TEACHERS = "all";

/**
 * The calendar's teacher filter, shared by the week and month views: the
 * staff list, and the selected teacher kept in `?teacher=` so it survives
 * switching views and sharing a link.
 *
 * The list asks the server for admins and teachers only. Fetching a page of
 * every member and dropping students afterwards lost teachers as soon as an
 * academy passed a hundred members.
 */
export function useTeacherFilter({
  enabled,
  onTeacherChange,
}: {
  /** Staff only — a student's calendar has no teacher filter. */
  enabled: boolean;
  /** Runs before the filter changes, e.g. to leave availability painting. */
  onTeacherChange?: () => void;
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: members } = useQuery({
    ...trpc.organizations.members.list.queryOptions({
      page: 1,
      perPage: 100,
      sorting: [],
      roles: ["admin", "teacher"],
    }),
    enabled,
  });
  const teacherOptions = useMemo<TeacherOption[]>(
    () =>
      (members?.rows ?? []).map((member) => ({
        value: member.userId,
        label: member.name || member.email || member.userId,
      })),
    [members],
  );

  const teacherParam = searchParams.get(TEACHER_PARAM);
  const teacherId =
    teacherParam && teacherParam !== ALL_TEACHERS ? teacherParam : undefined;
  const selectedTeacher = teacherOptions.find((o) => o.value === teacherId);

  const setTeacher = useCallback(
    (next: string | null) => {
      onTeacherChange?.();
      const params = new URLSearchParams(searchParams.toString());
      if (next && next !== ALL_TEACHERS) params.set(TEACHER_PARAM, next);
      else params.delete(TEACHER_PARAM);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [onTeacherChange, pathname, router, searchParams],
  );

  return { teacherId, teacherOptions, selectedTeacher, setTeacher };
}

export function TeacherFilterSelect({
  id,
  teacherId,
  teacherOptions,
  onChange,
}: {
  id: string;
  teacherId: string | undefined;
  teacherOptions: TeacherOption[];
  onChange: (next: string | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Label htmlFor={id} className="text-xs">
        {t("sessions.calendar.teacher")}
      </Label>
      <Select value={teacherId ?? ALL_TEACHERS} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full sm:w-48">
          <SelectValue>
            {(selected) =>
              teacherOptions.find((o) => o.value === selected)?.label ??
              t("sessions.calendar.allTeachers")
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TEACHERS}>
            {t("sessions.calendar.allTeachers")}
          </SelectItem>
          {teacherOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
