import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function byKey(records) {
  return new Map(records.map((record) => [record.Key, record]));
}

const legacyRoot = "strings-legacy";
assert.ok(fs.existsSync(legacyRoot), "strings-legacy must be tracked and packaged for legacy item labels");

const legacyFiles = fs.readdirSync(legacyRoot).filter((name) => name.endsWith(".json"));
assert.ok(legacyFiles.includes("item-names.json"), "strings-legacy/item-names.json is required");
assert.ok(legacyFiles.includes("item-nameaffixes.json"), "strings-legacy/item-nameaffixes.json is required");

for (const fileName of legacyFiles) {
  readJson(path.join(legacyRoot, fileName));
}

for (const fileName of ["item-names.json", "item-nameaffixes.json"]) {
  const records = readJson(path.join(legacyRoot, fileName));
  const missingZhCN = records
    .filter((record) => !String(record.zhCN ?? "").trim())
    .map((record) => record.Key);

  assert.deepEqual(missingZhCN, [], `${fileName} has legacy records without zhCN`);
}

const mainAffixes = byKey(readJson("strings/item-nameaffixes.json"));
const mainNames = byKey(readJson("strings/item-names.json"));
const legacyAffixes = byKey(readJson(path.join(legacyRoot, "item-nameaffixes.json")));
const legacyNames = byKey(readJson(path.join(legacyRoot, "item-names.json")));

const expectedRareNameFragments = [
  [mainAffixes, "Stone", "磐石"],
  [mainAffixes, "Corpse", "尸骸"],
  [mainAffixes, "Grim", "冷酷"],
  [mainAffixes, "GloomUM", "幽暗"],
  [mainAffixes, "StoneUM", "磐石"],
  [mainNames, "nails", "钉刺"],
  [mainNames, "Tooth", "利齿"],
  [mainNames, "Imp", "邪灵"],
  [mainNames, "hood", "罩影"],
  [mainNames, "veil", "帷幕"],
  [legacyAffixes, "Stone", "磐石"],
  [legacyAffixes, "Corpse", "尸骸"],
  [legacyAffixes, "Grim", "冷酷"],
  [legacyNames, "nails", "钉刺"],
  [legacyNames, "Tooth", "利齿"],
  [legacyNames, "Imp", "邪灵"],
  [legacyNames, "hood", "罩影"],
  [legacyNames, "veil", "帷幕"],
];

for (const [recordsByKey, key, expected] of expectedRareNameFragments) {
  assert.equal(recordsByKey.get(key)?.zhCN, expected, `${key} should use a composable rare-name fragment`);
}

const badLiteralFragments = [
  ["Stone", mainAffixes.get("Stone")?.zhCN],
  ["StoneUM", mainAffixes.get("StoneUM")?.zhCN],
  ["nails", mainNames.get("nails")?.zhCN],
  ["Tooth", mainNames.get("Tooth")?.zhCN],
  ["Imp", mainNames.get("Imp")?.zhCN],
  ["hood", mainNames.get("hood")?.zhCN],
  ["veil", mainNames.get("veil")?.zhCN],
];

for (const [key, value] of badLiteralFragments) {
  assert.doesNotMatch(String(value ?? ""), /石头|钉子|牙齿|小鬼|兜帽|面纱/, `${key} is still too literal: ${value}`);
}

console.log("legacy string localization tests OK");
