import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const HERE = new URL(".", import.meta.url).pathname;
const FIX = "/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/eval/harness/fixtures/d9-13-credential-leak.mjs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }
const child = spawn(process.execPath, [FIX, SRC], { stdio: ["pipe","pipe","pipe"] });
let out = "", err = "";
child.stdout.on("data", d => { out += d; });
child.stderr.on("data", d => { err += d; });
child.on("close", code => {
  const status = code === 0 ? "PASS" : code === 2 ? "BLOCKED" : "FAIL";
  const tail = (out + "\n" + err).trim().split("\n").slice(-12).join(" | ");
  finish(status, "fixture=" + FIX.split("/").pop() + " exit=" + code + " tail=" + tail.slice(-600));
});
setTimeout(() => { finish("FAIL", "fixture timeout"); child.kill(); }, 120000);
