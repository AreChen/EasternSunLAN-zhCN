#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_LEGACY_SOURCE = "H:/D2RLAN/D2R/Mods/EasternSunLAN/EasternSunLAN.mpq/data/local/lng/strings-legacy";
const DEFAULT_REFERENCE_STRINGS = "H:/D2RLAN/REF/EasternSunLANx/EasternSunLANx.mpq/data/local/lng/strings";

const CURATED_RARE_NAME_FRAGMENTS = {
  "item-nameaffixes.json": {
    Stone: "磐石",
    Corpse: "尸骸",
    Grim: "冷酷",
    GloomUM: "幽暗",
    StoneUM: "磐石",
  },
  "item-names.json": {
    nails: "钉刺",
    Tooth: "利齿",
    Imp: "邪灵",
    hood: "罩影",
    veil: "帷幕",
  },
};

const TRADITIONAL_TO_SIMPLIFIED = new Map([
  ["體", "体"], ["齒", "齿"], ["釘", "钉"], ["塊", "块"], ["惡", "恶"], ["靈", "灵"],
  ["陰", "阴"], ["殘", "残"], ["酷", "酷"], ["護", "护"], ["備", "备"], ["帶", "带"],
  ["長", "长"], ["靴", "靴"], ["鎚", "锤"], ["鐵", "铁"], ["鋼", "钢"], ["劍", "剑"],
  ["頭", "头"], ["盔", "盔"], ["鍊", "链"], ["鎧", "铠"], ["戰", "战"], ["甲", "甲"],
  ["寶", "宝"], ["黃", "黄"], ["紅", "红"], ["藍", "蓝"], ["綠", "绿"], ["鑽", "钻"],
  ["骷", "骷"], ["髏", "髅"], ["無", "无"], ["瑕", "瑕"], ["疵", "疵"], ["碎", "碎"],
  ["裂", "裂"], ["開", "开"], ["質", "质"], ["損", "损"], ["優", "优"], ["鑲", "镶"],
  ["嵌", "嵌"], ["堅", "坚"], ["強", "强"], ["榮", "荣"], ["聖", "圣"], ["潔", "洁"],
  ["狡", "狡"], ["詐", "诈"], ["鋸", "锯"], ["蠻", "蛮"], ["撓", "挠"], ["韌", "韧"],
  ["銅", "铜"], ["銀", "银"], ["鋒", "锋"], ["緻", "致"], ["騎", "骑"], ["領", "领"],
  ["嚎", "嚎"], ["幸", "幸"], ["運", "运"], ["璀", "璀"], ["閃", "闪"], ["爍", "烁"],
  ["爾", "尔"], ["龍", "龙"], ["棱", "棱"], ["鈷", "钴"], ["赭", "赭"], ["綠", "绿"],
  ["柱", "柱"], ["僧", "僧"], ["侶", "侣"], ["骸", "骸"], ["屍", "尸"], ["塚", "冢"],
  ["鑰", "钥"], ["嚴", "严"], ["峻", "峻"], ["塵", "尘"], ["霧", "雾"], ["霜", "霜"],
  ["貪", "贪"], ["榮", "荣"], ["復", "复"], ["甦", "苏"], ["實", "实"], ["戰", "战"],
  ["鬥", "斗"], ["傳", "传"], ["送", "送"], ["歡", "欢"], ["樂", "乐"], ["慣", "惯"],
  ["號", "号"], ["華", "华"], ["娜", "娜"], ["維", "维"], ["馬", "马"], ["羅", "罗"],
  ["薩", "萨"], ["賽", "赛"], ["麥", "麦"], ["歐", "欧"], ["雷", "雷"], ["亞", "亚"],
]);

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

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function writeJsonLike(filePath, value, sourceText = "") {
  const compact = sourceText && !sourceText.slice(0, 1000).includes("\n");
  const text = compact ? JSON.stringify(value) : JSON.stringify(value, null, 2);
  fs.writeFileSync(filePath, `${text}\n`, "utf8");
}

function listJsonFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }
  return fs.readdirSync(root).filter((name) => name.endsWith(".json")).sort();
}

function buildIndexes(root) {
  const byFile = new Map();
  const byAnyKey = new Map();

  for (const fileName of listJsonFiles(root)) {
    const records = readJson(path.join(root, fileName));
    const fileMap = new Map();
    for (const record of records) {
      if (!record.Key) {
        continue;
      }
      fileMap.set(record.Key, record);
      if (!byAnyKey.has(record.Key)) {
        byAnyKey.set(record.Key, record);
      }
    }
    byFile.set(fileName, fileMap);
  }

  return { byFile, byAnyKey };
}

function simplifyTraditional(value) {
  return String(value).replace(/[\s\S]/gu, (char) => TRADITIONAL_TO_SIMPLIFIED.get(char) ?? char);
}

