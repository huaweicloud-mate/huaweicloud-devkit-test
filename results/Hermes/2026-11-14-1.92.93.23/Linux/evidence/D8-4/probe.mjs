import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }

import { readFileSync, existsSync } from "node:fs";
const cli = readFileSync(SRC + "/setup-cli.mjs", "utf8");
const cmds = ["install","status","doctor","update","uninstall"];
const found = cmds.filter(c => new RegExp("case ['\"]" + c + "['\"]|'" + c + "'|\"" + c + "\"").test(cli));
const pass = found.length >= 5;
finish(pass ? "PASS" : "FAIL", "CLI子命令找到=" + found.join(",") + " (" + found.length + "/5)");
