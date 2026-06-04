#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const defaults = {
  source: "H:/D2RLAN/D2R/Mods/EasternSunLAN/EasternSunLAN.mpq/data/hd/global/excel/desecratedzones.json",
  out: path.join(repoRoot, "mpq-data/hd/global/excel/desecratedzones.json"),
  stringsRoot: path.join(repoRoot, "strings"),
  levels: "H:/D2RLAN/D2R/Mods/EasternSunLAN/EasternSunLAN.mpq/data/global/excel/levels.txt"
};

function parseArgs(argv) {
  const args = {
    write: false,
    check: false,
    source: "",
    out: defaults.out,
    stringsRoot: defaults.stringsRoot,
    levels: defaults.levels
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--write") {
      args.write = true;
    } else if (arg === "--check") {
      args.check = true;
    } else if (arg === "--source") {
      args.source = argv[++i];
    } else if (arg === "--out") {
      args.out = argv[++i];
    } else if (arg === "--strings-root") {
      args.stringsRoot = argv[++i];
    } else if (arg === "--levels") {
      args.levels = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  args.out = path.resolve(args.out);
  args.stringsRoot = path.resolve(args.stringsRoot);
  if (!args.source) {
    args.source = fs.existsSync(args.out) ? args.out : defaults.source;
  }
  args.source = path.resolve(args.source);
  args.levels = path.resolve(args.levels);
  return args;
}

function readJsonArray(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [];
}

function walkJsonFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkJsonFiles(fullPath).forEach((file) => files.push(file));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }
  return files;
}

function buildTranslationMap(stringsRoot) {
  const translations = new Map();
  for (const filePath of walkJsonFiles(stringsRoot)) {
    const records = readJsonArray(filePath);
    for (const record of records) {
      const zhCN = typeof record.zhCN === "string" ? record.zhCN.trim() : "";
      if (!zhCN) {
        continue;
      }
      if (typeof record.Key === "string" && !translations.has(record.Key)) {
        translations.set(record.Key, record.zhCN);
      }
      if (typeof record.enUS === "string" && !translations.has(record.enUS)) {
        translations.set(record.enUS, record.zhCN);
      }
      if (!translations.has(record.zhCN)) {
        translations.set(record.zhCN, record.zhCN);
      }
    }
  }

  const curated = new Map([
    ["Chasm of Horror", "恐怖深渊"],
    ["Chasm of Horror Level 1", "恐怖深渊 第1层"],
    ["Chasm of Horror Level 2", "恐怖深渊 第2层"],
    ["Infested Lair Level 2", "感染的巢穴 第2层"],
    ["Tier 5 Map - The Sanctum of the Dead", "五阶地图 - 亡者圣所"]
  ]);

  for (const [key, value] of curated) {
    translations.set(key, value);
    translations.set(value, value);
  }

  return translations;
}

function readTsv(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split("\t");
  return lines.map((line) => {
    const values = line.split("\t");
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });
    return record;
  });
}

function buildActMapFromLevelNames(sourceText) {
  const actByLevelId = new Map();
  const marker = '"level_names"';
  const markerIndex = sourceText.indexOf(marker);
  if (markerIndex === -1) {
    return actByLevelId;
  }

  const openBracketIndex = sourceText.indexOf("[", markerIndex);
  if (openBracketIndex === -1) {
    return actByLevelId;
  }

  const closeBracketIndex = findMatchingBracket(sourceText, openBracketIndex);
  const body = sourceText.slice(openBracketIndex + 1, closeBracketIndex);
  for (const match of body.matchAll(/"id"\s*:\s*(\d+)\s*,\s*\r?\n\s*"name"\s*:\s*"((?:\\.|[^"\\])*)"/g)) {
    const id = Number(match[1]);
    const name = JSON.parse(`"${match[2]}"`);
    const actMatch = name.match(/^\[ACT([1-5])\]\s*/);
    if (Number.isInteger(id) && actMatch) {
      actByLevelId.set(id, Number(actMatch[1]));
    }
  }
  return actByLevelId;
}

