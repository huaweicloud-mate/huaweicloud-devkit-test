import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
import * as hc from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs";
const text = "AK=AK_QWERTY123 SK=SK_ASDFGH456 securityToken=STT password=pw123";
const r1 = sp.redactSecrets(text);
const r2 = hc.redactOutput(text);
const clean = (s) => !(s.includes("AK_QWERTY123") || s.includes("SK_ASDFGH456") || s.includes("STT") || s.includes("pw123"));
const pass = clean(r1) && clean(r2);
finish(pass ? "PASS" : "FAIL", "redactSecrets=" + r1 + " | redactOutput=" + r2);
