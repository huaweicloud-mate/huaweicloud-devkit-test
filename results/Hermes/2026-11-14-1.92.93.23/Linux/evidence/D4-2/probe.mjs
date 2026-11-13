import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
const cmds = ["printenv HW_ACCESS_KEY", "echo $HW_SECRET_KEY", "env | grep HUAWEICLOUD", "echo $HUAWEICLOUD_SECRET_ACCESS_KEY"];
const res = cmds.map(c => c + "=>" + sp.classifyTextCommand(c).decision);
const pass = cmds.every(c => sp.classifyTextCommand(c).decision === "deny");
finish(pass ? "PASS" : "FAIL", JSON.stringify(res));
