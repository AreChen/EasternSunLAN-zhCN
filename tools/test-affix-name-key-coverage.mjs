import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const excelRoot = "H:/D2RLAN/D2R/Mods/EasternSunLAN/EasternSunLAN.mpq/data/global/excel";
const stringDirs = ["strings", "strings-legacy"];
const affixTables = [
  "rareprefix.txt",
  "raresuffix.txt",
  "magicprefix.txt",
  "magicsuffix.txt",
];

function readTsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").trimEnd();
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = headerLine.split("\t");
  return lines
    .filter(Boolean)
    .map((line) => {
      const values = line.split("\t");
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

const localizedKeys = new Set();
for (const stringDir of stringDirs) {
  const absoluteDir = path.join(repoRoot, stringDir);
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const rows = readJson(path.join(absoluteDir, entry.name));
    for (const row of rows) {
      if (row.Key && row.zhCN && row.zhCN.trim()) {
        localizedKeys.add(row.Key);
      }
    }
  }
}

const missing = new Set();
for (const table of affixTables) {
  const rows = readTsv(path.join(excelRoot, table));
  for (const row of rows) {
    const key = row.name || row.Name;
    if (key && !localizedKeys.has(key)) {
      missing.add(`${table}:${key}`);
    }
  }
}

if (missing.size) {
  const list = [...missing].sort();
  throw new Error(`Missing localized affix keys (${missing.size}):\n${list.join("\n")}`);
}

console.log("affix name key coverage tests OK");
