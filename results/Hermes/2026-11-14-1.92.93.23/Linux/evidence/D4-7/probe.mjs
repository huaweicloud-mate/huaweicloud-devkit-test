import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
import * as rr from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs";
const cmd = sp.classifyTextCommand("hcloud ECS DeleteServer --server_id=x");
const art = rr.evaluateArtifacts([{ path: "iam-policy.json", content: JSON.stringify({ Statement: [{ Effect: "Allow", Action: ["*:*"], Resource: "*" }] }) }]);
const dep = rr.evaluateDeployPlan({ resources: [{ type: "FunctionGraph", publicAccess: true }] });
const aok = art.decision === "deny" || art.decision === "warn";
const dok = dep.decision === "deny" || dep.decision === "warn";
const pass = cmd.decision === "deny" && aok && dok;
finish(pass ? "PASS" : "FAIL", "command=" + cmd.decision + " artifacts=" + JSON.stringify(art) + " deploy=" + JSON.stringify(dep));
