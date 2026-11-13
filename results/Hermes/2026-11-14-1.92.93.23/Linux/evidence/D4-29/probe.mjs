import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sp from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs";
import * as tools from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs";
const write = tools.classifyRawCommand("hcloud ECS DeleteServer --server_id=x");
const read = tools.classifyRawCommand("hcloud ECS ListServersDetails");
let threw = false; try { sp.assertAllowed(write); } catch(e) { threw = true; }
let allowOk = false; try { sp.assertAllowed(read); allowOk = true; } catch(e) {}
const pass = write.decision === "deny" && read.decision === "allow" && threw && allowOk;
finish(pass ? "PASS" : "FAIL", "write=" + write.decision + " read=" + read.decision + " assertDenyThrew=" + threw + " assertAllowOk=" + allowOk);
