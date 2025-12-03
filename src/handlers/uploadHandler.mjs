import { uploadToMonday } from "../monday/upload.mjs";
import fs from "fs/promises";

export const uploadHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No file uploaded" });
    }

    console.log('Uploading file:', req.file)
    const tempPath = req.file.path;
    const result = await uploadToMonday(tempPath, req.file.originalname);

    // Cleanup temp file
    await fs.unlink(tempPath);

    res.json({ ok: true, ...result });
  } catch (error) {
    console.error("Upload failed:", error);

    // Cleanup temp file on error
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json({ ok: false, error: error.message });
  }
};