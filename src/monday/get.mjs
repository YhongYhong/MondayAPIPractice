import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";
import dotenv from "dotenv";
import nodeFetch from "node-fetch";
dotenv.config();

const MONDAY_TOKEN = process.env.MONDAY_TOKEN;

if (!MONDAY_TOKEN) {
  throw new Error("MONDAY_TOKEN environment variable is required");
}

export const GET_FILES_QUERY = (itemId, columnId) => `
query {
  items(ids: ${itemId}) {
    column_values(ids: "${columnId}") {
      value
    }
  }
}
`;

export const GET_ASSET_QUERY = (assetId) => `
query {
  assets(ids: ${assetId}) {
    name
    public_url
    url
  }
}
`;

export async function runGraphQL(query) {
  try {
    const res = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Authorization": MONDAY_TOKEN,
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

async function downloadAndSaveFile(downloadUrl, fileName, downloadDir) {
  try {
    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) {
      throw new Error(`Download failed: ${fileRes.status} ${fileRes.statusText}`);
    }

    const buffer = Buffer.from(await fileRes.arrayBuffer());

    // Ensure download directory exists
    await fs.mkdir(downloadDir, { recursive: true });

    const filePath = path.join(downloadDir, fileName);
    await fs.writeFile(filePath, buffer);
    console.log(`Saved: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`Failed to download/save ${fileName}:`, error);
    throw error;
  }
}

export async function downloadAll(itemId, columnId, downloadDir = 'files/input') {
  if (!itemId || !columnId || !downloadDir) {
    throw new Error("itemId, columnId, and downloadDir are required");
  }

  try {
    // STEP 1 — get file list & assetId
    const getFilesQuery = GET_FILES_QUERY(itemId, columnId);
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
      return {};
    }

    console.log("Files found in column:", value.files);
    
    const fileAssetMap = {};

    // STEP 2 & 3 — for each file, get asset and download (assume first file for simplicity)
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
      await downloadAndSaveFile(downloadUrl, fileName, downloadDir);
      fileAssetMap[fileName] = assetId;
      
      // Assume we only need the first file
      // break;
    }

    return fileAssetMap;
  } catch (error) {
    console.error("Download process failed:", error);
    throw error;
  }
}

export async function downloadAsset(assetId, downloadDir = 'files/input') {
  let assetData;
  try {
    assetData = await runGraphQL(GET_ASSET_QUERY(assetId));
  } catch (error) {
    console.log('Failed to fetch asset data');
    return null;
  }
  if (!assetData.data.assets[0]) {
    console.log('Failed to fetch asset data');
    return null;
  }
  const asset = assetData.data.assets[0];
  const filenameToUse = asset.name || `asset_${assetId}.xlsx`;
  const { public_url, url } = asset;
  const downloadUrl = public_url || url;
  if (!downloadUrl) {
    console.log('No download URL available');
    return null;
  }

  const fullPath = path.join(downloadDir, filenameToUse);
  try {
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    const response = await nodeFetch(downloadUrl);
    if (!response.ok) {
      console.log(`Download failed: ${response.status} ${response.statusText}`);
      return null;
    }
    if (!response.body || typeof response.body.pipe !== 'function') {
      console.error('Response body not pipeable');
      return null;
    }
    const writeStream = createWriteStream(fullPath);
    response.body.pipe(writeStream);
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    console.log(`Downloaded to ${fullPath}`);
    return fullPath;
  } catch (error) {
    console.error('Download error:', error);
    return null;
  }
}