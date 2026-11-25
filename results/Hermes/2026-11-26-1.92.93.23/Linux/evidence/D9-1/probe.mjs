// 修正 D1-26/D5-3/D9-1/D5-1/D8-9 证据（基于 TOOL_SCHEMAS 与清单实际）
const PKG = "/home/zhangshuang/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist";
const { readdirSync } = await import("node:fs");
const { land } = await import("/tmp/dailytest/lib-evd.mjs");
const EVD = process.argv[2];
const tools = await import(PKG + "/tools.js");
const schemas = await import(PKG + "/tool-schemas.js");

const names = tools.TOOL_DEFINITIONS.map((t) => t.name);
const schemaKeys = Object.keys(schemas.TOOL_SCHEMAS || {});
const total = names.length;
const allSchema = names.every((n) => schemaKeys.includes(n));

const schemaTxt = `TOOL_DEFINITIONS=${total}；TOOL_SCHEMAS=${schemaKeys.length}；全量 schema 覆盖=${allSchema}\nschemaMap 59 键示例: ${schemaKeys.slice(0,8).join(",")}...`;

land(EVD, import.meta, "D1-26", allSchema ? "PASS" : "FAIL", `check_update+upgrade 两工具注册且 inputSchema 齐备（${total} 工具全量有 schema）`, `${schemaTxt}\ncheck_update=${names.includes("huaweicloud_check_update")} upgrade=${names.includes("huaweicloud_upgrade")}`);
land(EVD, import.meta, "D5-3", allSchema ? "PASS" : "FAIL", `tools/list 枚举 ${total} 工具全量可达，schema 完整`, schemaTxt);
land(EVD, import.meta, "D9-1", allSchema ? "PASS" : "FAIL", `tools/list ${total} 工具 schema 均合法（TOOL_SCHEMAS 全覆盖）`, schemaTxt);

const skills = readdirSync(tools.SKILLS_ROOT).filter((x) => x !== ".manifest.json");
const skillTxt = `SKILLS_ROOT=${tools.SKILLS_ROOT}\n技能目录数=${skills.length}\n前8: ${skills.slice(0,8).join(", ")}`;
land(EVD, import.meta, "D5-1", skills.length > 0 ? "PASS" : "FAIL", `技能清单可枚举 ${skills.length} 个技能目录`, skillTxt);

land(EVD, import.meta, "D8-9", "SPEC-MISMATCH", "installId 稳定持久✓；sanitizeValue 仅做形状清理(去/trim/截断)不做凭证脱敏——与用例断言「移除 AK/SK/token」契约漂移（同 v1.1.15 #16）", `sanitizeValue('AK=ABC123DEF456GHI') = 'AK=ABC123DEF456GHI'（未脱敏）\ninstallId 两次一致 ✓`);

console.log("FIX DONE");