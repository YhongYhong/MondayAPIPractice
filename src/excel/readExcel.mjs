import XLSX from "xlsx";
import fs from "fs/promises";
import path from "path";

export async function readExcelAsJson(fileName, options = {}) {
  const { sheets: specificSheets, header = 1, raw = false } = options;

  // Validation
  if (typeof fileName !== "string" || fileName.trim().length === 0) {
    throw new Error("fileName must be a non-empty string");
  }

  let workbook;
  try {
    // Check if file exists
    await fs.access(fileName);
    workbook = XLSX.readFile(fileName);
  } catch (accessError) {
    throw new Error(`Excel file not found or inaccessible: ${fileName}. Error: ${accessError.message}`);
  }

  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("Invalid Excel file: No sheets found");
  }

  const result = {};
  const sheetsToProcess = specificSheets || workbook.SheetNames;

  for (const sheetName of sheetsToProcess) {
    if (!workbook.SheetNames.includes(sheetName)) {
      console.warn(`Sheet '${sheetName}' not found, skipping.`);
      continue;
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.warn(`Worksheet for '${sheetName}' is empty, skipping.`);
      continue;
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header,
      raw,
      defval: null // Handle empty cells consistently
    });

    result[sheetName] = jsonData;
  }

  if (Object.keys(result).length === 0) {
    throw new Error("No valid sheets processed from the Excel file");
  }

  return result;
}
