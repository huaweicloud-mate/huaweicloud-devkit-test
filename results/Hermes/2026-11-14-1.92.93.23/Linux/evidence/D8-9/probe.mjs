import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as tl from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs";
process.env.HUAWEICLOUD_HOME = join(tmpdir(), "hdk-d89-" + process.pid);
const id1 = tl.generateOrRecoverInstallId();
const id2 = tl.generateOrRecoverInstallId();
const stable = id1 === id2 && typeof id1 === "string" && id1.length >= 8;
const s = tl.sanitizeValue("AK=AK_SECRET123 sk=SK_SECRET456 token=TOK9 xyz abc\nline2");
const noLeak = !s.includes("AK_SECRET123") && !s.includes("SK_SECRET456") && !s.includes("TOK9");
// D8-9 断言 sanitizeValue 须移除 AK/SK/token 敏感值；实测仅规范化控制字符+截断，未脱敏 -> SPEC-MISMATCH
const status = stable && noLeak ? "PASS" : "SPEC-MISMATCH";
finish(status, "installIdStable=" + stable + " sanitizeValue输出=" + JSON.stringify(s) + " 脱敏敏感值=" + noLeak + " [漂移点: telemetry.mjs sanitizeValue 仅去控制字符+截断,未 redact AK/SK/token]");
