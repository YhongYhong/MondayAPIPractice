import nodemailer from "nodemailer";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

export async function sendEmailWithAttachment({ to, subject, text, html, attachmentPath }) {
  // 1) กำหนด SMTP Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS // App Password จาก gmail
    }
  });

  // 2) สร้างอีเมลพร้อมแนบไฟล์
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: attachmentPath.split("/").pop(), // ใช้ชื่อไฟล์จริง
        path: attachmentPath,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    ]
  };

  // 3) ส่งเมล
  const result = await transporter.sendMail(mailOptions);
  return result;
}
