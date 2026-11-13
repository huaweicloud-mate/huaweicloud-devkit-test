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
process.env.HUAWEICLOUD_HOME = join(tmpdir(), "hdk-r26-" + process.pid);
cr.writeGlobalCredentials({ ak: "BAKAK000000000000000", sk: "BAKSK000000000000000", region: "cn-north-4" });
const bak = cr.backupGlobalCredentials();
cr.writeGlobalCredentials({ ak: "CORRUPT", sk: "X", region: "cn-north-4" });
cr.restoreGlobalCredentialsBackup();
const after = cr.readGlobalCredentials();
const pass = Boolean(bak) && after.ak === "BAKAK000000000000000";
finish(pass ? "PASS" : "FAIL", "backupPath=" + bak + " restoredAk=" + (after && after.ak));
