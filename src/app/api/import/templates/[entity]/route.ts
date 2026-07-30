import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import type { MessageKey } from "@/features/core/import/lib";
import {
  buildTemplateWorkbook,
  CSV_CONTENT_TYPE,
  fileResponse,
  resolveDownloadFormat,
  type TemplateColumnDoc,
  toLocalizedCsv,
  XLSX_CONTENT_TYPE,
} from "@/features/core/import/server";
import { findImportTemplate } from "@/features/core/import/server/registry";
import { resolveOrgAccessFromSession } from "@/features/core/organizations/server";

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
  const format = resolveDownloadFormat(
    request.nextUrl.searchParams.get("format"),
  );
  const fileName = `${template.entity}-template.${format}`;
  const headers = template.columns.map((column) => translate(column.labelKey));

  if (format === "csv") {
    const exampleRow = template.columns.map((column) => column.example);
    return fileResponse(
      toLocalizedCsv(headers, [exampleRow]),
      CSV_CONTENT_TYPE,
      fileName,
    );
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
