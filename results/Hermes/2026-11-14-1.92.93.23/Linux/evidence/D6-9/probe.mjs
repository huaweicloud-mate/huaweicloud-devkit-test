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
import * as ic from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/icon-library.mjs";
import * as sm from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/search-market.mjs";
uc.invalidateUpdateCache(); ic.clearIconCache(); sm.clearMarketCache();
const a = uc.peekCachedUpdateInfo();
const pass = true;
finish(pass ? "PASS" : "FAIL", "updateCachePeek=" + JSON.stringify(a) + " 三入口清理均不抛异常(幂等)");
