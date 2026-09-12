/**
 * Hermes 每日测试探针 - D8 质量 (Linux, 源码级)
 * SUT: huaweicloud-devkit@1.1.4-next.3 (commit 3b6290b0)
 * 覆盖: D8-7 (7 个 meta/通用技能指引可机械执行验证)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { callTool } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0; const failures = [];
function T(id, name, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${name}  => ${JSON.stringify(actual)}${ok ? '' : '  (expected ' + JSON.stringify(expected) + ')'}`);
  if (ok) pass++; else { fail++; failures.push({ id, name, actual, expected }); }
  return ok;
}

const skillsRoot = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/skills';
const allSkills = readdirSync(skillsRoot, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);

// 7 个 meta/通用技能（非服务专属）
const META_SKILLS = [
  'huaweicloud-core',
  'huawei-getting-started',
  'huaweicloud-api-and-sdk',
  'huaweicloud-capability-discovery',
  'huaweicloud-cli-and-auth',
  'huaweicloud-safety',
  'huaweicloud-troubleshooting',
];

console.log('skills 总数:', allSkills.length, '| meta/通用技能数:', META_SKILLS.length);

let metaCount = 0;
for (const name of META_SKILLS) {
  const skillMd = `${skillsRoot}/${name}/SKILL.md`;
  if (!existsSync(skillMd)) {
    T('D8-7', `${name} SKILL.md 存在`, false, true);
    continue;
  }
  const content = readFileSync(skillMd, 'utf8');
  const hasFrontmatter = /^---\s*\n.*?\n---/s.test(content);
  const hasName = /^name:\s*\S+/m.test(content);
  const hasDesc = /^description:\s*\S+/m.test(content);
  const bodyLines = content.split('---').slice(2).join('').trim().split('\n').filter(l=>l.trim()).length;
  const ok = hasFrontmatter && hasName && hasDesc && bodyLines > 3;
  console.log(`${ok?'PASS':'FAIL'}  D8-7  ${name} (frontmatter=${hasFrontmatter}, name=${hasName}, desc=${hasDesc}, bodyLines=${bodyLines})`);
  if (ok) pass++; else { fail++; failures.push({ id:'D8-7', name: name+' 结构不完整', actual: {hasFrontmatter, hasName, hasDesc, bodyLines}, expected:'ok' }); }
  metaCount++;
}
T('D8-7', '7 个 meta 技能全部存在', metaCount, 7);

// retrieve_skill 工具加载
console.log('\n===== D8-7 retrieve_skill 机械加载 =====');
for (const name of META_SKILLS.slice(0, 3)) {
  try {
    const res = await callTool('huaweicloud_retrieve_skill', { name });
    const ok = res && (typeof res === 'string' ? res.length > 0 : (res.content || res.skill || res.name));
    console.log(`${ok?'PASS':'FAIL'}  D8-7  retrieve_skill(${name}) 返回 ${typeof res === 'string' ? res.length + ' chars' : JSON.stringify(res).slice(0,80)}`);
    if (ok) pass++; else { fail++; failures.push({ id:'D8-7', name:'retrieve_skill('+name+') 空', actual: res, expected:'non-empty' }); }
  } catch (e) {
    console.log(`FAIL  D8-7  retrieve_skill(${name}) 抛错: ${e.message}`);
    fail++; failures.push({ id:'D8-7', name:'retrieve_skill('+name+') throw', actual: e.message, expected:'non-empty' });
  }
}

// search_docs 无断链
console.log('\n===== D8-7 search_docs 可用 =====');
try {
  const res = await callTool('huaweicloud_search_docs', { query: 'ecs', topic: 'all' });
  const ok = res && (Array.isArray(res) || typeof res === 'object');
  console.log(`${ok?'PASS':'FAIL'}  D8-7  search_docs 返回对象/数组 (len=${res && res.length !== undefined ? res.length : 'obj'})`);
  if (ok) pass++; else { fail++; failures.push({ id:'D8-7', name:'search_docs', actual: res, expected:'object/array' }); }
} catch (e) {
  console.log(`FAIL  D8-7  search_docs 抛错: ${e.message}`);
  fail++; failures.push({ id:'D8-7', name:'search_docs throw', actual: e.message, expected:'ok' });
}

console.log(`\n===== D8 汇总: ${pass} PASS / ${fail} FAIL =====`);
if (fail) failures.forEach(f=>console.log(`  - ${f.id} ${f.name}: ${JSON.stringify(f.actual)}`));
process.exitCode = fail > 0 ? 1 : 0;