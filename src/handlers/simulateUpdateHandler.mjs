import path from "path";
import { fileURLToPath } from "url";
import { downloadAll } from "../monday/get.mjs";
import fs from "fs";
import { analyzeExcel } from "../ai/analyzeExcel.mjs";
import { formatReport } from "../email/formatReport.mjs";
import { sendEmailWithAttachment } from "../email/sendEmail.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const analysisStore = globalThis.analysisStore ?? (globalThis.analysisStore = new Map());

const itemId = 2516956384;
const columnId = 'file_mky75w4f';

export const simulateUpdateHandler = async (req, res) => {
  const fileAssetMap = await downloadAll(
    itemId,
    columnId,
  );
  if (!fileAssetMap || Object.keys(fileAssetMap).length === 0) {
    return res.json({ok: false, error: 'Failed to download Monday files'});
  }

  const inputDir = 'files/input';
  let files = [];
  try {
    files = fs.readdirSync(inputDir).filter(f => f.endsWith('.xlsx'));
  } catch (err) {
    console.error('Error reading input directory:', err);
    return res.json({ok: false, error: 'Input directory not accessible'});
  }
  if (files.length === 0) {
    return res.json({ok: false, error: 'No file to process'});
  }
  
  for (const file of files) {
    const inputFile = `${inputDir}/${file}`;
    console.log("Using input file:", inputFile);
    const assetId = fileAssetMap[file];
    if (!assetId) {
      console.log(`No assetId for ${file}, skipping.`);
    } else {
      try {
        // Analyze with AI
        const promptTemplatePath = path.join(__dirname, "../ai/prompts/rfcPrompt.txt");
        const analysis = await analyzeExcel(inputFile, promptTemplatePath);
        console.log("AI Analysis:", analysis);

        analysisStore.set(`analysis_${assetId}`, { analysis, assetId });

        // Format and send email
        const html = await formatReport(analysis, assetId, "A");
        console.log("Report formatted.");

        await sendEmailWithAttachment({
          to: "prommm33@gmail.com",
          subject: `AI Analysis Result + Excel File (Simple Process)`,
          text: "Please see the detailed analysis in the HTML version of this email.",
          html,
          attachmentPath: inputFile
        });

        console.log("Email sent successfully.");
      } catch (error) {
        console.error("Process failed for", inputFile, ":", error);
      }
    }
    // Cleanup
    if (fs.existsSync(inputFile)) {
      fs.unlinkSync(inputFile);
    }
  }
  res.json({ ok: true, message: 'Processed successfully' });
};