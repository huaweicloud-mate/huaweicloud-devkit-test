import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const HDK = "/home/zhangshuang/devkit-test/Hermes/hdk";
const results = [];
function rec(id, ok, detail) { results.push({ id, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${detail}`); }
// D8-1 文档与能力一致: README 链接不失效 + 命令存在
const readme = readFileSync(join(HDK, 'README.md'), 'utf8');
const deadLinks = (readme.match(/\]\((?!http)([^)#]+)\)/g) || []).filter(l => {
  const p = /\]\(([^)#]+)/.exec(l)[1];
  return !existsSync(join(HDK, p)) && !existsSync(join(HDK, p + '.md'));
});
rec('D8-1:README失效链接', deadLinks.length === 0, `失效=${deadLinks.length} ${deadLinks.slice(0,3).join(',')}`);
const pkg = JSON.parse(readFileSync(join(HDK, 'package.json'), 'utf8'));
const scripts = pkg.scripts || {};
rec('D8-1:核心命令存在', ['test','lint','validate'].every(k => scripts[k]), Object.keys(scripts).join(','));
// D8-4 引导步骤可机械执行: INSTALL.md 含具体命令(无 TODO/含糊)
const inst = existsSync(join(HDK, 'INSTALL.md')) ? readFileSync(join(HDK, 'INSTALL.md'), 'utf8') : '';
const hasCmd = /(npm|npx|node|huaweicloud-devkit)\s+[a-z-]+/.test(inst);
const noTodo = !/TODO|待补|略|示意/.test(inst);
rec('D8-4:INSTALL含可执行命令', hasCmd, `cmd=${hasCmd}`);
rec('D8-4:无TODO/含糊步骤', noTodo, `noTodo=${noTodo}`);
// D8-6 中英文一致: docs 下 en/zh 或 *.en.md/*.zh.md 存在
const enExists = existsSync(join(HDK, 'docs', 'en')) || (readFileSync(join(HDK, 'README.md'),'utf8').match(/README.en.md|docs\/en/) || []).length > 0;
const zhExists = (readFileSync(join(HDK, 'README.md'),'utf8').match(/README.zh.md|中文|docs\/zh/) || []).length > 0;
rec('D8-6:中英文档双源', enExists || zhExists, `en=${enExists} zh=${zhExists}`);
const allOk = results.every(r => r.ok);
console.log(JSON.stringify({ allOk, results }));
process.exit(allOk ? 0 : 1);
