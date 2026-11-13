import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as uc from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs";
const src = readFileSync(SRC + "/update-check.mjs", "utf8");
const hasGate = src.includes("HUAWEICLOUD_DEVKIT_DEBUG");
const hasTrue = src.includes("HUAWEICLOUD_DEVKIT_DEBUG === '1'") || src.includes("HUAWEICLOUD_DEVKIT_DEBUG === 'true'");
process.env.HUAWEICLOUD_DEVKIT_DEBUG = "1";
const r = uc.semverCompare("1.1.2","1.1.1");
const pass = hasGate && hasTrue && r > 0;
finish(pass ? "PASS" : "FAIL", "debugGate=" + hasGate + " gateCond=true分支=" + hasTrue + " 正常返回=" + r);
