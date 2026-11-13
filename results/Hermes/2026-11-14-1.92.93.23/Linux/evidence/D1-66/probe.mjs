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
process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = "off";
const offR = tl.isTelemetryEnabled();
delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
const onR = tl.isTelemetryEnabled();
const pass = offR === false && onR === true;
finish(pass ? "PASS" : "FAIL", "off=" + offR + " on=" + onR);