function localizedValueForRecord(record, fileName, sources) {
  const curated = CURATED_RARE_NAME_FRAGMENTS[fileName]?.[record.Key];
  if (curated) {
    return { value: curated, source: "curated" };
  }

  const sameCurrent = sources.current.byFile.get(fileName)?.get(record.Key)?.zhCN;
  if (sameCurrent) {
    return { value: sameCurrent, source: "current-same-file" };
  }

  const anyCurrent = sources.current.byAnyKey.get(record.Key)?.zhCN;
  if (anyCurrent) {
    return { value: anyCurrent, source: "current-any-file" };
  }

  const sameReference = sources.reference.byFile.get(fileName)?.get(record.Key)?.zhCN;
  if (sameReference) {
    return { value: sameReference, source: "reference-same-file" };
  }

  const anyReference = sources.reference.byAnyKey.get(record.Key)?.zhCN;
  if (anyReference) {
    return { value: anyReference, source: "reference-any-file" };
  }

  if (record.zhCN) {
    return { value: record.zhCN, source: "existing-zhCN" };
  }

  if (record.zhTW) {
    return { value: simplifyTraditional(record.zhTW), source: "zhTW-fallback" };
  }

  return { value: record.enUS ?? "", source: "enUS-fallback" };
}

function applyCuratedMainStrings(stringsRoot, write) {
  const changed = [];
  for (const [fileName, replacements] of Object.entries(CURATED_RARE_NAME_FRAGMENTS)) {
    const paths = [
      path.join(stringsRoot, fileName),
      path.join(stringsRoot, "translated_strings", `translated_${fileName}`),
    ];

    for (const filePath of paths) {
      if (!fs.existsSync(filePath)) {
        continue;
      }
      const sourceText = readText(filePath);
      const records = JSON.parse(sourceText);
      let fileChanged = false;
      for (const record of records) {
        const next = replacements[record.Key];
        if (next && record.zhCN !== next) {
          record.zhCN = next;
          fileChanged = true;
          changed.push(`${filePath}:${record.Key}`);
        }
      }
      if (write && fileChanged) {
        writeJsonLike(filePath, records, sourceText);
      }
    }
  }
  return changed;
}

function syncLegacyStrings(options) {
  const legacySource = options.legacySource;
  const outRoot = options.outRoot;
  const sources = {
    current: buildIndexes(options.stringsRoot),
    reference: buildIndexes(options.referenceStrings),
  };
  const stats = {};
  const changedFiles = [];

  if (!fs.existsSync(legacySource)) {
    throw new Error(`Missing legacy source directory: ${legacySource}`);
  }

  if (options.write) {
    fs.mkdirSync(outRoot, { recursive: true });
  }

  for (const fileName of listJsonFiles(legacySource)) {
    const sourcePath = path.join(legacySource, fileName);
    const sourceText = readText(sourcePath);
    const records = JSON.parse(sourceText);
    const sourceCounts = {};

    for (const record of records) {
      const localized = localizedValueForRecord(record, fileName, sources);
      record.zhCN = localized.value;
      sourceCounts[localized.source] = (sourceCounts[localized.source] ?? 0) + 1;
    }

    const outPath = path.join(outRoot, fileName);
    const nextText = `${JSON.stringify(records, null, 2)}\n`;
    const currentText = fs.existsSync(outPath) ? readText(outPath) : "";
    if (currentText !== nextText) {
      changedFiles.push(fileName);
      if (options.write) {
        fs.writeFileSync(outPath, nextText, "utf8");
      }
    }

    stats[fileName] = {
      records: records.length,
      sources: sourceCounts,
      blankZhCN: records.filter((record) => !String(record.zhCN ?? "").trim()).length,
    };
  }

  return { changedFiles, stats };
}

const args = parseArgs(process.argv.slice(2));
const write = args.write === true || args.write === "true";
const check = args.check === true || args.check === "true";

if (!write && !check) {
  console.error("Pass --write to update strings-legacy or --check to verify it is already synced.");
  process.exit(2);
}

const stringsRoot = args.strings ?? "strings";
const result = {
  write,
  check,
  curatedChanges: applyCuratedMainStrings(stringsRoot, write),
  legacy: syncLegacyStrings({
    stringsRoot,
    legacySource: args["legacy-source"] ?? DEFAULT_LEGACY_SOURCE,
    referenceStrings: args["reference-strings"] ?? DEFAULT_REFERENCE_STRINGS,
    outRoot: args.out ?? "strings-legacy",
    write,
  }),
};

console.log(JSON.stringify(result, null, 2));

if (check && (result.curatedChanges.length > 0 || result.legacy.changedFiles.length > 0)) {
  process.exit(1);
}
