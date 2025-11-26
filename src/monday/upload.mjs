import fs from "fs/promises";
import path from "path";
import { FormData } from "formdata-node";
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_ITEM_ID = 1939906470;
const DEFAULT_COLUMN_ID = "file_mkxs39cn";

const token = process.env.MONDAY_TOKEN;

if (!token) {
  throw new Error("MONDAY_TOKEN environment variable is required");
}

const UPLOAD_MUTATION = (itemId, columnId) => `
mutation addFile($file: File!) {
  add_file_to_column(
    item_id: ${itemId},
    column_id: "${columnId}",
    file: $file
  ) {
    id
  }
}
`;

export async function uploadFile(filePath, options = {}) {
  const { itemId = DEFAULT_ITEM_ID, columnId = DEFAULT_COLUMN_ID } = options;

  // Validation
  if (typeof filePath !== "string" || filePath.trim().length === 0) {
    throw new Error("filePath must be a non-empty string");
  }
  if (typeof itemId !== "number" || itemId <= 0) {
    throw new Error("itemId must be a positive number");
  }
  if (typeof columnId !== "string" || columnId.trim().length === 0) {
    throw new Error("columnId must be a non-empty string");
  }

  let fileBuffer;
  try {
    await fs.access(filePath);
    fileBuffer = await fs.readFile(filePath);
  } catch (accessError) {
    throw new Error(`File not found or inaccessible: ${filePath}. Error: ${accessError.message}`);
  }

  const fileName = path.basename(filePath);
  const query = UPLOAD_MUTATION(itemId, columnId);

  const form = new FormData();
  form.append("query", query);
  form.append("variables", JSON.stringify({ file: null }));
  form.append("map", JSON.stringify({ "file": ["variables.file"] }));
  form.append("file", fileBuffer, fileName);

  try {
    const res = await fetch("https://api.monday.com/v2/file", {
      method: "POST",
      headers: {
        "Authorization": token
      },
      body: form
    });

    if (!res.ok) {
      throw new Error(`Upload request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    console.log("Upload result:", data);
    return data;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}

async function main() {
  try {
    await uploadFile("./Book1.xlsx");
    console.log("Upload completed successfully.");
  } catch (error) {
    console.error("Main upload process failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
