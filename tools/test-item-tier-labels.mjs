import assert from "node:assert/strict";

import {
  applyTierLabel,
  applyTierLabelsToRecords,
  buildTierMapFromRows,
  removeTierLabelsFromRecords,
} from "./item-tier-labels.mjs";

const labels = {
  normal: "[N]",
  exceptional: "[Ex]",
  elite: "[El]",
};

assert.equal(applyTierLabel("轻腰带", "normal", labels), "轻腰带 [N]");
assert.equal(applyTierLabel("轻腰带 [N]", "normal", labels), "轻腰带 [N]");
assert.equal(applyTierLabel("轻腰带 [Ex]", "elite", labels), "轻腰带 [El]");

const { tiers } = buildTierMapFromRows([
  {
    file: "armor.txt",
    name: "Tiara",
    code: "ci2",
    namestr: "ci2",
    normcode: "cix",
    ubercode: "ci4",
    ultracode: "ci2",
    spawnable: "1",
  },
  {
    file: "armor.txt",
    name: "Tiara",
    code: "qi2",
    namestr: "ci2",
    normcode: "ci1",
    ubercode: "qi2",
    ultracode: "ci3",
    spawnable: "0",
  },
]);

assert.equal(tiers.get("ci2"), "elite");

const records = [
  { Key: "vbl", enUS: "Light Belt", zhCN: "轻腰带" },
  { Key: "unique-name", enUS: "Unique Name", zhCN: "暗金名" },
];

const result = applyTierLabelsToRecords(records, new Map([["vbl", "normal"]]), labels);

assert.equal(result.changed, 1);
assert.equal(records[0].zhCN, "轻腰带 [N]");
assert.equal(records[1].zhCN, "暗金名");

const removeResult = removeTierLabelsFromRecords(records, new Map([["vbl", "normal"]]), labels);

assert.equal(removeResult.changed, 1);
assert.equal(records[0].zhCN, "轻腰带");

console.log("item tier label tests OK");
