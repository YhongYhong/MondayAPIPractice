import fs from "fs";

const query = `
mutation addFile($file: File!) {
  add_file_to_column(
    item_id: 1939906470,
    column_id: "file_mkxs39cn",
    file: $file
  ) {
    id
  }
}
`;

async function upload() {
  const token = process.env.MONDAY_TOKEN;

  const form = new FormData();
  form.append("query", query);
  form.append("variables", JSON.stringify({ file: null }));
  form.append("map", JSON.stringify({ "file": ["variables.file"] }));

  const fileBuffer = fs.readFileSync("./Book1.xlsx");
  // const blob = new Blob([fileBuffer], { type: "application/pdf" });
  const blob = new Blob([fileBuffer]);

  form.append("file", blob, "Book1.xlsx");
  const res = await fetch("https://api.monday.com/v2/file", {
    method: "POST",
    headers: {
      Authorization: token
    },
    body: form
  });

  const data = await res.json();
  console.log("Upload result:", data);
}

upload().catch(console.error);
