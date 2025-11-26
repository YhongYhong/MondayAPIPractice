export async function extractSafeJson(text) {
  // 1) ตัด markdown fences
  let cleaned = text
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

  // 2) หา JSON block แรกสุด
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON-like structure found");
  }

  cleaned = cleaned.substring(start, end + 1);

  // 3) ลอง parse แบบปกติ (กรณี JSON ถูกต้อง)
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("⚠ JSON parse failed. Attempting to auto-repair...");

    // 4) ลอง auto-fix JSON ที่ไม่สมบูรณ์
    cleaned = cleaned
      // เอาข้อความที่อยู่หลัง property ออก เช่น `"sheet": "Sheet2", energize blah`
      .replace(/,\s*[A-Za-z][^,\}\]]+/g, "")
      // ลบ comma ที่ท้าย array/object
      .replace(/,(\s*[}\]])/g, "$1")
      // ลบ text ที่ไม่ใช่ key-value
      .replace(/[^{}\[\]0-9":,\sA-Za-z_.-]/g, "");

    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      console.error("❌ Auto-repair failed.");
      throw e2;
    }
  }
}
