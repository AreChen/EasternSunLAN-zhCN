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
