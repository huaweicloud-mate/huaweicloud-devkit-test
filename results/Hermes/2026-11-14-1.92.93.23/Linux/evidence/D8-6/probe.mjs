import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HDK = "/home/zhangshuang/devkit-test/Hermes/hdk";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }

import { readFileSync, existsSync } from "node:fs";
const en = readFileSync(HDK + "/README.md", "utf8");
const zh = readFileSync(HDK + "/README.zh-CN.md", "utf8");
const enOk = en.length > 100; const zhOk = zh.length > 100;
const kws = ["install","hcloud","MCP","doctor","skill"];
let kwOk = 0; for (const k of kws) if (en.toLowerCase().includes(k.toLowerCase()) && zh.includes(k)) kwOk++;
const pass = enOk && zhOk && kwOk >= 4;
finish(pass ? "PASS" : "FAIL", "EN=" + en.length + " CN=" + zh.length + " 关键词一致=" + kwOk + "/5");
