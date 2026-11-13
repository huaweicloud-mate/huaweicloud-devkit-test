import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HOOK = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.py";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }
const SP = await import(pathToFileURL(SRC + "/safety-policy.mjs").href);
const cmds = ["cat ~/.config/huaweicloud/credentials.json", "env | grep HW_ACCESS_KEY", "hcloud ecs DeleteServer --force", "hcloud ecs ListServers", "hcloud vpc CreateVpc --name x", "hcloud obs ls"];
async function pyDeny(cmd) {
  const r = spawnSync("python3", [HOOK], { input: JSON.stringify({tool_name:"Bash", tool_input:{command: cmd}}), encoding:"utf8", timeout: 15000 });
  return /permissionDecision[\"']?\s*[:=]\s*[\"']?deny/i.test(r.stdout || "");
}
let agree = 0, total = cmds.length; const detail = [];
for (const c of cmds) {
  const n = SP.classifyTextCommand(c);
  const nodeDeny = (n.decision === "deny" || n.decision === "block");
  const pyDenyed = await pyDeny(c);
  if (nodeDeny === pyDenyed) agree++;
  detail.push(c.slice(0,30) + ":" + (nodeDeny?"D":"A") + "/" + (pyDenyed?"D":"A"));
}
const pass = agree === total;
finish(pass ? "PASS" : "FAIL", "Python/Node一致 " + agree + "/" + total + " [" + detail.join(" , ") + "]");
