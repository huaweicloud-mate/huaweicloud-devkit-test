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
const a = uc.semverCompare("1.1.2","1.1.1") > 0;
const b = uc.semverCompare("1.1.0","1.1.0-next.9") > 0;
const c = uc.semverCompare("1.1.0","1.1.0") === 0;
const d = uc.semverCompare("1.1.2","1.1.2-next.0") > 0;
const pass = a && b && c && d;
finish(pass ? "PASS" : "FAIL", "1.1.2>1.1.1=" + a + " 1.1.0>next.9=" + b + " equal0=" + c + " stable>pre=" + d);
