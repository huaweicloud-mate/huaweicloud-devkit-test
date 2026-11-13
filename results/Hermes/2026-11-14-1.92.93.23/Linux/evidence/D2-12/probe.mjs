import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as sv from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/service.mjs";
import * as cr from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs";
process.env.HUAWEICLOUD_HOME = join(tmpdir(), "hdk-r10-" + process.pid);
cr.writeGlobalCredentials({ ak: "FAKEAK00000000000000", sk: "FAKESK00000000000000", region: "cn-north-4" });
cr.setRuntimeCredentials("FAKEAK00000000000000", "FAKESK00000000000000", undefined, "cn-north-4");
const hasRT = cr.hasRuntimeCredentials();
const r = sv.syncAuth();
const pass = hasRT === true && r.ok === false && r.code === "HDKIT_SYNC_SKIPPED_RUNTIME";
finish(pass ? "PASS" : "FAIL", "hasRuntime=" + hasRT + " ok=" + r.ok + " code=" + r.code);
