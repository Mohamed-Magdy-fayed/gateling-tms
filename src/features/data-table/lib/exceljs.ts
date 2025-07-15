import { Workbook } from 'exceljs';

export const importFromExcel = async (file: File, onFileLoad: (data: any[]) => void) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        if (!event.target) return alert("error line 8: useExcelJs.ts");

        const buffer = event.target.result as ArrayBuffer;
        const workbook = new Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0]!; // First sheet
        const jsonData: Record<string, string>[] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const rowData: Record<string, string> = {};
            row.eachCell((cell, colNumber) => {
                const columnHeader = worksheet.getRow(1).getCell(colNumber).text;
                rowData[columnHeader] = String(cell.value ?? "");
            });
            jsonData.push(rowData);
        });

        onFileLoad(jsonData);
    };

    reader.readAsArrayBuffer(file);
};

export async function exportToExcel(data: any[], fileName: string, sheetName: string) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers
    if (data.length > 0) {
        worksheet.addRow(Object.keys(data[0]));
    }

    // Add rows
    data.forEach(item => {
        worksheet.addRow(Object.values(item));
    });

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${fileName}.xlsx`);
    a.click();
}

export function exportToExcelTest(data: any[]) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("sheetName");

    // Add headers
    if (data.length > 0) {
        worksheet.addRow(Object.keys(data[0]));
    }

    // Add rows
    data.forEach(item => {
        worksheet.addRow(Object.values(item));
    });
    return data
}

export async function downloadTemplate({ reqiredFields, sheetName, templateName }: { reqiredFields: string[], templateName: string, sheetName: string }) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add required fields as headers
    worksheet.addRow(reqiredFields);

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${templateName}.xlsx`);
    a.click();
}
