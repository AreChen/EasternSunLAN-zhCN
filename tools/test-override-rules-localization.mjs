import assert from "node:assert/strict";
import fs from "node:fs";

const filePath = "mpq-data/D2RLAN/Filters/override_rules.lua";

function extractString(text, key) {
  const pattern = new RegExp(`\\b${key}\\s*=\\s*"((?:\\\\.|[^"\\\\])*)"`);
  const match = text.match(pattern);
  return match?.[1] ?? null;
}

function extractRuleBlock(text, code) {
  const codePattern = new RegExp(`\\bcode\\s*=\\s*"${code}"`);
  const codeMatch = codePattern.exec(text);
  assert.ok(codeMatch, `missing rule code ${code}`);

  const start = text.lastIndexOf("{", codeMatch.index);
  assert.notEqual(start, -1, `missing block start for ${code}`);

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  throw new Error(`unterminated block for ${code}`);
}

assert.ok(fs.existsSync(filePath), `${filePath} should exist`);

const text = fs.readFileSync(filePath, "utf8");
assert.match(text, /language\s*=\s*"enUS"/);

const enUSValues = [...text.matchAll(/\benUS\s*=\s*"((?:\\.|[^"\\])*)"/g)].map((match) => match[1]);
const zhCNValues = [...text.matchAll(/\bzhCN\s*=\s*"((?:\\.|[^"\\])*)"/g)].map((match) => match[1]);
assert.equal(enUSValues.length, 683);
assert.equal(zhCNValues.length, 683);
assert.deepEqual(zhCNValues, enUSValues);

for (const value of enUSValues) {
  assert.match(value, /[\u4e00-\u9fff]/, `expected Chinese text: ${value}`);
}

const rvs = extractRuleBlock(text, "rvs");
assert.equal(extractString(rvs, "enUS"), "恢复 25%% 生命值和法力值\\n");
assert.equal(extractString(rvs, "zhCN"), "恢复 25%% 生命值和法力值\\n");

const an0 = extractRuleBlock(text, "an0");
assert.match(extractString(an0, "enUS"), /暗金装备/);
assert.match(extractString(an0, "enUS"), /<普通级>/);

const z05 = extractRuleBlock(text, "z05");
assert.match(extractString(z05, "enUS"), /^ÿc5/);
assert.doesNotMatch(extractString(z05, "enUS"), /\{gray\}/);
assert.match(extractString(z05, "enUS"), /宝藏哥布林/);

const u20 = extractRuleBlock(text, "u20");
assert.match(extractString(u20, "enUS"), /ÿc1腐化ÿc0/);

for (const value of [...enUSValues, ...zhCNValues]) {
  assert.doesNotMatch(value, /\b(?:Right Click|Transmute|Cannot produce|Drop Bias)\b/);
  assert.doesNotMatch(value, /(?:新符-|古符：|古符-|低级古符-|中级古符-|高级古符-)(?:艾尔|艾德|特尔|那夫|爱斯|伊司|塔尔|拉尔|欧特|书尔|安姆|索尔|夏|多尔|海尔|埃欧|卢姆|科|法尔|蓝姆|普尔|乌姆|马尔|伊司特|古尔|伐克斯|欧姆|罗|瑟|贝|乔|查姆|萨德|希伦|莫伦|诺瓦|泰拉|罗萨|索薇|穆恩|奈芙|瑞亚|苏娜|赫拉|纽斯|沃尔)/);
}

assert.match(text, /新符-Iÿc2#1/);
assert.match(text, /新符-Woÿc2#46/);
assert.match(text, /古符：Elÿc2\(#1\)/);
assert.match(text, /古符：Zodÿc2\(#33\)/);
assert.match(text, /低级古符-Elÿc2#1/);
assert.match(text, /高级古符-Zodÿc2#33/);

console.log("override rules localization tests OK");
