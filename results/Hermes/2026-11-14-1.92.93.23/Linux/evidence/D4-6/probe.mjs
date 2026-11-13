import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
const r = sp.redactSecrets("adminPass=Secret123 access_key=AK_QWER secret_key=SK_ASDF");
const pass = r.includes("adminPass=<redacted>") && !r.includes("Secret123") && !r.includes("AK_QWER") && !r.includes("SK_ASDF");
finish(pass ? "PASS" : "FAIL", "redacted => " + r);