function buildActMap(levelsPath, sourceText) {
  const actByLevelId = new Map();
  if (!fs.existsSync(levelsPath)) {
    const fallback = buildActMapFromLevelNames(sourceText);
    if (fallback.size === 0) {
      throw new Error(`Missing levels.txt and no [ACT] prefixes to infer act map: ${levelsPath}`);
    }
    return fallback;
  }

  for (const record of readTsv(levelsPath)) {
    const id = Number(record.Id);
    const zeroBasedAct = Number(record.Act);
    if (!Number.isInteger(id) || !Number.isInteger(zeroBasedAct)) {
      continue;
    }
    actByLevelId.set(id, zeroBasedAct + 1);
  }
  return actByLevelId;
}

function stripActPrefix(name) {
  return name.replace(/^\[(?:ACT|A)([1-5])\]\s*/i, "");
}

function formatLevelName(id, rawName, translations, actByLevelId) {
  const name = stripActPrefix(rawName);
  const localized = translations.get(name);
  if (!localized) {
    return { missing: name, name: rawName };
  }

  const act = id === 0 ? 0 : actByLevelId.get(id);
  if (!act) {
    return { missing: "", name: localized };
  }

  return { missing: "", name: `[ACT${act}] ${localized}` };
}

function findMatchingBracket(text, openBracketIndex) {
  let depth = 0;
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let i = openBracketIndex; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (char === "\"") {
      inString = true;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }

  throw new Error("Could not find matching bracket for level_names");
}

function localizeLevelNames(sourceText, translations, actByLevelId) {
  const marker = '"level_names"';
  const markerIndex = sourceText.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("Missing level_names in desecratedzones.json");
  }

  const openBracketIndex = sourceText.indexOf("[", markerIndex);
  if (openBracketIndex === -1) {
    throw new Error("Missing level_names array");
  }

  const closeBracketIndex = findMatchingBracket(sourceText, openBracketIndex);
  const before = sourceText.slice(0, openBracketIndex + 1);
  const body = sourceText.slice(openBracketIndex + 1, closeBracketIndex);
  const after = sourceText.slice(closeBracketIndex);

  const missing = new Set();
  let names = 0;
  let changed = 0;
  const localizedBody = body.replace(/("id"\s*:\s*(\d+)\s*,\s*\r?\n\s*"name"\s*:\s*)"((?:\\.|[^"\\])*)"/g, (match, prefix, rawId, rawName) => {
    const id = Number(rawId);
    const name = JSON.parse(`"${rawName}"`);
    names += 1;
    const result = formatLevelName(id, name, translations, actByLevelId);
    if (result.missing) {
      missing.add(result.missing);
      return match;
    }
    if (result.name !== name) {
      changed += 1;
    }
    return `${prefix}${JSON.stringify(result.name)}`;
  });

  return {
    text: `${before}${localizedBody}${after}`,
    names,
    changed,
    missing: [...missing].sort()
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const translations = buildTranslationMap(args.stringsRoot);
  const sourceText = fs.readFileSync(args.source, "utf8");
  const actByLevelId = buildActMap(args.levels, sourceText);
  const result = localizeLevelNames(sourceText, translations, actByLevelId);
  const currentText = fs.existsSync(args.out) ? fs.readFileSync(args.out, "utf8") : "";
  const outputChanged = currentText !== result.text;

  if (args.write && outputChanged) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, result.text, "utf8");
  }

  const summary = {
    source: path.relative(repoRoot, args.source) || args.source,
    out: path.relative(repoRoot, args.out) || args.out,
    write: args.write,
    check: args.check,
    levelNames: result.names,
    changedNames: result.changed,
    missingTranslations: result.missing.length,
    changed: outputChanged
  };
  console.log(JSON.stringify(summary, null, 2));

  if (result.missing.length > 0) {
    console.error(`Missing desecrated zone level name translations:\n${result.missing.join("\n")}`);
    process.exit(1);
  }

  if (args.check && outputChanged) {
    process.exit(1);
  }
}

main();
