// D8-7 7 个 meta/通用技能指引可机械执行验证（P0）
// 断言：逐技能 retrieve_skill 加载成功 → 指引非空且含可执行步骤 → 所引用的
//       references/scripts 文件真实存在（无断链）→ 无 TBD/待补充 等幻觉占位 → search_docs 可命中
import { writeFileSync, existsSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const PKG_SKILLS = process.env.HDK_PKG_SKILLS || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/skills';
const CASE = 'D8-7';

const META_SKILLS = [
  'huaweicloud-core',
  'huaweicloud-api-and-sdk',
  'huaweicloud-capability-discovery',
  'huaweicloud-cli-and-auth',
  'huaweicloud-safety',
  'huaweicloud-troubleshooting',
  'huawei-getting-started',
];

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const HOME = homedir();
const SKILL_ROOTS = [
  join(PKG_SKILLS),
  join(HOME, '.config', 'opencode', 'skills'),
  join(HOME, '.agents', 'skills'),
];

function locateSkillDir(name) {
  for (const root of SKILL_ROOTS) {
    const d = join(root, name);
    if (existsSync(join(d, 'SKILL.md'))) return d;
  }
  return null;
}

const rows = [];
for (const name of META_SKILLS) {
  const dir = locateSkillDir(name);
  let loaded = null, contentText = '';
  try {
    loaded = await tools.callTool('huaweicloud_retrieve_skill', { name });
    contentText = (loaded && (loaded.content || loaded.skill || '')) || '';
    if (!contentText && typeof loaded === 'string') contentText = loaded;
  } catch (e) {
    loaded = { error: e.message };
  }

  const mdPath = dir ? join(dir, 'SKILL.md') : null;
  const md = mdPath && existsSync(mdPath) ? readFileSync(mdPath, 'utf8') : '';

  // 机械可执行性：指引中引用的相对文件路径是否真实存在
  const refPattern = /(?:references|scripts|assets|examples)\/[A-Za-z0-9._\-\/]+\.(?:md|sh|ps1|py|mjs|js|json|ts)/g;
  const refs = [...new Set(md.match(refPattern) || [])];
  const brokenRefs = dir ? refs.filter((r) => !existsSync(join(dir, r))) : [];
  const refFiles = refs.filter((r) => existsSync(join(dir || '', r)));
  // 校验引用的 md 文件是否已被真实读取（可解析出标题）
  const refTitles = refFiles.filter((r) => r.endsWith('.md')).map((r) => {
    try { return { file: r, h1: (readFileSync(join(dir, r), 'utf8').match(/^#\s+(.+)$/m) || [])[1] || null }; }
    catch { return { file: r, h1: null }; }
  });

  // 幻觉/占位检测
  const placeholders = (md.match(/\bTBD\b|\bTODO\b|待补充|待完善|XXX占位|Lorem ipsum/gi) || []);

  // 可执行步骤：含编号步骤或代码块/工具调用
  const hasSteps = /(^|\n)\s*\d+[.)]\s+\S/m.test(md) || /```(bash|powershell|sh|console)/i.test(md);
  const hasFrontmatter = /^---\n/.test(md) && /^name:\s*\S+/m.test(md) && /^description:\s*\S+/m.test(md);
  const hasRoutingOrScope = /routing|路由|When to use|Use when|何时使用|适用范围|Triggers|触发词/i.test(md);

  // search_docs 可命中该技能
  let searchHit = false, searchTop = null;
  try {
    const s = await tools.callTool('huaweicloud_search_docs', { query: name });
    const t = JSON.stringify(s);
    searchHit = t.includes(name);
    searchTop = (s && (s.results || s.hits)) ? (s.results || s.hits).slice(0, 2) : null;
  } catch (e) { searchHit = false; }

  const checks = {
    retrieveSkillOk: !!loaded && !loaded.error,
    contentNonEmpty: contentText.trim().length >= 400,
    skillFileFound: !!mdPath,
    hasFrontmatter,
    hasExecutableSteps: hasSteps,
    hasRoutingOrScope,
    noBrokenReferences: brokenRefs.length === 0,
    noPlaceholderText: placeholders.length === 0,
    searchDocsHit: searchHit,
  };
  const violations = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  rows.push({
    skill: name,
    skillDir: dir,
    contentChars: contentText.trim().length,
    mdChars: md.length,
    frontmatterDescription: (md.match(/^description:\s*(.+)$/m) || [])[1]?.slice(0, 120) || null,
    referencedFiles: refs,
    existingRefFiles: refFiles.length,
    brokenRefs,
    refTitles,
    placeholderHits: [...new Set(placeholders)],
    searchDocsHit: searchHit,
    searchTop,
    checks,
    violations,
    satisfied: violations.length === 0,
  });
}

const violations = rows.filter((r) => !r.satisfied);
const ok = violations.length === 0;

finish(ok ? 'PASS' : 'FAIL',
  ok ? `${rows.length} 个 meta 技能全部可机械执行：retrieve_skill 均加载成功且内容非空；frontmatter/可执行步骤/适用范围齐备；引用的 ${rows.reduce((a, r) => a + r.referencedFiles.length, 0)} 个 references/scripts 文件全部真实存在（断链 0）；无 TBD/待补充 等占位幻觉；search_docs 全部命中`
      : `meta 技能指引可执行性不成立：${JSON.stringify(violations.map((v) => ({ skill: v.skill, violations: v.violations, brokenRefs: v.brokenRefs, placeholderHits: v.placeholderHits, contentChars: v.contentChars })))}`,
  { skillRoots: SKILL_ROOTS, metaSkillCount: rows.length, rows, violations });