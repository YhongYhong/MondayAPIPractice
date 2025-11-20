import fs from "fs";
import path from "path";

import { readExcelAsJson } from "./excel/readExcel.mjs";
import { askAI } from "./ai/askAI.mjs";
import { sendEmailWithAttachment } from "./email/sendEmail.mjs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const promptTemplate = fs.readFileSync(
  path.join(__dirname, "ai/prompts/rfcPrompt.txt"),
  "utf-8"
);

const excelJson = readExcelAsJson("RFC_mock.xlsx");

const prompt = promptTemplate.replace("{{excel_json}}", JSON.stringify(excelJson, null, 2));

console.log("FINAL PROMPT:", prompt);

const result = await askAI(prompt);
console.log("AI RESULT:", result);

const formattedHtml = `
<h2>AI Analysis Report – Validation Summary</h2>

<p>The automated analysis of your submitted RFC Excel file has been completed. The system has identified several issues that require your attention. Please review the details below:</p>

<h3>Overall Validation Status</h3>
<p><strong>Valid:</strong> <span style="color:red;">False</span></p>

<h3>Identified Issues</h3>

<ul>
  <li><strong>Sheet: Preparation Task</strong><br>
      Column <em>Owner</em> is empty in row <strong>1.2</strong>.
  </li>

  <li><strong>Sheet: Configuration Step</strong><br>
      Inconsistent numbering detected. Step identifiers should follow logical or chronological sequence within their respective sections.<br>
      The step <strong>3.1</strong> appears out of order in relation to previous tasks.
  </li>

  <li><strong>Sheet: Configuration Steps</strong><br>
      Steps <strong>5 to 8</strong> are missing required configuration details such as commands or specific procedures.<br>
      For example, step <strong>4.</strong> should include a command such as:<br>
      <code>sudo /usr/local/qualys/cloud-agent/bin/qualys-cloud-agent.sh &lt;arguments&gt;</code>
  </li>

  <li><strong>Sheet: Roll Back Plan</strong><br>
      Step <strong>3.1</strong> and subsequent steps lack rollback procedures.<br>
      Detailed rollback actions are important for safely reverting changes during the installation process.
  </li>

  <li><strong>Sheet: All</strong><br>
      Missing Owner assignments in <strong>Preparation Task</strong> and incomplete sections across multiple sheets.<br>
      All sections must be consistent, complete, and formatted correctly to ensure accurate execution of the cybersecurity enhancement procedures.
  </li>
</ul>

<p>Please review and update the RFC document accordingly.<br>
If you need automated correction or revalidation, feel free to resubmit the updated file.</p>

<p>Best regards,<br>
AI Automation System</p>
`;


await sendEmailWithAttachment({
    to: "prommm33@gmail.com",
    subject: "AI Analysis Result + Excel File",
    text: "Please see the detailed analysis in the HTML version of this email.",
    html: formattedHtml,
    attachmentPath: "RFC_mock.xlsx"
  });

console.log("Email sent successfully!");