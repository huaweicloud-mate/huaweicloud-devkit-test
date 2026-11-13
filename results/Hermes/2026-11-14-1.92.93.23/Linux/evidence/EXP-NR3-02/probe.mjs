import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}

const U = await import(pathToFileURL(SRC + "/update-check.mjs").href);
const r = U.judgeUpdate("1.1.13", { latest: "1.1.13" }, null);
const pass = r.result === "up_to_date" && r.updateAvailable === false;
finish(pass ? "PASS" : "FAIL", JSON.stringify(r));
