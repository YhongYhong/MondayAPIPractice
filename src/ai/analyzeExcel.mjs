import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { readExcelAsJson } from "../excel/readExcel.mjs";
import { askAI } from "./askAI.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function analyzeExcel(excelFilePath, promptTemplatePath, options = {}) {
  const { timeout = 30000 } = options;

  try {
    const excelJson = await readExcelAsJson(excelFilePath);

    const promptTemplate = await fs.readFile(promptTemplatePath, "utf-8");

    console.log("EXCEL JSON:", JSON.stringify(excelJson, null, 2));
    const prompt = promptTemplate.replace("{{excel_json}}", JSON.stringify(excelJson, null, 2));
    console.log("FINAL PROMPT:", prompt);

    const resultRaw = await askAI(prompt, { timeout });
    console.log("AI RESULT RAW:", resultRaw);

    const cleanedOutput = resultRaw
      .trim()
      .replace(/^```(json)?/, '')
      .replace(/```$/, '');

    let resultJson;
    try {
      resultJson = JSON.parse(cleanedOutput);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      throw new Error("Failed to parse AI response as JSON");
    }

    console.log("AI RESULT PARSED:", resultJson);

    const { valid = false, errors = [] } = resultJson;
    return { valid, errors };
  } catch (error) {
    console.error("Excel analysis failed:", error);
    throw error;
  }
}