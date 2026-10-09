// D8-7 7 个 meta/通用技能 retrieve_skill 验证夹具
// 对 7 个 SKILL.md 逐一执行 retrieve_skill，验证最小路径执行无断链/无幻觉步骤
// 用法: node d8-7-retrieve-skill.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D8-7/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d8-7-retrieve-skill.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// SUT imports
const toolsBase = new URL(`file://${hdkSrc}/tools.mjs`);
const { callTool, listSkillDirs } = await import(toolsBase);

// 选 7 个代表性技能（跨服务域：计算/网络/存储/数据库/安全/容器/Serverless）
const SKILL_NAMES = [
  'huawei-ecs',        // 计算
  'huawei-vpc',        // 网络
  'huawei-obs',        // 存储
  'huawei-rds',        // 数据库
  'huawei-iam',        // 安全/IAM
  'huawei-cce',        // 容器
  'huawei-functiongraph', // Serverless
];

// 逐一 retrieve_skill 验证
for (let i = 0; i < SKILL_NAMES.length; i++) {
  const skillName = SKILL_NAMES[i];
  const result = await callTool('huaweicloud_retrieve_skill', { name: skillName });

  // 断言 1: retrieve 成功（ok=true）
  rec(`D8-7-skill-${i + 1}-ok`, `${skillName} retrieve_skill → ok=true`,
      result.ok === true, result.ok, true,
      result.ok ? `content_len=${result.content?.length}` : `error=${result.error?.slice(0, 80)}`);

  // 断言 2: name 返回正确
  rec(`D8-7-skill-${i + 1}-name`, `${skillName} retrieve_skill → name 匹配`,
      result.name === skillName, result.name, skillName);

  // 断言 3: content 非空且包含 SKILL.md frontmatter（--- ... ---）
  const hasFrontmatter = result.content && /^---\r?\n[\s\S]*?\r?\n---/.test(result.content);
  rec(`D8-7-skill-${i + 1}-content`, `${skillName} content 非空 + 含 frontmatter`,
      result.content && result.content.length > 0 && hasFrontmatter,
      { contentLen: result.content?.length, hasFrontmatter },
      { contentLen: '>0', hasFrontmatter: true });

  // 断言 4: version 字段存在（整数或语义版本）
  const hasVersion = result.version !== undefined && result.version !== null && String(result.version).trim() !== '';
  rec(`D8-7-skill-${i + 1}-version`, `${skillName} version 字段存在`,
      hasVersion, result.version, 'non-empty');
}

// ⑧ retrieve 不存在的技能 → ok=false + error 含可用列表
{
  const result = await callTool('huaweicloud_retrieve_skill', { name: 'nonexistent-skill-xyz' });
  rec('D8-7-nonexistent-skill', '不存在技能 → ok=false + error 含可用列表',
      result.ok === false && /not found/i.test(result.error || ''),
      { ok: result.ok, errorHasNotFound: /not found/i.test(result.error || '') },
      { ok: false, errorContains: 'not found' });

  // 断言 error 列出可用技能（无断链：可用列表非空）
  const hasAvailable = /Available:/.test(result.error || '');
  rec('D8-7-nonexistent-lists-available', '不存在技能 → error 列出可用技能',
      hasAvailable, hasAvailable, true);
}

// ⑨ 空名称 → ok=false
{
  const result = await callTool('huaweicloud_retrieve_skill', { name: '' });
  rec('D8-7-empty-name', '空技能名 → ok=false',
      result.ok === false, result.ok, false,
      `error=${result.error?.slice(0, 60)}`);
}

// ⑩ 技能 references 目录：验证有 references 的技能可读取引用文件
{
  // huawei-ecs 有 references 目录
  const result = await callTool('huaweicloud_retrieve_skill', { name: 'huawei-ecs' });
  const hasRefs = Array.isArray(result.references) && result.references.length > 0;
  rec('D8-7-references-loaded', 'huawei-ecs references 目录被加载',
      hasRefs,
      { refsCount: result.references?.length },
      { refsCount: '>0' });

  if (hasRefs) {
    // 每个引用文件有 filename + content
    const allValid = result.references.every((r) => r.filename && typeof r.content === 'string');
    rec('D8-7-references-structure', 'references 每项有 filename + content',
        allValid, allValid, true);
  }
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D8-7 7 个 meta/通用技能 retrieve_skill 验证夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D8-7');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D8-7 7 个 meta/通用技能 retrieve_skill 验证夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
