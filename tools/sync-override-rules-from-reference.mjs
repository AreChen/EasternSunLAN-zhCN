#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

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

function extractCodes(text) {
  return [...text.matchAll(/\bcode\s*=\s*"([^"]+)"/g)].map((match) => match[1]);
}

function extractLocaleValues(text, locale) {
  const pattern = new RegExp(`\\b${locale}\\s*=\\s*"((?:\\\\.|[^"\\\\])*)"`, "g");
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

function replaceLocaleValues(text, locale, values) {
  let index = 0;
  const pattern = new RegExp(`(\\b${locale}\\s*=\\s*")((?:\\\\.|[^"\\\\])*)(")`, "g");
  const next = text.replace(pattern, (_match, prefix, _value, suffix) => {
    const value = values[index];
    index += 1;
    if (value === undefined) {
      throw new Error(`Missing replacement value for ${locale} at index ${index - 1}`);
    }
    return `${prefix}${value}${suffix}`;
  });

  if (index !== values.length) {
    throw new Error(`Replacement count mismatch for ${locale}: replaced ${index}, expected ${values.length}`);
  }

  return next;
}

function normalizeRuneNames(text) {
  const legacyRunes = [
    ["艾尔", "El"],
    ["艾德", "Eld"],
    ["特尔", "Tir"],
    ["那夫", "Nef"],
    ["爱斯", "Eth"],
    ["伊司", "Ith"],
    ["塔尔", "Tal"],
    ["拉尔", "Ral"],
    ["欧特", "Ort"],
    ["书尔", "Thul"],
    ["安姆", "Amn"],
    ["索尔", "Sol"],
    ["夏", "Shael"],
    ["多尔", "Dol"],
    ["海尔", "Hel"],
    ["埃欧", "Io"],
    ["卢姆", "Lum"],
    ["科", "Ko"],
    ["法尔", "Fal"],
    ["蓝姆", "Lem"],
    ["普尔", "Pul"],
    ["乌姆", "Um"],
    ["马尔", "Mal"],
    ["伊司特", "Ist"],
    ["古尔", "Gul"],
    ["伐克斯", "Vex"],
    ["欧姆", "Ohm"],
    ["罗", "Lo"],
    ["瑟", "Sur"],
    ["贝", "Ber"],
    ["乔", "Jah"],
    ["查姆", "Cham"],
    ["萨德", "Zod"],
  ];
  const easternSunRunes = [
    ["艾尔", "I"],
    ["艾德", "U"],
    ["特尔", "Shi"],
    ["那夫", "Ka"],
    ["爱斯", "N"],
    ["伊司", "Ku"],
    ["塔尔", "Yo"],
    ["拉尔", "Ki"],
    ["欧特", "Ri"],
    ["书尔", "Mi"],
    ["安姆", "Ya"],
    ["索尔", "A"],
    ["夏", "Tsu"],
    ["多尔", "Chi"],
    ["海尔", "Sa"],
    ["埃欧", "Yu"],
    ["卢姆", "Ke"],
    ["科", "E"],
    ["法尔", "Ko"],
    ["蓝姆", "Ra"],
    ["普尔", "O"],
    ["乌姆", "Ho"],
    ["马尔", "Me"],
    ["伊司特", "Ru"],
    ["古尔", "Ta"],
    ["伐克斯", "To"],
    ["欧姆", "Wa"],
    ["罗", "Ha"],
    ["瑟", "Na"],
    ["贝", "Ni"],
    ["乔", "Se"],
    ["查姆", "Fu"],
    ["萨德", "Ma"],
    ["希伦", "Hi"],
    ["莫伦", "Mo"],
    ["诺瓦", "No"],
    ["泰拉", "Te"],
    ["罗萨", "Ro"],
    ["索薇", "So"],
    ["穆恩", "Mu"],
    ["奈芙", "Ne"],
    ["瑞亚", "Re"],
    ["苏娜", "Su"],
    ["赫拉", "He"],
    ["纽斯", "Nu"],
    ["沃尔", "Wo"],
  ];

  let next = text;
  for (const [index, [chineseName, englishName]] of legacyRunes.entries()) {
    const number = index + 1;
    next = next.replaceAll(`古符：${chineseName}ÿc2(#${number})`, `古符：${englishName}ÿc2(#${number})`);
    for (const prefix of ["古符", "低级古符", "中级古符", "高级古符"]) {
      next = next.replaceAll(`${prefix}-${chineseName}ÿc2#${number}`, `${prefix}-${englishName}ÿc2#${number}`);
    }
  }
  for (const [index, [chineseName, englishName]] of easternSunRunes.entries()) {
    const number = index + 1;
    next = next.replaceAll(`新符-${chineseName}ÿc2#${number}`, `新符-${englishName}ÿc2#${number}`);
  }

  return next;
}

function assertSameSequence(label, current, reference) {
  if (current.length !== reference.length) {
    throw new Error(`${label} count mismatch: current ${current.length}, reference ${reference.length}`);
  }

  const mismatch = current.findIndex((value, index) => value !== reference[index]);
  if (mismatch !== -1) {
    throw new Error(`${label} mismatch at ${mismatch}: current ${current[mismatch]}, reference ${reference[mismatch]}`);
  }
}

const args = parseArgs(process.argv.slice(2));
const currentPath = args.current;
const referencePath = args.reference;
const outPath = args.out ?? "mpq-data/D2RLAN/Filters/override_rules.lua";

if (!currentPath || !referencePath) {
  console.error("Usage: node tools/sync-override-rules-from-reference.mjs --current <override_rules.lua> --reference <override_rules_cn.lua> [--out <path>]");
  process.exit(2);
}

const currentText = fs.readFileSync(currentPath, "utf8");
const referenceText = fs.readFileSync(referencePath, "utf8");

const currentCodes = extractCodes(currentText);
const referenceCodes = extractCodes(referenceText);
assertSameSequence("rule code", currentCodes, referenceCodes);

const referenceChinese = extractLocaleValues(referenceText, "enUS");
const currentEnUS = extractLocaleValues(currentText, "enUS");
const currentZhCN = extractLocaleValues(currentText, "zhCN");
if (referenceChinese.length !== currentEnUS.length || referenceChinese.length !== currentZhCN.length) {
  throw new Error(`locale value count mismatch: reference enUS ${referenceChinese.length}, current enUS ${currentEnUS.length}, current zhCN ${currentZhCN.length}`);
}

let nextText = replaceLocaleValues(currentText, "enUS", referenceChinese);
nextText = replaceLocaleValues(nextText, "zhCN", referenceChinese);
nextText = normalizeRuneNames(nextText);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, nextText, "utf8");

const changedEnUS = currentEnUS.filter((value, index) => value !== referenceChinese[index]).length;
const changedZhCN = currentZhCN.filter((value, index) => value !== referenceChinese[index]).length;

console.log(JSON.stringify({
  out: outPath,
  rules: currentCodes.length,
  localeValues: referenceChinese.length,
  changedEnUS,
  changedZhCN,
}, null, 2));
