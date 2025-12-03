import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const MONDAY_TOKEN = process.env.MONDAY_TOKEN;

if (!MONDAY_TOKEN) {
  throw new Error("MONDAY_TOKEN environment variable is required");
}

export async function uploadToMonday(filePath, originalFilename, itemId, columnId) {
  const form = new FormData();

  form.append(
    "query",
    `mutation ($file: File!) {
      add_file_to_column(
        item_id: ${itemId},
        column_id: "${columnId}",
        file: $file
      ) {
        id
      }
    }`
  );

  form.append(
    "variables[file]",
    fs.createReadStream(filePath),
    originalFilename
  );

  const response = await fetch("https://api.monday.com/v2/file", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MONDAY_TOKEN}`,
      ...form.getHeaders()
    },
    body: form
  });

  const result = await response.json();
  console.log("Upload result:", result);
  if (result.errors) {
    throw new Error(`Upload error: ${JSON.stringify(result.errors)}`);
  }
  return { success: true, filename: originalFilename, id: result.data?.add_file_to_column?.id };
}