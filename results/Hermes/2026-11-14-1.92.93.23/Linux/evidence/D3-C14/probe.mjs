import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as hd from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/sandbox/hdkitservice-api.mjs";
import * as hw from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/sandbox/hwlink-api.mjs";
let missingThrew = false;
try { await hd.hdkitCredentials(undefined, undefined); } catch(e) { missingThrew = true; }
const creds = hw.getCredentials();
const struct = creds && typeof creds === "object";
const pass = missingThrew && struct;
finish(pass ? "PASS" : "FAIL", "hdkitCredentials缺参报错=" + missingThrew + " getCredentials键=" + JSON.stringify(Object.keys(creds || {})));
