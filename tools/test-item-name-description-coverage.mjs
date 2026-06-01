import assert from "node:assert/strict";
import fs from "node:fs";

const itemNames = JSON.parse(fs.readFileSync("strings/item-names.json", "utf8").replace(/^\uFEFF/, ""));
const translatedItemNames = JSON.parse(
  fs.readFileSync("strings/translated_strings/translated_item-names.json", "utf8").replace(/^\uFEFF/, ""),
);

const itemKeys = new Set(itemNames.map((record) => record.Key));
const translatedByKey = new Map(translatedItemNames.map((record) => [record.Key, record]));

const requiredDescriptionKeys = [
  "s01",
  "s12",
  "s46",
  "s51",
  "s83",
  "kv0",
  "t51",
];

for (const key of requiredDescriptionKeys) {
  assert.ok(itemKeys.has(key), `strings/item-names.json is missing tooltip description key ${key}`);
  assert.ok(translatedByKey.has(key), `translated source is missing tooltip description key ${key}`);
}

const s12 = itemNames.find((record) => record.Key === "s12");
assert.match(s12.zhCN, /输出：\s*ÿc1A/);
assert.match(s12.zhCN, /单独合成可切换输出/);
assert.match(s12.zhCN, /与钥匙合成以取出/);
assert.match(s12.zhCN, /与符文合成以存入/);

const missingFromItemNames = translatedItemNames.filter((record) => !itemKeys.has(record.Key));
assert.deepEqual(
  missingFromItemNames.map((record) => record.Key),
  [],
  "strings/item-names.json must include translated tooltip-only keys used by in-game descriptions",
);

console.log("item name description coverage tests OK");
