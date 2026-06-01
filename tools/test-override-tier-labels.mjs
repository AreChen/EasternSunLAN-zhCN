import assert from "node:assert/strict";
import fs from "node:fs";

const tierConfigPath = "localization/item-tier-labels.json";
const overrideRulesPath = "mpq-data/D2RLAN/Filters/override_rules.lua";
const stringNameFiles = [
  "strings/item-names.json",
  "strings/translated_strings/translated_item-names.json",
  "strings-legacy/item-names.json",
];

const startMarker = "-- BEGIN MANAGED ITEM TIER LABELS";
const endMarker = "-- END MANAGED ITEM TIER LABELS";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function extractManagedBlock(text) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  assert.notEqual(start, -1, "override_rules.lua is missing the managed item tier label start marker");
  assert.notEqual(end, -1, "override_rules.lua is missing the managed item tier label end marker");
  assert.ok(end > start, "managed item tier label end marker must appear after start marker");
  return text.slice(start, end + endMarker.length);
}

const labels = readJson(tierConfigPath).labels;
const tiers = readJson(tierConfigPath).tiers;
const tierEntries = tiers.map((entry) => ({
  code: entry.code || entry.Key,
  tier: entry.tier,
  label: labels[entry.tier],
}));

assert.equal(tierEntries.length, 762);
assert.equal(new Set(tierEntries.map((entry) => entry.code)).size, tierEntries.length);

for (const filePath of stringNameFiles) {
  const records = readJson(filePath);
  for (const record of records) {
    assert.doesNotMatch(record.zhCN ?? "", /\s\[(?:N|Ex|El)\]$/, `${filePath}:${record.Key} should not carry tier labels in zhCN strings`);
  }
}

const text = fs.readFileSync(overrideRulesPath, "utf8");
const block = extractManagedBlock(text);
const ruleCodes = [...block.matchAll(/\bcode\s*=\s*"([^"]+)"/g)].map((match) => match[1]);

assert.equal(ruleCodes.length, tierEntries.length);
assert.deepEqual(ruleCodes, tierEntries.map((entry) => entry.code));
assert.doesNotMatch(block, /\bname_override\b/);
assert.match(block, /location\s*=\s*\{\s*"onground",\s*"onplayer",\s*"equipped",\s*"atvendor"\s*\}/);

for (const entry of tierEntries) {
  assert.match(block, new RegExp(`\\bcode\\s*=\\s*"${entry.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?\\bsuffix\\s*=\\s*" \\{gray\\}${entry.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
}

assert.match(block, /\bcode\s*=\s*"vbl"[\s\S]*?\bsuffix\s*=\s*" \{gray\}\[N\]"/);
assert.match(block, /\bcode\s*=\s*"92h"[\s\S]*?\bsuffix\s*=\s*" \{gray\}\[Ex\]"/);
assert.match(block, /\bcode\s*=\s*"7ls"[\s\S]*?\bsuffix\s*=\s*" \{gray\}\[El\]"/);

console.log("override tier label tests OK");
