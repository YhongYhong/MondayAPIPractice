import XLSX from "xlsx";

// ---- CLEAN FUNCTION ---- //
function cleanSheet(rawRows, sheetName) {
  // --- CASE 1: Request for change (หน้าแรก) --
  console.log(sheetName)
  if (sheetName === "Request for change") {
    return {
      header: rawRows[0]["Request for Change (RFC)"] || "",
      title: rawRows[1]["Request for Change (RFC)"] || "",
      configuration_date:
        (rawRows[2]["Request for Change (RFC)"] || "")
          .replace("Configuration Date:", "")
          .trim(),
      company: rawRows[3] ? rawRows[3]["Request for Change (RFC)"] : ""
    };
  }

  // --- CASE 2: Other sheets ---
  const result = {
    info: {},
    table: {
      header: [],
      rows: []
    }
  };

  // ----------------------------
  // 1) INFO BLOCK (3 rows)
  // ----------------------------
  const r1 = rawRows[0];
  const r2 = rawRows[1];
  const r3 = rawRows[2];

  result.info.title = r1.title || r1[Object.keys(r1)[0]];
  result.info.objective = r2.title || r2[Object.keys(r2)[0]];
  result.info.description = r3.title || r3[Object.keys(r3)[0]];

  // ----------------------------
  // 2) TABLE (header + rows)
  // ----------------------------
  // หาแถวที่ title = "No." → คือตาราง header
  const headerIndex = rawRows.findIndex(r => r.title === "No.");

  if (headerIndex === -1) return result; // ไม่มี table

  const headerRow = rawRows[headerIndex];
  result.table.header = [headerRow.title, ...(headerRow.detail || [])];

  // ----------------------------
  // 3) TABLE ROWS
  // ----------------------------
  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];

    // Case 3.1: row ใหม่ของตาราง (มีเลขเช่น 1.1, 2.1, 3.1)
    if (row.title && /^\d+(\.\d+)*$/.test(row.title)) {
      const data = {
        no: row.title,
        pre_task: row.detail?.[0] || "",
        owner: row.detail?.[1] || "",
        start: row.detail?.[2] || "",
        stop: row.detail?.[3] || "",
        downtime: row.detail?.[4] || "",
        configuration_detail: []
      };
      result.table.rows.push(data);
    }

    // Case 3.2: row ต่อเนื่องของ configuration detail
    else if (row.detail) {
      const lastRow = result.table.rows[result.table.rows.length - 1];
      if (lastRow) {
        lastRow.configuration_detail.push(...row.detail);
      }
    }
  }

  return result;
}


// ---- READ EXCEL ---- //
export function readExcelAsJson(fileName) {
  const workbook = XLSX.readFile(fileName);
  const result = {};

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // ทำความสะอาดแต่ละ sheet
    // const cleaned = cleanSheet(jsonData);

    result[sheetName] = jsonData;
  });

  return result;
}
