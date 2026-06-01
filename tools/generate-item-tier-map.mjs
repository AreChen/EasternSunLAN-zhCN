#!/usr/bin/env node
import path from "node:path";

import {
  DEFAULT_TIER_LABELS,
  buildTierMapFromRows,
  readJson,
  readTsv,
  sortTierEntriesByItemNameOrder,
  writeJson,
} from "./item-tier-labels.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const key = arg.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
    args[key] = value;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const excelRoot = args["excel-root"] ?? process.env.EASTERN_SUN_EXCEL_ROOT;
const stringsRoot = args.strings ?? "strings";
const outPath = args.out ?? "localization/item-tier-labels.json";
const modVersion = args["mod-version"] ?? "3.11.09";

if (!excelRoot) {
  console.error("Missing --excel-root or EASTERN_SUN_EXCEL_ROOT");
  process.exit(2);
}

const itemNamesPath = path.join(stringsRoot, "item-names.json");
const itemRecords = readJson(itemNamesPath);
const itemKeys = new Set(itemRecords.map((record) => record.Key));

const rows = [];
for (const file of ["armor.txt", "weapons.txt"]) {
  const filePath = path.join(excelRoot, file);
  for (const row of readTsv(filePath)) {
    rows.push({ ...row, file });
  }
}

const result = buildTierMapFromRows(rows, { itemKeys });
const tiers = sortTierEntriesByItemNameOrder(result.entries, itemRecords).map((entry) => ({
  Key: entry.Key,
  tier: entry.tier,
  source: entry.source,
  code: entry.code,
  name: entry.name,
  spawnable: entry.spawnable,
}));

const config = {
  schema: 1,
  modVersion,
  description: "Item base tier labels for zhCN item names. Generated from armor.txt and weapons.txt namestr/normcode/ubercode/ultracode.",
  labels: DEFAULT_TIER_LABELS,
  conflictResolution: "When the same namestr maps to multiple tiers, prefer spawnable rows over hidden rows.",
  conflictCount: result.conflicts.length,
  tiers,
};

writeJson(outPath, config);
console.log(JSON.stringify({
  out: outPath,
  modVersion,
  tierCount: tiers.length,
  conflictCount: result.conflicts.length,
  counts: tiers.reduce((counts, entry) => {
    counts[entry.tier] = (counts[entry.tier] ?? 0) + 1;
    return counts;
  }, {}),
}, null, 2));
