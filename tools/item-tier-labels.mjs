import fs from "node:fs";

export const DEFAULT_TIER_LABELS = {
  normal: "[N]",
  exceptional: "[Ex]",
  elite: "[El]",
};

const TIER_ORDER = ["normal", "exceptional", "elite"];

export function parseTsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return [];
  }

  const columns = lines[0].split("\t");
  return lines.slice(1).map((line, index) => {
    const values = line.split("\t");
    const row = { _line: index + 2 };
    columns.forEach((column, columnIndex) => {
      row[column] = values[columnIndex] ?? "";
    });
    return row;
  });
}

export function readTsv(path) {
  return parseTsv(fs.readFileSync(path, "utf8"));
}

export function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

export function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function detectTier(row) {
  if (!row.code) {
    return null;
  }
  if (row.code === row.normcode) {
    return "normal";
  }
  if (row.code === row.ubercode) {
    return "exceptional";
  }
  if (row.code === row.ultracode) {
    return "elite";
  }
  return null;
}

function candidateScore(entry) {
  let score = 0;
  if (entry.spawnable === "1") {
    score += 10;
  }
  if (entry.spawnable !== "0") {
    score += 1;
  }
  return score;
}

export function buildTierMapFromRows(rows, options = {}) {
  const itemKeys = options.itemKeys ?? null;
  const byKey = new Map();
  const conflicts = [];

  for (const row of rows) {
    const tier = detectTier(row);
    const key = row.namestr;
    if (!tier || !key || key === "xxx") {
      continue;
    }
    if (itemKeys && !itemKeys.has(key)) {
      continue;
    }

    const candidate = {
      Key: key,
      tier,
      source: row.file ?? "",
      line: row._line ?? null,
      code: row.code,
      name: row.name ?? "",
      spawnable: row.spawnable ?? "",
    };
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, candidate);
      continue;
    }

    if (existing.tier === candidate.tier) {
      if (candidateScore(candidate) > candidateScore(existing)) {
        byKey.set(key, candidate);
      }
      continue;
    }

    const existingScore = candidateScore(existing);
    const candidateScoreValue = candidateScore(candidate);
    const keepCandidate = candidateScoreValue > existingScore;
    conflicts.push({
      Key: key,
      kept: keepCandidate ? candidate : existing,
      discarded: keepCandidate ? existing : candidate,
      reason: keepCandidate ? "preferred-spawnable-candidate" : "preferred-existing-entry",
    });

    if (keepCandidate) {
      byKey.set(key, candidate);
    }
  }

  const entries = [...byKey.values()];
  return {
    entries,
    tiers: new Map(entries.map((entry) => [entry.Key, entry.tier])),
    conflicts,
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripTierLabel(value, labels = DEFAULT_TIER_LABELS) {
  if (typeof value !== "string") {
    return value;
  }
  const labelValues = Object.values(labels).filter(Boolean);
  if (labelValues.length === 0) {
    return value;
  }
  const labelPattern = labelValues.map(escapeRegExp).join("|");
  return value.replace(new RegExp(`\\s+(?:${labelPattern})$`, "u"), "");
}

export function applyTierLabel(value, tier, labels = DEFAULT_TIER_LABELS) {
  const label = labels[tier];
  if (typeof value !== "string" || !label) {
    return value;
  }

  const base = stripTierLabel(value, labels);
  if (base.length === 0) {
    return value;
  }
  return `${base} ${label}`;
}

export function applyTierLabelsToRecords(records, tierMap, labels = DEFAULT_TIER_LABELS, options = {}) {
  const locale = options.locale ?? "zhCN";
  let changed = 0;
  let matched = 0;
  let skipped = 0;

  for (const record of records) {
    const tier = tierMap.get(record.Key);
    if (!tier) {
      skipped += 1;
      continue;
    }

    matched += 1;
    const nextValue = applyTierLabel(record[locale], tier, labels);
    if (nextValue !== record[locale]) {
      record[locale] = nextValue;
      changed += 1;
    }
  }

  return { changed, matched, skipped };
}

export function removeTierLabelsFromRecords(records, tierMap, labels = DEFAULT_TIER_LABELS, options = {}) {
  const locale = options.locale ?? "zhCN";
  let changed = 0;
  let matched = 0;
  let skipped = 0;

  for (const record of records) {
    const tier = tierMap.get(record.Key);
    if (!tier) {
      skipped += 1;
      continue;
    }

    matched += 1;
    const nextValue = stripTierLabel(record[locale], labels);
    if (nextValue !== record[locale]) {
      record[locale] = nextValue;
      changed += 1;
    }
  }

  return { changed, matched, skipped };
}

export function loadTierConfig(path) {
  const config = readJson(path);
  const labels = config.labels ?? DEFAULT_TIER_LABELS;
  const tiers = new Map((config.tiers ?? []).map((entry) => [entry.Key, entry.tier]));
  return { config, labels, tiers };
}

export function sortTierEntriesByItemNameOrder(entries, itemRecords) {
  const order = new Map(itemRecords.map((record, index) => [record.Key, index]));
  return [...entries].sort((a, b) => {
    const aOrder = order.get(a.Key) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = order.get(b.Key) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    const tierDiff = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
    if (tierDiff !== 0) {
      return tierDiff;
    }
    return a.Key.localeCompare(b.Key);
  });
}
