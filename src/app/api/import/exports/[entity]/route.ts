import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { db } from "@/drizzle";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import type { MessageKey } from "@/features/core/import/lib";
import {
  buildExportWorkbook,
  CSV_CONTENT_TYPE,
  fileResponse,
  resolveDownloadFormat,
  toLocalizedCsv,
  XLSX_CONTENT_TYPE,
} from "@/features/core/import/server";
import { findExportRowLoader } from "@/features/core/import/server/export-registry";
import { findImportTemplate } from "@/features/core/import/server/registry";
import { resolveOrgAccessFromSession } from "@/features/core/organizations/server";

/**
 * Serves the organization's own rows in its import template's shape — the same
 * localized headers, the same column order, `id` first — so export → edit →
 * upload updates what is already there instead of duplicating it
 * (`phase-07.md` step 3, STATE.md D118).
 *
 * Every row the organization has, not the page the table happens to be
 * showing. A route handler rather than a tRPC procedure for the same two
 * reasons the template download is one: the response is a file, and the XLSX
 * writer must stay server-side (STATE.md D115). The guards are the template
 * route's, which are `orgContentManagerProcedure`'s applied by hand.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity } = await params;
  const template = findImportTemplate(entity);
  const loadRows = findExportRowLoader(entity);
  if (!template || !loadRows) return new Response("Not found", { status: 404 });

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
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `${template.entity}-${stamp}.${format}`;

  const headers = template.columns.map((column) => translate(column.labelKey));
  const records = await loadRows(db, access.organizationId);
  const rows = records.map((record) =>
    template.columns.map((column) => record[column.key] ?? ""),
  );

  if (format === "csv") {
    return fileResponse(
      toLocalizedCsv(headers, rows),
      CSV_CONTENT_TYPE,
      fileName,
    );
  }

  const workbook = await buildExportWorkbook(headers, rows, {
    sheetName: translate(template.titleKey),
    rightToLeft: (await getLocaleCookie()) === "ar",
  });

  return fileResponse(workbook, XLSX_CONTENT_TYPE, fileName);
}
