import fs from "fs";
import path from "path";

import { readExcelAsJson } from "../excel/readExcel.mjs";
import { askAI } from "../ai/askAI.mjs";
import { sendEmailWithAttachment } from "../email/sendEmail.mjs";
import { extractSafeJson } from "../ai/extractSafeJson.mjs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const promptTemplate = fs.readFileSync(
  path.join(__dirname, "../ai/prompts/rfcPrompt.txt"),
  "utf-8"
);

const excelJson = readExcelAsJson("files/input/RFC_mock.xlsx");

const prompt = promptTemplate.replace("{{excel_json}}", JSON.stringify(excelJson, null, 2));
console.log("FINAL PROMPT:", prompt);

const resultRaw = await askAI(prompt);
console.log("AI RESULT RAW:", resultRaw);

const resultJson = JSON.parse(resultRaw.trim()
                                      .replace(/^```(json)?/, '')
                                      .replace(/```$/, ''));
console.log("AI RESULT PARSED:", resultJson);

const { valid, errors } = resultJson;

const color = valid ? "green" : "red";
const validityText = valid ? "True" : "False";

let errorListHTML = "";

if (!valid && errors?.length > 0) {
  errorListHTML = errors
    .map(
      (e) => `
      <li>
        <strong>Sheet:</strong> ${e.sheet}<br/>
        <strong>Issue:</strong> ${e.issue}
      </li>
    `
    )
    .join("");
} else {
  errorListHTML = "<li>No issues found. The file passed all validations.</li>";
}

const templatePath = path.join(__dirname, "../email/templates/formattedHtml.html");
const htmlTemplate = fs.readFileSync(templatePath, "utf-8");
const formattedHtml = htmlTemplate
  .replace("{{color}}", color)
  .replace("{{validityText}}", validityText)
  .replace("{{errorListHTML}}", errorListHTML);

await sendEmailWithAttachment({
  to: "prommm33@gmail.com",
  subject: "AI Analysis Result + Excel File",
  text: "Please see the detailed analysis in the HTML version of this email.",
  html: formattedHtml,
  attachmentPath: "files/input/RFC_mock.xlsx"
});

console.log("Email sent successfully!");
