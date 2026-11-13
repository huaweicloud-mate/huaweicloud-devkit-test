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
const same = uc.judgeUpdate("1.1.13", { latest: "1.1.13" }, null);
const behind = uc.judgeUpdate("1.1.13", { latest: "1.1.12" }, null);
const pass = same.result === "up_to_date" && behind.result === "up_to_date" && behind.updateAvailable === false;
finish(pass ? "PASS" : "FAIL", "same=" + same.result + " behind=" + behind.result + " (无版本倒退)");
