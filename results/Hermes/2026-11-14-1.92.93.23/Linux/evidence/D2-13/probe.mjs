import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as cr from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs";
process.env.HUAWEICLOUD_HOME = join(tmpdir(), "hdk-r9-" + process.pid);
process.env.HW_ACCESS_KEY = "ENVAK000000000000000";
process.env.HW_SECRET_KEY = "ENVSK000000000000000";
cr.writeGlobalCredentials({ ak: "S1AK0000000000000000", sk: "S1SK0000000000000000", securityToken: "", region: "cn-north-4", configuredBySession: true });
const withFlag = cr.resolveCredentials({ allowMissing: false });
cr.setConfiguredBySession(false);
const withoutFlag = cr.resolveCredentials({ allowMissing: false });
const pass = withFlag.ak === "S1AK0000000000000000" && withoutFlag.ak === "ENVAK000000000000000";
finish(pass ? "PASS" : "FAIL", "S1优先=" + withFlag.ak.slice(0,3) + " env兜底=" + withoutFlag.ak.slice(0,3));
