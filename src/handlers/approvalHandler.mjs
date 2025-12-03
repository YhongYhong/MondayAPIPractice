import { formatReport } from "../email/formatReport.mjs";
import { sendEmailWithAttachment } from "../email/sendEmail.mjs";
import { downloadAsset } from "../monday/get.mjs";
import fs from "fs/promises";
import path from "path";

export const approvalHandler = async (req, res) => {
  if (req.method === 'GET') {
    const filePath = path.join(process.cwd(), 'public', 'approval.html');
    return res.sendFile(filePath);
  }

  const assetId = req.body.assetId;
  const step = req.body.step;
  const approved = req.body.approved;

  const analysisStore = globalThis.analysisStore ?? (globalThis.analysisStore = new Map());

  console.log("Received approve request:", req.body);

  if (approved) {
    console.log(`Approval confirmed for step ${step} and asset ${assetId}`);

    console.log("key type:", typeof assetId);
    const key = `analysis_${assetId}`;
    let analysisObj = analysisStore.get(key);
    if (!analysisObj) {
      console.warn(`Analysis not found for assetId: ${assetId}, using mock`);
      analysisObj = { analysis: { valid: true, errors: [] }, assetId: assetId };
    }

    // Format the report with dynamic link
    const html = await formatReport(analysisObj.analysis, assetId, step);

    // Download the asset
    const tempDir = 'files/temp';
    let attachmentPath = null;
    try {
      attachmentPath = await downloadAsset(assetId, tempDir);
      if (!attachmentPath) {
        console.warn(`Failed to download asset: ${assetId}`);
      }
    } catch (error) {
      console.error(`Download error for asset ${assetId}:`, error);
    }

    // Send email with attachment if available
    await sendEmailWithAttachment({
      to: "65010815@kmitl.ac.th",
      subject: "Team Lead_Approved - AI Analysis Result + Excel File (Simple Process)",
      text: "Please see the detailed analysis in the HTML version of this email.",
      html,
      attachmentPath
    });

    // Clean up temp file if it was downloaded
    if (attachmentPath) {
      try {
        await fs.unlink(attachmentPath);
        console.log(`Cleaned up temp file: ${attachmentPath}`);
      } catch (cleanupError) {
        console.warn(`Failed to clean up temp file: ${attachmentPath}`, cleanupError);
      }
    }

    console.log("Approval email sent successfully.");
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
};