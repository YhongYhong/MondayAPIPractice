import path from "path";
import { fileURLToPath } from "url";

import { analyzeExcel } from "./ai/analyzeExcel.mjs";
import { formatReport } from "./email/formatReport.mjs";
import { sendEmailWithAttachment } from "./email/sendEmail.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const excelFilePath = "files/input/RFC_mock.xlsx";
    const promptTemplatePath = path.join(__dirname, "ai/prompts/rfcPrompt.txt");

    const analysis = await analyzeExcel(excelFilePath, promptTemplatePath);
    console.log("Analysis complete:", analysis);

    const html = await formatReport(analysis);
    console.log("Report formatted.");

    await sendEmailWithAttachment({
      to: "prommm33@gmail.com",
      subject: "AI Analysis Result + Excel File",
      text: "Please see the detailed analysis in the HTML version of this email.",
      html,
      attachmentPath: excelFilePath
    });

    console.log("Workflow completed successfully!");
  } catch (error) {
    console.error("Workflow failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);