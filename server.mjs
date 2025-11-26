import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { sendEmailWithAttachment } from "./src/email/sendEmail.mjs";

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
    await sendEmailWithAttachment({
      to: "65010815@kmitl.ac.th",
      subject: `Document requires your approval`,
      text: "Please review and approve.",
      html: `
        <p>A has approved this document.</p>
        <p>Click below to approve:</p>
        <a href="http://localhost:3000/index.html?step=B">
          Approve Document
        </a>
      `,
      attachmentPath: `files/input/RFC_mock.xlsx`
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