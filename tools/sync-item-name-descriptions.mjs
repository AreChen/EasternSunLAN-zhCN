#!/usr/bin/env node
import path from "node:path";

import { readJson, writeJson } from "./item-tier-labels.mjs";

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

function syncMissingRecords(targetRecords, sourceRecords) {
  const targetKeys = new Set(targetRecords.map((record) => record.Key));
  const missing = [];

  for (const record of sourceRecords) {
    if (!record.Key || targetKeys.has(record.Key)) {
      continue;
    }
    targetRecords.push(record);
    targetKeys.add(record.Key);
    missing.push(record.Key);
  }

  return missing;
}

const args = parseArgs(process.argv.slice(2));
const stringsRoot = args.strings ?? "strings";
const write = args.write === true || args.write === "true";
const check = args.check === true || args.check === "true";

if (!write && !check) {
  console.error("Pass --write to update item-names.json or --check to verify it is already complete.");
  process.exit(2);
}

const targetPath = args.target ?? path.join(stringsRoot, "item-names.json");
const sourcePath = args.source ?? path.join(stringsRoot, "translated_strings", "translated_item-names.json");

const targetRecords = readJson(targetPath);
const sourceRecords = readJson(sourcePath);
const addedKeys = syncMissingRecords(targetRecords, sourceRecords);

if (write && addedKeys.length > 0) {
  writeJson(targetPath, targetRecords);
}

console.log(JSON.stringify({
  target: targetPath,
  source: sourcePath,
  write,
  check,
  targetRecords: targetRecords.length,
  sourceRecords: sourceRecords.length,
  added: addedKeys.length,
  addedKeys,
}, null, 2));

if (check && addedKeys.length > 0) {
  process.exit(1);
}
