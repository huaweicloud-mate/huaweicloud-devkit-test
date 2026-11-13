import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
const r1 = sp.classifyTextCommand("hcloud CSMS ShowSecretVersion --secret_name=x");
const r2 = sp.classifyHcloudArgs(["CSMS","ShowSecretVersion","--secret_name","x"]);
const r3 = sp.classifyTextCommand("GetSecretValue secret_string abc");
const pass = r1.decision === "deny" && r2.decision === "deny" && r3.decision === "deny";
finish(pass ? "PASS" : "FAIL", "r1=" + r1.decision + "/" + r1.risk + " r2=" + r2.decision + "/" + r2.risk + " r3=" + r3.decision + "/" + r3.risk);
