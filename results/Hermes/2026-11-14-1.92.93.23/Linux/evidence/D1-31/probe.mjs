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
const f = join(tmpdir(), "hdk-d1-31-" + process.pid + ".json");
const now = 1700000000000;
const skip = uc.writeSkipState(f, "1.1.2", { at: now, days: 3 });
const rb = uc.readSkipState(f);
const inCd = uc.judgeUpdate("1.1.1", { latest: "1.1.2" }, rb, now + 1000);
const expired = uc.judgeUpdate("1.1.1", { latest: "1.1.2" }, rb, now + 3 * 86400000 + 1000);
const pass = inCd.result === "dismissed" && inCd.dismissed === true && rb.expireAt && expired.result === "update_available";
rmSync(f, { force: true });
finish(pass ? "PASS" : "FAIL", "dismissed=" + inCd.result + " expireAt=" + rb.expireAt + " afterExpiry=" + expired.result);
