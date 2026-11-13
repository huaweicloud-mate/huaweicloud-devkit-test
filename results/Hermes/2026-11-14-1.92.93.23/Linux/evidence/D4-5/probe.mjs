import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
const del = sp.classifyHcloudArgs(["ECS","DeleteServer"]);
const read = sp.classifyHcloudArgs(["ECS","ListServersDetails"]);
const pass = del.decision === "deny" && del.risk === "write" && read.risk === "read_only" && read.decision === "allow";
finish(pass ? "PASS" : "FAIL", "DeleteServer=" + del.decision + "/" + del.risk + " ListServersDetails=" + read.decision + "/" + read.risk);
