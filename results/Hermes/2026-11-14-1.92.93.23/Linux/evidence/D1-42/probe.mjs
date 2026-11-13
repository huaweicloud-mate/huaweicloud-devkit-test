import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const U = await import(pathToFileURL(SRC + "/update-check.mjs").href);
const dir = mkdtempSync(join(tmpdir(), "d142-"));
const file = join(dir, "skip.json");
const state = U.writeSkipState(file, "1.2.0", { at: Date.now(), days: 3 });
const expireOk = new Date(state.expireAt) - new Date(state.dismissedAt) === 3 * 86400000;
const inCool = U.judgeUpdate("1.1.4", { latest: "1.2.0" }, state, Date.now() + 60000);
const p1 = U.resolveSkipFilePath(null);
const p2 = U.resolveSkipFilePath("sess-abc-123");
const pass = expireOk && inCool.result === "dismissed" && Boolean(inCool.dismissExpiresAt)
  && p1.endsWith("devkit-skip.json") && p2 !== p1 && p2.startsWith(p1) && p2.endsWith(".sess-abc-123");
finish(pass ? "PASS" : "FAIL",
  "expireAt=+3d:" + expireOk + " 冷却期dismissed:" + (inCool.result === "dismissed")
  + " p1=" + p1 + " p2=" + p2);
