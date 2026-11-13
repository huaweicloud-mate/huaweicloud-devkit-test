import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HDK = "/home/zhangshuang/devkit-test/Hermes/hdk";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }

import { existsSync, readFileSync } from "node:fs";
const hooksJson = HDK + "/plugins/huaweicloud-core/hooks/hooks.json";
const nodeHook = HDK + "/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs";
const SP = await import(pathToFileURL(SRC + "/safety-policy.mjs").href);
const hj = existsSync(hooksJson) ? readFileSync(hooksJson, "utf8") : "";
const nh = existsSync(nodeHook) ? readFileSync(nodeHook, "utf8") : "";
const r = SP.classifyTextCommand("hcloud ecs DeleteServer --force");
const hookWired = /\.mjs/.test(hj) || /huaweicloud-safety\.mjs/.test(nh) || /huaweicloud-safety/.test(hj);
const pass = hookWired && (r.decision === "deny" || r.decision === "block");
finish(pass ? "PASS" : "FAIL", "hooks.json注册mjs=" + hookWired + " 高危决策=" + r.decision);
