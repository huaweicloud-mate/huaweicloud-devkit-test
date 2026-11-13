import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as rr from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs";
const art = rr.evaluateArtifacts([{ path: "iam-policy.json", content: JSON.stringify({ Statement: [{ Effect: "Allow", Action: ["*:*"], Resource: "*" }] }) }]);
const pass = art.decision === "deny";
finish(pass ? "PASS" : "FAIL", JSON.stringify(art));
