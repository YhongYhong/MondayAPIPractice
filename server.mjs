import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { sendEmailWithAttachment } from "./src/email/sendEmail.mjs";
import { formatReport } from "./src/email/formatReport.mjs";
import fs from "fs/promises";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

app.post("/approve", async (req, res) => {
  const { step, approved } = req.body;

  console.log("Received:", req.body);

  // === LOGIC: Step A → ส่งให้ B ===
  if (step === "A" && approved) {
    const excelFilePath = `files/input/RFC_mock.xlsx`;
    const analysisFilePath = path.join(__dirname, "analysis-result.json");

    // Load pre-computed analysis
    const analysisData = await fs.readFile(analysisFilePath, "utf-8");
    const analysis = JSON.parse(analysisData);
    console.log("Loaded analysis from file.");

    const html = await formatReport(analysis);
    console.log("Report formatted.");

    await sendEmailWithAttachment({
      to: "65010815@kmitl.ac.th",
      subject: `AI Analysis Result + Excel File (A approved)`,
      text: "Please see the detailed analysis in the HTML version of this email.",
      html,
      attachmentPath: excelFilePath
    });

    res.json({ ok: true });
  }

  // === LOGIC: Step B → ส่งสรุป ===
  // if (step === "B" && approved) {
  //   await sendEmailWithAttachment({
  //     to: "65010815@kmitl.ac.th",
  //     subject: `Document fully approved (File: ${fileId})`,
  //     text: "A and B have approved.",
  //     html: "<p>Both A and B have approved this document.</p>"
  //   });

  //   res.json({ ok: true });
  // }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));