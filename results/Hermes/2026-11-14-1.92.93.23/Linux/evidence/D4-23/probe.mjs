import { pathToFileURL } from "node:url";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
const HDK = "/home/zhangshuang/devkit-test/Hermes/hdk";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }
const rulesOk = existsSync(HDK+"/rules/huawei-agent-rules.mdc") && readFileSync(HDK+"/rules/huawei-agent-rules.mdc","utf8").length > 200;
const sc = readFileSync(HDK+"/plugins/huaweicloud-core/src/setup-cli.mjs","utf8");
const ag = readFileSync(HDK+"/plugins/huaweicloud-core/src/auth/agent-registration.mjs","utf8");
const inject = /function injectAgentRules/.test(sc) && /AGENT_RULES_FILE/.test(sc) && /copyFileVerified\(rulesSrc/.test(sc);
const targets = (ag.match(/SUPPORTED_AGENT_TARGETS\s*=\s*\[([\s\S]*?)\]/)||["",""])[1].match(/'[a-z-]+'/g)||[];
const pass = rulesOk && inject && targets.length === 11;
finish(pass ? "PASS" : "FAIL", "rules文件=" + rulesOk + " 注入机制=" + inject + " 目标数=" + targets.length + "(期望11)");
