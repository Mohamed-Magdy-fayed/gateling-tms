import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";

/**
 * Generated at test-setup time rather than committed as a binary fixture —
 * `exceljs` is the already-approved dependency for xlsx work
 * (docs/rebuild/02-dependencies.md, Phase 7), and a generated file avoids a
 * binary diff sitting in the repo for one test.
 *
 * Shape matches Phase 7's own manual-gate description (STATE.md "Next up"
 * item 3): 10 rows, 2 deliberately invalid, so the review screen has
 * something real to show before commit.
 */
export async function buildTraineesImportFixture(): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Trainees");
  sheet.addRow(["Id", "Name", "Phone", "Email", "Group"]);

  const rows = [
    ["", "Fatma Rageh", "+201100000010", "fatma.rageh@example.com", ""],
    ["", "Ibrahim Naguib", "+201100000011", "ibrahim.naguib@example.com", ""],
    ["", "Sondos Adly", "+201100000012", "sondos.adly@example.com", ""],
    ["", "Wael Fekry", "+201100000013", "wael.fekry@example.com", ""],
    ["", "Nesma Barakat", "+201100000014", "nesma.barakat@example.com", ""],
    ["", "Ziad Helmy", "+201100000015", "ziad.helmy@example.com", ""],
    ["", "Rana Sobhy", "+201100000016", "rana.sobhy@example.com", ""],
    // Invalid: name is required and this row leaves it blank.
    ["", "", "+201100000017", "no.name@example.com", ""],
    ["", "Bassem Fayed", "+201100000018", "bassem.fayed@example.com", ""],
    // Invalid: id is present but not a valid uuid.
    [
      "not-a-real-id",
      "Yara Kandil",
      "+201100000019",
      "yara.kandil@example.com",
      "",
    ],
  ];
  for (const row of rows) sheet.addRow(row);

  return writeWorkbook(workbook, "trainees-import.xlsx");
}

/**
 * A row count deliberately larger than the Free-plan's 50-student cap, so
 * uploading it against any org (regardless of how many trainees it already
 * has) always exercises the import dialog's capacity-cutoff warning — the
 * "Grow" step of the acceptance script (00-product-spec.md step 11).
 */
export async function buildOversizedTraineesImportFixture(
  rowCount = 60,
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Trainees");
  sheet.addRow(["Id", "Name", "Phone", "Email", "Group"]);

  for (let index = 1; index <= rowCount; index += 1) {
    const padded = String(index).padStart(3, "0");
    sheet.addRow([
      "",
      `Overflow Student ${padded}`,
      "",
      `overflow-${padded}@example.com`,
      "",
    ]);
  }

  return writeWorkbook(workbook, "trainees-import-oversized.xlsx");
}

async function writeWorkbook(
  workbook: ExcelJS.Workbook,
  fileName: string,
): Promise<string> {
  const filePath = path.join(
    await fs.mkdtemp(path.join(os.tmpdir(), "gateling-e2e-import-")),
    fileName,
  );
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}
