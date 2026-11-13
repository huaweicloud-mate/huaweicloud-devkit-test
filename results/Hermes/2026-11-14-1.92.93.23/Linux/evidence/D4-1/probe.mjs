import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
const r = sp.classifyTextCommand("cat ~/.hcloud/credentials.json");
const pass = r.decision === "deny";
finish(pass ? "PASS" : "FAIL", "decision=" + r.decision + " risk=" + r.risk + " reason=" + r.reason);
