import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { uploadToMonday } from "../monday/upload.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const itemId = 2516956384;
const columnId = "file_mky75w4f";

export const simulateCreateHandler = async (req, res) => {
  try {
    const templatePath = path.join(__dirname, "../../files/template/RFC_template.xlsx");
    const buffer = await fs.readFile(templatePath);

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, "../../temp");
    await fs.mkdir(tempDir, { recursive: true });

    const tempFilename = Date.now() + "-RFC_template.xlsx";
    const tempPath = path.join(tempDir, tempFilename);
    await fs.writeFile(tempPath, buffer);

    const result = await uploadToMonday(tempPath, "RFC_template.xlsx", itemId, columnId);
    await fs.unlink(tempPath);
    const fileUrl = `https://files.monday.com/files/${result.id}/${result.filename}`;
    res.json({ ok: true, fileUrl });
  } catch (error) {
    console.error("Simulation failed:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
}