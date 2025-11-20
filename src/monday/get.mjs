import fs from "fs";

const token = process.env.MONDAY_TOKEN;

const getFilesQuery = `
query {
  items(ids: 1939906470) {
    column_values(ids: "file_mkxs39cn") {
      value
    }
  }
}
`;

async function runGraphQL(query) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Authorization": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  return res.json();
}

async function main() {
  // STEP 1 — get file list & assetId
  const res = await runGraphQL(getFilesQuery);
  const rawValue = res.data.items[0].column_values[0].value;
  const value = JSON.parse(rawValue);

  console.log("Files found in column:", value.files);

  for (const file of value.files) {
    const assetId = file.assetId;
    console.log("Fetching asset:", assetId);

    // STEP 2 — query asset URL by assetId
    const assetQuery = `
    query {
      assets(ids: ${assetId}) {
        name
        public_url
        url
      }
    }
    `;

    const assetRes = await runGraphQL(assetQuery);
    const asset = assetRes.data.assets[0];

    console.log("Asset response:", asset);

    const downloadUrl = asset.public_url || asset.url;

    if (!downloadUrl) {
      console.error("No download URL found for asset:", assetId);
      continue;
    }

    console.log("Downloading:", downloadUrl);

    // STEP 3 — download the file
    const fileRes = await fetch(downloadUrl);
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    fs.writeFileSync("./" + asset.name, buffer);
    console.log("Saved:", asset.name);
  }
}

main().catch(console.error);
