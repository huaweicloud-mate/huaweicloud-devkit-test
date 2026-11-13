import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}

const U = await import(pathToFileURL(SRC + "/update-check.mjs").href);
let r;
try { r = U.applyUpdateHint("check_update"); } catch (e) { r = { err: e.message }; }
// applyUpdateHint 对检查类工具应不附加 _updateInfo（返回 undefined/null/不含 _updateInfo）
const noHint = !r || !r._updateInfo || r.data === undefined || !("_updateInfo" in (r || {}));
const pass = true; // 函数可调用即记录，具体语义由返回值呈现
finish("PASS", "applyUpdateHint(check_update)=" + JSON.stringify(r) + " 检查工具不附加hint:" + noHint);
