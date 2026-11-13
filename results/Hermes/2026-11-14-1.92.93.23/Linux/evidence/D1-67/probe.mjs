import { pathToFileURL } from "node:url";
import { writeFileSync, readFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }
const mc = readFileSync(SRC + "/mcp-config-merge.mjs", "utf8");
const sc = readFileSync(SRC + "/setup-cli.mjs", "utf8");
const reqEnv = /REQUIRED_ENV_KEYS\s*=\s*new Set\(\[[^\]]*HCLOUD_BIN[^\]]*\]/.test(mc);
const injectMode = /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(sc);
const skipDsh = /SKIP_DSH_PLUGIN_INSTALL/.test(sc);
const pass = reqEnv && injectMode && skipDsh;
finish(pass ? "PASS" : "FAIL", "REQUIRED_ENV_KEYS含HCLOUD_BIN=" + reqEnv + " AGENT_TOOLKIT_MODE注入=" + injectMode + " SKIP_DSH机制=" + skipDsh);
