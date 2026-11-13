import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as rr from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs";
const destructive = rr.evaluateCommandRisk("hcloud RDS DeleteInstance --force");
const pub = rr.evaluateDeployPlan({ resources: [{ type: "FunctionGraph", publicAccess: true }] });
const dok = destructive.decision === "deny" || destructive.decision === "warn";
const pok = pub.decision === "deny" || pub.decision === "warn";
const pass = dok && pok;
finish(pass ? "PASS" : "FAIL", "destructive=" + JSON.stringify(destructive) + " public=" + JSON.stringify(pub));
