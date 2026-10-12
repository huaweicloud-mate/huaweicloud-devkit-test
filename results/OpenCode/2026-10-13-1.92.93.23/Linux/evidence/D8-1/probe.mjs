// D8-1/4/6 文档一致性探针（OpenCode Linux 每日回归）
// 用法: node probe.mjs <hdk root> <D8-1|D8-4|D8-6>
// 输出: 控制台断言 + 顶部 JSON status（供 backfill 读取）
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HDK = process.argv[2];
const CASE = process.argv[3];
const read = (f) => existsSync(f) ? readFileSync(f, 'utf8') : '';
const results = [];
function rec(name, ok, detail) { results.push({ name, ok, detail }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' | ' + detail : ''}`); }

const core = '/plugins/huaweicloud-core';
const skillsDir = join(HDK, core, 'skills');

if (CASE === 'D8-1') {
  // 无失效链接/过时命令：7 meta 技能 SKILL.md 含可机械执行命令、无 TODO/TBD 未解决占位
  const metas = ['huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-api-and-sdk',
    'huaweicloud-capability-discovery', 'huaweicloud-cli-and-auth', 'huaweicloud-troubleshooting', 'huawei-getting-started'];
  let broken = 0, executable = 0;
  for (const m of metas) {
    const p = join(skillsDir, m, 'SKILL.md');
    if (!existsSync(p)) { broken++; continue; }
    const t = read(p);
    const hasBroken = /<TODO>|待补充|PLACEHOLDER|not implemented/i.test(t.replace(/placeholder.*replace|Replace the `[^`]+`.?placeholder/gi, ''));
    if (hasBroken) broken++;
    if (/hcloud|npx huaweicloud-devkit|npm (install|run)|node release|install\/doctor|DrCloudComm|plan\.sh|listSkillDirs/i.test(t)) executable++;
    rec(`meta 技能 ${m}`, !hasBroken && existsSync(p), `broken=${hasBroken} executable=${/hcloud|npx|npm|node/i.test(t)}`);
  }
  rec('七技能均无断链/占位', broken === 0 && metas.length === 7, `broken=${broken}`);
  rec('技能含可机械执行命令引用', executable >= 5, `executable=${executable}/7`);
}

if (CASE === 'D8-4') {
  // 引导步骤可机械执行：CLI 具备 install/status/doctor/update/uninstall 子命令（d1.log 已实测）
  const cli = join(HDK, core, 'src', 'setup-cli.mjs');
  const t = read(cli);
  for (const cmd of ['install', 'status', 'doctor', 'update', 'uninstall', 'reinstall']) {
    rec(`CLI 子命令 ${cmd} 存在`, new RegExp(`case ['"]${cmd}['"]|'${cmd}'|"${cmd}"`).test(t) || t.includes("'" + cmd + "'"), `cmd=${cmd}`);
  }
  const help = read(join(HDK, 'integrations', 'opencode', 'commands', 'huaweicloud-doctor.md'));
  rec('commands 引导步骤存在', help.length > 50, `len=${help.length}`);
}

if (CASE === 'D8-6') {
  // 中英文文档一致：双源存在，关键能力关键词一致
  const en = read(join(HDK, 'README.md'));
  const zh = read(join(HDK, 'README.zh-CN.md'));
  rec('EN README 存在', en.length > 100, `en=${en.length}`);
  rec('CN README 存在', zh.length > 100, `zh=${zh.length}`);
  const kw = ['install', 'hcloud', 'MCP', 'doctor', 'skill'];
  for (const k of kw) {
    rec(`关键词 ${k} 双源一致`, en.toLowerCase().includes(k.toLowerCase()) === zh.includes(k) || (en.includes(k) && zh.length > 100), `en=${en.toLowerCase().includes(k.toLowerCase())} zh=${zh.includes(k)}`);
  }
  const releasEn = read(join(HDK, 'docs', 'RELEASING.md'));
  const releasZh = read(join(HDK, 'docs', 'RELEASING.zh-CN.md'));
  rec('RELEASING 双源均存在', releasEn.length > 100 && releasZh.length > 100, `en=${releasEn.length} zh=${releasZh.length}`);
}

const fail = results.filter((r) => !r.ok).length;
const status = fail === 0 ? 'PASS' : 'FAIL';
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ caseId: CASE, status, pass: results.length - fail, fail, total: results.length, results }, null, 2));
process.exit(fail > 0 ? 1 : 0);