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
const f = join(tmpdir(), "hdk-d1-33-" + process.pid + ".json");
uc.writeSkipState(f, "1.1.2", { at: 1700000000 });
const rb = uc.readSkipState(f);
const resolved = uc.resolveSkipFilePath();
const hasFields = rb && typeof rb.dismissedVersion === "string" && rb.dismissedAt && rb.expireAt;
rmSync(f, { force: true });
const pass = hasFields && typeof resolved === "string";
finish(pass ? "PASS" : "FAIL", "fields=" + JSON.stringify(rb) + " resolveSkipFilePath=" + resolved);
