import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function sendEmailWithAttachment(options = {}) {
  const {
    to,
    subject,
    text,
    html,
    attachmentPath,
    transporterConfig = {
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    }
  } = options;

  // Validation
  if (!to || typeof to !== "string") {
    throw new Error("Recipient 'to' must be a valid email string");
  }
  if (!subject || typeof subject !== "string") {
    throw new Error("'subject' must be a non-empty string");
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS environment variables are required");
  }

  // Check attachment exists if provided
  if (attachmentPath) {
    try {
      await fs.access(attachmentPath);
    } catch {
      throw new Error(`Attachment file not found: ${attachmentPath}`);
    }
  }

  let transporter;
  try {
    transporter = nodemailer.createTransport(transporterConfig);
    // Verify transporter (optional, but good for config validation)
    await transporter.verify();
  } catch (configError) {
    throw new Error(`Failed to create or verify transporter: ${configError.message}`);
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: text || "Plain text version of the email",
    html: html || text, // Fallback to text if no HTML
    attachments: attachmentPath ? [
      {
        filename: path.basename(attachmentPath),
        path: attachmentPath,
        contentType: attachmentPath.endsWith(".xlsx")
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/octet-stream" // Generic fallback
      }
    ] : []
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (sendError) {
    console.error("Failed to send email:", sendError);
    throw new Error(`Email sending failed: ${sendError.message}`);
  }
}
