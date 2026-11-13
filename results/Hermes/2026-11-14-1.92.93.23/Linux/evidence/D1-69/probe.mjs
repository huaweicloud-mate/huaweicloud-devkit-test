import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }
const child = spawn(process.execPath, ["--experimental-sqlite", "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/setup-cli.mjs", "help"], { stdio:["pipe","pipe","pipe"] });
let out=""; child.stdout.on("data", d=>out+=d); let err=""; child.stderr.on("data", d=>err+=d);
child.on("close", code => {
  const hasCmd = /install|doctor|status|update|uninstall|help/i.test(out);
  finish((code===0 && out.trim().length>0 && hasCmd) ? "PASS":"FAIL", "exit="+code+" len="+out.length+" hasCmds="+hasCmd);
  process.exit(0);
});
