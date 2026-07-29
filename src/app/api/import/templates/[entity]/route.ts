import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { rowsToCsv } from "@/features/core/data-table/lib/csv";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import type { MessageKey } from "@/features/core/import/lib";
import {
  buildTemplateWorkbook,
  type TemplateColumnDoc,
} from "@/features/core/import/server";
import { findImportTemplate } from "@/features/core/import/server/registry";
import { resolveOrgAccessFromSession } from "@/features/core/organizations/server";

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Makes Excel open a UTF-8 CSV as UTF-8 instead of the local code page. */
const UTF8_BYTE_ORDER_MARK = "﻿";

function fileResponse(
  body: string | ArrayBuffer,
  contentType: string,
  fileName: string,
): Response {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Serves the per-entity import template as XLSX (default) or CSV, with the
 * headers in the caller's own locale — the same headers `mapHeaders` accepts
 * back, so an Arabic template round-trips unchanged.
 *
 * A route handler rather than a tRPC procedure because the response is a file
 * download, not JSON. Everything a procedure would enforce is applied by hand:
 * a session with an active organization, and a role that may manage content.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity } = await params;
  const template = findImportTemplate(entity);
  if (!template) return new Response("Not found", { status: 404 });

  const access = await resolveOrgAccessFromSession(await cookies());
  if (!access) return new Response("Unauthorized", { status: 401 });
  if (access.role === "student") {
    return new Response("Forbidden", { status: 403 });
  }

  const { t } = await getT();
  const translate = (key: MessageKey) => t(key, {});
  const format =
    request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const fileName = `${template.entity}-template.${format}`;
  const headers = template.columns.map((column) => translate(column.labelKey));

  if (format === "csv") {
    const exampleRow = Object.fromEntries(
      template.columns.map((column, index) => [headers[index], column.example]),
    );
    const csv = UTF8_BYTE_ORDER_MARK + rowsToCsv(headers, [exampleRow]);
    return fileResponse(csv, "text/csv; charset=utf-8", fileName);
  }

  const workbook = await buildTemplateWorkbook(
    template.columns.map(
      (column, index): TemplateColumnDoc => ({
        label: headers[index],
        required: column.required,
        example: column.example,
        hint: column.hintKey ? translate(column.hintKey) : "",
      }),
    ),
    {
      dataSheetName: translate(template.titleKey),
      referenceSheetName: translate("import.template.referenceSheet"),
      referenceHeaders: {
        column: translate("import.template.columnHeading"),
        required: translate("import.template.requiredHeading"),
        notes: translate("import.template.notesHeading"),
      },
      requiredYes: translate("import.template.requiredYes"),
      requiredNo: translate("import.template.requiredNo"),
      rightToLeft: (await getLocaleCookie()) === "ar",
    },
  );

  return fileResponse(workbook, XLSX_CONTENT_TYPE, fileName);
}
