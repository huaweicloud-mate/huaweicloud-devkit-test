import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as rr from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs";
const cat = rr.loadRiskRules();
const arr = cat.rules || (Array.isArray(cat) ? cat : []);
const high = arr.filter(r => r.severity === "deny").length;
const warn = arr.filter(r => r.severity === "warn").length;
const danger = rr.evaluateCommandRisk("cat ~/.hcloud/credentials.json");
const rw = rr.evaluateCommandRisk("hcloud ECS DeleteServer --server_id=x");
const ro = rr.evaluateCommandRisk("hcloud ECS ListServersDetails");
const pass = arr.length >= 9 && (danger.decision === "deny") && ro.decision !== "deny";
finish(pass ? "PASS" : "FAIL", "rules=" + arr.length + "(deny=" + high + " warn=" + warn + ") danger=" + danger.decision + " write=" + rw.decision + " readonly=" + ro.decision);
