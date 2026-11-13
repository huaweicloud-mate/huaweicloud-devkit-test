import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}

const U = await import(pathToFileURL(SRC + "/update-check.mjs").href);
let r;
try { r = U.queryDistTagsSync(); } catch (e) { r = { err: e.message }; }
const pass = r && typeof r === "object" && (r.latest || r.next);
finish(pass ? "PASS" : "FAIL", "queryDistTagsSync=" + JSON.stringify(r));
