import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const ITEM_ID = 1939906470;
const COLUMN_ID = "file_mkxs39cn";
const DOWNLOAD_DIR = "files/output";

const token = process.env.MONDAY_TOKEN;

if (!token) {
  throw new Error("MONDAY_TOKEN environment variable is required");
}

const GET_FILES_QUERY = (itemId) => `
query {
  items(ids: ${itemId}) {
    column_values(ids: "${COLUMN_ID}") {
      value
    }
  }
}
`;

const GET_ASSET_QUERY = (assetId) => `
query {
  assets(ids: ${assetId}) {
    name
    public_url
    url
  }
}
`;

async function runGraphQL(query) {
  try {
    const res = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data;
  } catch (error) {
    console.error("GraphQL execution error:", error);
    throw error;
  }
}

async function downloadAndSaveFile(downloadUrl, fileName) {
  try {
    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) {
      throw new Error(`Download failed: ${fileRes.status} ${fileRes.statusText}`);
    }

    const buffer = Buffer.from(await fileRes.arrayBuffer());

    // Ensure download directory exists
    await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

    const filePath = path.join(DOWNLOAD_DIR, fileName);
    await fs.writeFile(filePath, buffer);
    console.log(`Saved: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`Failed to download/save ${fileName}:`, error);
    throw error;
  }
}

async function main(options = {}) {
  const { itemId = ITEM_ID, outputDir = DOWNLOAD_DIR } = options;

  try {
    // STEP 1 — get file list & assetId
    const getFilesQuery = GET_FILES_QUERY(itemId);
    const res = await runGraphQL(getFilesQuery);

    if (!res.data?.items?.[0]?.column_values?.[0]?.value) {
      throw new Error("No file column value found for the item");
    }

    const rawValue = res.data.items[0].column_values[0].value;
    let value;
    try {
      value = JSON.parse(rawValue);
    } catch (parseError) {
      throw new Error(`Failed to parse file column value: ${parseError.message}`);
    }

    if (!value.files || value.files.length === 0) {
      console.log("No files found in the column.");
      return;
    }

    console.log("Files found in column:", value.files);

    // STEP 2 & 3 — for each file, get asset and download
    for (const file of value.files) {
      const assetId = file.assetId;
      if (!assetId) {
        console.warn("Skipping file without assetId:", file);
        continue;
      }

      console.log("Fetching asset:", assetId);

      const assetQuery = GET_ASSET_QUERY(assetId);
      const assetRes = await runGraphQL(assetQuery);

      if (!assetRes.data?.assets?.[0]) {
        console.warn(`No asset found for ID: ${assetId}`);
        continue;
      }

      const asset = assetRes.data.assets[0];
      console.log("Asset response:", asset);

      const downloadUrl = asset.public_url || asset.url;
      if (!downloadUrl) {
        console.error("No download URL found for asset:", assetId);
        continue;
      }

      console.log("Downloading:", downloadUrl);

      const fileName = asset.name || `file_${assetId}`;
      await downloadAndSaveFile(downloadUrl, fileName);
    }

    console.log("All files processed successfully.");
  } catch (error) {
    console.error("Download process failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
