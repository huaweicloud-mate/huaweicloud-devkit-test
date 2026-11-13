import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
const verbs = [["ECS","CreateServer"],["ECS","DeleteServer"],["ECS","UpdateServer"],["ECS","ResizeServer"],["ECS","StartServer"],["ECS","StopServer"],["ECS","AuthorizeServerGroup"],["ECS","RevokeServerGroup"],["ECS","AttachServerVolume"],["ECS","DetachServerVolume"],["RDS","EnableInstance"],["RDS","DisableInstance"]];
const res = verbs.map(v => v[1] + "=>" + sp.classifyHcloudArgs(v).decision);
const pass = verbs.every(v => sp.classifyHcloudArgs(v).decision === "deny");
finish(pass ? "PASS" : "FAIL", JSON.stringify(res));
