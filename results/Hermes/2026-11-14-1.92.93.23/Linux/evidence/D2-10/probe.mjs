import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) {
  const ts = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  writeFileSync(HERE + "stdout.log", JSON.stringify({ status, why, executedAt: ts }, null, 1));
}
import * as rc from "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs";
const dir = join(tmpdir(), "hdk-d2-10-" + process.pid);
mkdirSync(dir, { recursive: true });
const cfgPath = join(dir, "config.json");
writeFileSync(cfgPath, JSON.stringify({ current: "deploy", profiles: [{ name: "deploy", accessKeyId: "AK1", secretAccessKey: "SK1" }] }));
process.env.HCLOUD_CONFIG_PATH = cfgPath;
const cur = rc.resolveManagedProfile();
const res = rc.readKooCliProfiles();
const pass = cur === "deploy" && res.current === "deploy" && Array.isArray(res.profiles);
finish(pass ? "PASS" : "FAIL", "resolveManagedProfile=" + cur + " current=" + res.current);
