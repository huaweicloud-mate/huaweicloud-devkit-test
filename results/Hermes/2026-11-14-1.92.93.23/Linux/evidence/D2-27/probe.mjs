import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as kv from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/koocli-version.mjs";
const ver = kv.getKooCliVersion();
const parsed = kv.parseHcloudVersion("hcloud 7.2.12 CLI (test build)");
const cmp = kv.compareVersion("7.2.12","7.2.9");
const base = kv.kooCliDownloadBase();
const pass = parsed === "7.2.12" && cmp === 1 && typeof base === "string" && base.toLowerCase().includes("koocli");
finish(pass ? "PASS" : "FAIL", "getKooCliVersion=" + ver + " parse=" + parsed + " compare=" + cmp + " base=" + base.slice(0,60));
