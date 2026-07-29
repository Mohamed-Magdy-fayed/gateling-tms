"use client";

import { AlertTriangleIcon } from "lucide-react";
import { translateFormErrorMessage } from "@/components/forms/validation-messages";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
import { Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import type { mainTranslations } from "@/features/core/i18n/global";
import type { TranslationKey } from "@/features/core/i18n/lib";
import type { ImportPreviewResult } from "../../lib";

type ImportReviewProps = {
  preview: ImportPreviewResult;
};

/**
 * The review screen: what will happen to each row before anything is written.
 * Rows past the plan's remaining capacity are dimmed rather than hidden, so a
 * user on a full plan can see exactly which students didn't make the cut.
 */
export function ImportReview({ preview }: ImportReviewProps) {
  const { t, locale } = useTranslation();

  const translateIssue = (message: string) =>
    translateFormErrorMessage(
      (key) => t(key as TranslationKey<typeof mainTranslations>, {}),
      message,
      { locale, fallbackLocale: "en" },
    ) ?? message;

  const createCount = preview.validRows
    .slice(0, preview.importableCount)
    .filter((row) => row.action === "create").length;
  const updateCount = preview.importableCount - createCount;
  const isCapped = preview.importableCount < preview.validRows.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tag color="green">
          {t("import.reviewValid", { count: preview.validRows.length })}
        </Tag>
        {preview.invalidRows.length > 0 && (
          <Tag color="orange">
            {t("import.reviewInvalid", { count: preview.invalidRows.length })}
          </Tag>
        )}
        <Tag color="blue">
          {t("import.reviewCreates", { count: createCount })}
        </Tag>
        <Tag>{t("import.reviewUpdates", { count: updateCount })}</Tag>
      </div>

      {preview.unknownHeaders.length > 0 && (
        <Alert>
          <AlertTriangleIcon className="size-4" />
          <AlertDescription>
            {t("import.unknownHeaders", { columns: preview.unknownHeaders })}
          </AlertDescription>
        </Alert>
      )}

      {isCapped && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertDescription>
            {preview.importableCount === 0
              ? t("import.nothingImportable")
              : t("import.limitWarning", {
                  importable: preview.importableCount,
                })}
          </AlertDescription>
        </Alert>
      )}

      <div className="max-h-80 overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("import.rowNumber")}</TableHead>
              {preview.columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead>{t("import.actionColumn")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.validRows.map((row, index) => (
              <TableRow
                key={row.rowNumber}
                className={index >= preview.importableCount ? "opacity-50" : ""}
              >
                <TableCell>{row.rowNumber}</TableCell>
                {preview.columns.map((column) => (
                  <TableCell key={column.key}>
                    {row.values[column.key]}
                  </TableCell>
                ))}
                <TableCell>
                  <Tag color={row.action === "create" ? "green" : "blue"}>
                    {row.action === "create"
                      ? t("import.actionCreate")
                      : t("import.actionUpdate")}
                  </Tag>
                </TableCell>
              </TableRow>
            ))}
            {preview.invalidRows.map((row) => (
              <TableRow key={`invalid-${row.rowNumber}`}>
                <TableCell>{row.rowNumber}</TableCell>
                {preview.columns.map((column) => (
                  <TableCell key={column.key}>
                    {row.values[column.key]}
                  </TableCell>
                ))}
                <TableCell>
                  <Muted className="text-destructive">
                    {row.errors
                      .map((issue) => translateIssue(issue.message))
                      .join(" · ")}
                  </Muted>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
