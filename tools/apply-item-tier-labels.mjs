#!/usr/bin/env node
import path from "node:path";

import {
  applyTierLabelsToRecords,
  loadTierConfig,
  readJson,
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

function applyFile(filePath, tiers, labels, write) {
  const records = readJson(filePath);
  const result = applyTierLabelsToRecords(records, tiers, labels, { locale: "zhCN" });
  if (write && result.changed > 0) {
    writeJson(filePath, records);
  }
  return { file: filePath, ...result };
}

const args = parseArgs(process.argv.slice(2));
const stringsRoot = args.strings ?? "strings";
const mappingPath = args.mapping ?? "localization/item-tier-labels.json";
const write = args.write === true || args.write === "true";
const check = args.check === true || args.check === "true";

if (!write && !check) {
  console.error("Pass --write to update files or --check to verify no changes are needed.");
  process.exit(2);
}

const { labels, tiers } = loadTierConfig(mappingPath);
const files = [
  path.join(stringsRoot, "item-names.json"),
  path.join(stringsRoot, "translated_strings", "translated_item-names.json"),
];
const results = files.map((file) => applyFile(file, tiers, labels, write));
const changed = results.reduce((sum, result) => sum + result.changed, 0);

console.log(JSON.stringify({
  mapping: mappingPath,
  labels,
  write,
  check,
  tierCount: tiers.size,
  changed,
  results,
}, null, 2));

if (check && changed > 0) {
  process.exit(1);
}
