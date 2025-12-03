import { runGraphQL, GET_FILES_QUERY, GET_ASSET_QUERY } from '../monday/get.mjs';

async function getMondayFiles() {
  const itemId = "2515488104";
  const columnId = "file_mky75w4f";
  try {
    const response = await runGraphQL(GET_FILES_QUERY(itemId, columnId));
    const columnValue = JSON.parse(response.data.items[0].column_values[0].value);
    const files = columnValue.files || [];
    const fileMetadata = [];
    for (const file of files) {
      const assetId = file.assetId;
      if (!assetId) {
        console.log('Skipping file without assetId');
        continue;
      }
      try {
        const assetData = await runGraphQL(GET_ASSET_QUERY(assetId));
        const { name, public_url, url } = assetData.data.assets[0] || {};
        const downloadUrl = public_url || url;
        fileMetadata.push({
          name,
          url: downloadUrl,
          assetId
        });
      } catch (assetError) {
        console.error(`Error fetching asset ${assetId}:`, assetError);
      }
    }
    return fileMetadata;
  } catch (error) {
    console.error('Error fetching Monday files:', error);
    return [];
  }
}

export { getMondayFiles };