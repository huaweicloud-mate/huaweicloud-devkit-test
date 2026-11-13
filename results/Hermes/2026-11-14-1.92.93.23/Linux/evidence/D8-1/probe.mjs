import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const SRC = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src";
const HDK = "/home/zhangshuang/devkit-test/Hermes/hdk";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const skillsDir = HDK + "/plugins/huaweicloud-core/skills";
const metas = ["huaweicloud-core","huaweicloud-safety","huaweicloud-api-and-sdk","huaweicloud-capability-discovery","huaweicloud-cli-and-auth","huaweicloud-troubleshooting","huawei-getting-started"];
let broken = 0, present = 0, executable = 0;
for (const m of metas) { const p = join(skillsDir, m, "SKILL.md"); if (!existsSync(p)) { broken++; continue; } present++; const t = readFileSync(p, "utf8"); const cleaned = t.replace(/placeholder.*replace|Replace the `[^`]+`.?placeholder/gi, ""); if (/<TODO>|待补充|PLACEHOLDER|not implemented/i.test(cleaned)) broken++; if (/hcloud|npx huaweicloud-devkit|npm (install|run)|node |install\/doctor/i.test(t)) executable++; }
const pass = broken === 0 && present === 7 && executable >= 5;
finish(pass ? "PASS" : "FAIL", "meta技能 present=" + present + "/7 broken=" + broken + " executable=" + executable);
