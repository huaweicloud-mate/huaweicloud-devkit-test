import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HDK = "/home/zhangshuang/devkit-test/Hermes/hdk";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }

import { existsSync, readFileSync } from "node:fs";
const manifest = HDK + "/integrations/hermes/manifest.yaml";
const alt = HDK + "/plugins/huaweicloud-core/.hermes-plugin/plugin.json";
const pass = existsSync(manifest) || existsSync(alt);
finish(pass ? "PASS" : "FAIL", "hermes manifest=" + manifest + " exists=" + existsSync(manifest) + " altExists=" + existsSync(alt));
