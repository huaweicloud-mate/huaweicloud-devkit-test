import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
const variants = ["hcloud ECS Deleteserver", "hcloud ECS DELETESERVER", "hcloud ECS De'leteServer", "hcloud ECS DeleteServer --server_id=x"];
const res = variants.map(c => c + "=>" + sp.classifyTextCommand(c).decision);
const pass = variants.every(c => sp.classifyTextCommand(c).decision === "deny");
finish(pass ? "PASS" : "FAIL", JSON.stringify(res));
