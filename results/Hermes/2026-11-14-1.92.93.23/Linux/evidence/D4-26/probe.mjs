import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as rr from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs";
const cmd = "hcloud CSMS CreateSecret --password=SuperSecret1 --token=Tok_Abc123 --access_key=AK_TEST123 --secret_key=SK_TEST456";
const r = rr.evaluateCommandRisk(cmd);
let ev = "";
if (r.findings && r.findings.length) ev = r.findings.map(f => f.evidence || "").join(" | ");
const leaked = /SuperSecret1|Tok_Abc123|AK_TEST123|SK_TEST456/.test(ev);
const hasRedact = ev.includes("<redacted>");
const fired = r.findings && r.findings.length > 0;
const pass = fired && !leaked && hasRedact;
finish(pass ? "PASS" : "FAIL", "fired=" + fired + " decision=" + r.decision + " evidence=" + ev);
