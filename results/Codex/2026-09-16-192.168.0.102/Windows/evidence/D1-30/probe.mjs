import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const source = process.env.HDK_SOURCE;
if (!source) throw new Error("HDK_SOURCE is required");
const {
  semverCompare,
  judgeUpdate,
  writeSkipState,
  resolveSkipFilePath,
} = await import(
  pathToFileURL(join(source, "plugins", "huaweicloud-core", "src", "update-check.mjs")).href,
);

const root = process.env.HDK_EVIDENCE_DIR || ".";
mkdirSync(root, { recursive: true });
const now = Date.parse("2026-09-16T00:00:00.000Z");
const checks = [];
const check = (name, actual, expected) => {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  checks.push({ name, pass, actual, expected });
  if (!pass) throw new Error(`${name}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
};

check("up_to_date", judgeUpdate("1.1.5", { latest: "1.1.5" }, null, now).result, "up_to_date");
check("update_available", judgeUpdate("1.1.4", { latest: "1.1.5" }, null, now).targetVersion, "1.1.5");
check("semver_release_gt_prerelease", semverCompare("1.1.0", "1.1.0-next.9"), 1);
check("semver_equal", semverCompare("1.1.5", "1.1.5"), 0);
check("semver_invalid_lexical", semverCompare("x", "y"), -1);
const skip = judgeUpdate(
  "1.1.4",
  { latest: "1.1.5" },
  { dismissedVersion: "1.1.5", expireAt: "2026-09-18T00:00:00.000Z" },
  now,
);
check("dismissed", skip.result, "dismissed");
const temp = join(root, "skip-fixture");
rmSync(temp, { recursive: true, force: true });
const file = join(temp, "nested", "skip.json");
const state = writeSkipState(file, "1.1.5", { at: now });
check("skip_fields", Object.keys(state).sort(), ["dismissedAt", "dismissedVersion", "expireAt"]);
check("skip_round_trip", JSON.parse(readFileSync(file, "utf8")).dismissedVersion, "1.1.5");
check("safe_session_suffix", resolveSkipFilePath("../unsafe/session").includes(".."), false);

console.log(JSON.stringify({ pass: true, checks }, null, 2));
