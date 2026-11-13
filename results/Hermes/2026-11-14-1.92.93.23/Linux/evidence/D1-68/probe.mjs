import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as ic from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/icon-library.mjs";
import * as cr from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs";
process.env.HUAWEICLOUD_ICONS_OFFLINE = "1";
process.env.HW_ACCESS_KEY = "FAKEAK00000000000000";
process.env.HW_SECRET_KEY = "FAKESK00000000000000";
process.env.HUAWEICLOUD_REGION = "cn-north-4";
delete process.env.HW_REGION;
let region;
try { region = cr.resolveCredentials({ allowMissing: false }).region; } catch(e) { region = "ERR:" + e.message; }
let iconOk = false;
try { const ic2 = await ic.getServiceIcon("ecs", ""); iconOk = ic2 !== undefined && ic2 !== null; } catch(e) { iconOk = false; }
const pass = region === "cn-north-4" && iconOk;
finish(pass ? "PASS" : "FAIL", "region(HUAWEICLOUD_REGION)=" + region + " iconOffline=" + iconOk);
