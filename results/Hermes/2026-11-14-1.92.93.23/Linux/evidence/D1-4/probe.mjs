import { spawn } from "node:child_process";
import { writeFileSync, statSync } from "node:fs";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now() + 8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }
const cli = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/setup-cli.mjs";
function run(args) { return new Promise((res) => { const c = spawn(process.execPath, [cli, ...args], { stdio: ["pipe","pipe","pipe"] }); let o="",e=""; c.stdout.on("data",d=>o+=d); c.stderr.on("data",d=>e+=d); c.on("close",code=>res({code,o,e})); }); }
const before = (() => { try { return statSync(process.env.HOME + "/.config/huaweicloud/config.json").mtimeMs; } catch { return null; } })();
const r1 = await run(["status"]);
const r2 = await run(["status"]);
const after = (() => { try { return statSync(process.env.HOME + "/.config/huaweicloud/config.json").mtimeMs; } catch { return null; } })();
const idempotent = (r1.code === 0 && r2.code === 0) && (before === after);
finish(idempotent ? "PASS" : "FAIL", "status exit=" + r1.code + "/" + r2.code + " config未变=" + (before === after) + " outHead=" + (r1.o.slice(0,100)).replace(/\n/g," "));
