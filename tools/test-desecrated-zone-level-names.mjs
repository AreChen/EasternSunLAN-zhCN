#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const filePath = "mpq-data/hd/global/excel/desecratedzones.json";
const text = fs.readFileSync(filePath, "utf8");

function getLevelName(id) {
  const pattern = new RegExp(`"id"\\s*:\\s*${id}\\s*,\\s*"name"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "m");
  const match = text.match(pattern);
  assert.ok(match, `missing level_names entry for id ${id}`);
  return JSON.parse(`"${match[1]}"`);
}

assert.equal(getLevelName(142), "[ACT5] 诅咒之墓");
assert.equal(getLevelName(143), "[ACT5] 诅咒之墓");
assert.equal(getLevelName(152), "[ACT5] 感染的巢穴");
assert.equal(getLevelName(153), "[ACT5] 感染的巢穴 第1层");
assert.equal(getLevelName(154), "[ACT5] 感染的巢穴 第2层");
assert.equal(getLevelName(165), "[ACT5] 无尽深渊");
assert.equal(getLevelName(166), "[ACT5] 无尽深渊 第1层");
assert.equal(getLevelName(167), "[ACT5] 无尽深渊 第2层");
assert.equal(getLevelName(168), "[ACT5] 无尽深渊 第3层");
assert.equal(getLevelName(169), "[ACT5] 无尽深渊 第4层");
assert.equal(getLevelName(170), "[ACT5] 无尽深渊 第5层");
assert.equal(getLevelName(171), "[ACT5] 无尽深渊 第6层");
assert.equal(getLevelName(182), "[ACT5] 毁灭神殿");
assert.equal(getLevelName(200), "[ACT5] 冰冠堡垒");
assert.equal(getLevelName(12), "[ACT1] 血鸦的工坊 第1层 (终局区域)");
assert.equal(getLevelName(16), "[ACT1] 血鸦的工坊 第2层 (终局区域)");
assert.ok(!/[（）]/.test(text), "terror zone level names should use ASCII parentheses");

const forbiddenNameValues = [
  "Crypt of Damnation",
  "Infested Lair",
  "Infested Lair Level 1",
  "Infested Lair Level 2",
  "Endless Abyss",
  "Endless Abyss Level 1",
  "Endless Abyss Level 2",
  "Endless Abyss Level 3",
  "Endless Abyss Level 4",
  "Endless Abyss Level 5",
  "Endless Abyss Level 6"
];

for (const value of forbiddenNameValues) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.ok(
    !new RegExp(`"name"\\s*:\\s*"(?:\\\\[ACT[1-5]\\\\] )?${escapedValue}"`).test(text),
    `unlocalized terror zone level name remains: ${value}`
  );
}

assert.match(text, /"desecrated_zones"\s*:/);
assert.match(text, /"level_id"\s*:\s*142/);
assert.match(text, /"waypoint_level_id"\s*:\s*109/);

console.log("desecrated zone level name tests OK");
