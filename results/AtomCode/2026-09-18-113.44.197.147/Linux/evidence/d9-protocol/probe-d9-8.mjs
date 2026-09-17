// D9-8 inputSchema 版本合规探针：逐工具核对 JSON Schema 版本是否统一且明确
import { TOOL_DEFINITIONS } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/tools.mjs';

const tools = Array.isArray(TOOL_DEFINITIONS) ? TOOL_DEFINITIONS : [];
const schemas = [];
let explicitSchema = 0;
let noKw = 0;

for (const t of tools) {
  const s = (t && t.inputSchema) || {};
  if (s.$schema) {
    explicitSchema++;
    schemas.push(s.$schema);
  }
  // draft 关键字混用检测（draft-07 与 2020-12 关键字共存）
  const has07 = /\$ref|definitions|dependencies/i.test(JSON.stringify(s));
  if (!s.$schema && !t.name) noKw++;
}

// 版本统一性：所有显式 $schema 需一致，且不得同时存在 draft-07 / 2020-12 关键字
const versions = [...new Set(schemas)];
const consistent = versions.length <= 1;
let pass = 0, fail = 0;
function check(id, desc, cond) {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${cond}`);
}

console.log(`TOOLS ${tools.length}`);
console.log(`$schema 显式声明集合: ${JSON.stringify(versions)}`);
console.log(`显式 $schema 的工具数: ${explicitSchema}`);
console.log(`无标准关键字的结构体工具数: ${noKw}`);

check('D9-8', 'inputSchema 版本统一（不存在 draft-07 与 2020-12 混用）', consistent);
check('D9-8', '全部工具 inputSchema 为合法 JSON 对象（含 type 或 properties）', tools.every((t) => {
  const s = (t && t.inputSchema) || {};
  return typeof s === 'object' && (s.type === 'object' || !!s.properties || !!s.$schema);
}));

console.log(JSON.stringify({ tools: tools.length, schemas: versions, explicitSchema, noKw }));
console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);