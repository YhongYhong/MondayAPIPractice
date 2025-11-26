import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function formatReport(analysis, templatePath = path.join(__dirname, "templates/formattedHtml.html")) {
  const { valid = false, errors = [] } = analysis;

  const color = valid ? "green" : "red";
  const validityText = valid ? "True" : "False";

  let errorListHTML = "";
  if (!valid && errors.length > 0) {
    errorListHTML = errors
      .map(
        (e) => `
        <li>
          <strong>Sheet:</strong> ${e.sheet || 'N/A'}<br/>
          <strong>Issue:</strong> ${e.issue || 'Unknown'}
        </li>
      `
      )
      .join("");
  } else {
    errorListHTML = "<li>No issues found. The file passed all validations.</li>";
  }

  try {
    const htmlTemplate = await fs.readFile(templatePath, "utf-8");
    const formattedHtml = htmlTemplate
      .replace("{{color}}", color)
      .replace("{{validityText}}", validityText)
      .replace("{{errorListHTML}}", errorListHTML);

    return formattedHtml;
  } catch (error) {
    console.error("Failed to format report:", error);
    throw new Error(`Template loading failed: ${error.message}`);
  }
}