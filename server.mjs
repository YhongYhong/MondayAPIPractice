import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { approvalHandler } from "./src/handlers/approvalHandler.mjs";
import { simulateUpdateHandler } from "./src/handlers/simulateUpdateHandler.mjs";
import { uploadHandler } from "./src/handlers/uploadHandler.mjs";
import { simulateCreateHandler } from "./src/handlers/simulateCreateHandler.mjs";
import { getMondayFiles } from "./src/handlers/mondayFilesHandler.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Configure multer for temporary file storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'temp/'); // Create temp directory if needed
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });
// const upload = multer({ 
//   storage,
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only .xlsx files are allowed'), false);
//     }
//   }
// });

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

app.post("/approve", approvalHandler);
app.post("/simulate-update-items", simulateUpdateHandler);
// app.post("/init", )

app.post("/simulate-create-items", simulateCreateHandler);


// app.post("/upload", upload.single('file'), uploadHandler);

// app.get("/monday-files", async (req, res) => {
//   try {
//     const result = await getMondayFiles();
//     res.json({ ok: true, files: result });
//   } catch (error) {
//     res.status(500).json({ ok: false, error: "Failed to fetch files" });
//   }
// });

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));