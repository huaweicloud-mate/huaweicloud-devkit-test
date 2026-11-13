import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
import * as rr from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs";
let noCrash = true; const decs = [];
try { decs.push((sp.classifyTextCommand("{ } [ ]") || {}).decision); decs.push((rr.evaluateArtifacts("{bad json") || {}).decision); decs.push((rr.evaluateDeployPlan("{bad") || {}).decision); } catch(e) { noCrash = false; }
finish(noCrash ? "PASS" : "FAIL", "noCrash=" + noCrash + " decs=" + decs.join(","));
