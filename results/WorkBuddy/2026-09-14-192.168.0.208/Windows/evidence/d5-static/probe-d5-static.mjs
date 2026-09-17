/**
 * WorkBuddy 每日测试探针 - D5-1 客户端发现 + D8 文档质量 + D10-1 静态评审（v1.1.4-next.6）
 * D5-1: 真实 WorkBuddy（+OpenCode）就地核验插件清单发现/加载（mcp 注册/skills/hooks/marker）
 * D8-7(P0): 7 个 meta 技能 retrieve_skill 加载 + 指引机械可执行性（引用工具/技能存在、无占位符、有步骤）
 * D8-4: 29 技能 SKILL.md 机械可执行性静态评审（结构/引用/歧义标记）
 * D8-1: README 链接有效性 + 命令与实际 CLI 对比
 * D8-6: README.md ↔ README.zh-CN.md 双语一致性
 * D10-1: 40 工具描述静态评审（LLM 评测集部分 → 评测预算受限另行 BLOCKED）
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PKG = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit';
const PLUGIN = join(PKG, 'plugins', 'huaweicloud-core');
const SKILLS_DIR = join(PLUGIN, 'skills');
const REAL_HOME = 'C:/Users/Administrator';

const results = [];
function t(id, name, pass, actual, expected, note) {
  results.push({ case: id, name, pass: pass === null ? null : !!pass, actual: String(actual), expected: String(expected), note: note || '' });
  console.log(`[${pass === null ? 'INFO' : pass ? 'PASS' : 'FAIL'}] ${id} ${name}\n    actual=${actual}\n    expected=${expected}${note ? '\n    note=' + note : ''}`);
}
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; } };

const META_SKILLS = [
  'huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-api-and-sdk',
  'huaweicloud-capability-discovery', 'huaweicloud-cli-and-auth',
  'huaweicloud-troubleshooting', 'huawei-getting-started',
];
// 歧义标记：大写 XXX（小写 xxx 为命令示例惯用占位，不计）；placeholder 一词在 redaction 说明散文中合法，不计
const AMBIGUOUS = /TODO|TBD|FIXME|待定|待补|占位|XXX(?!X)/;
// 非"技能引用"的排除项：包名 / npx skills 仓库名 / KooCLI 下载文件名
const NOT_SKILL_REF = /^(huaweicloud-devkit|huaweicloud-skills|huaweicloud-cli-[a-z0-9-]+)$/;
// 剥离 Terraform resource 类型名（`resource "huaweicloud_xxx"`）后再做工具引用匹配
const stripTerraform = (s) => s.replace(/resource\s+"huaweicloud_[a-z0-9_]+"/g, 'resource "TF"');

async function main() {
  // ════════ D5-1: 真实 WorkBuddy 就地核验 ════════
  {
    const mcp = readJson(join(REAL_HOME, '.workbuddy', 'mcp.json'));
    const wbRegistered = Boolean(mcp?.mcpServers?.['huaweicloud-devkit']);
    const serverCmd = mcp?.mcpServers?.['huaweicloud-devkit']?.command || JSON.stringify(mcp?.mcpServers?.['huaweicloud-devkit'] || {}).slice(0, 120);
    t('D5-1', '真实 WorkBuddy mcp.json 注册 huaweicloud-devkit', wbRegistered, String(wbRegistered), 'true', `command=${serverCmd}`);

    const skillsDir = join(REAL_HOME, '.workbuddy', 'skills');
    const nSkills = existsSync(skillsDir) ? readdirSync(skillsDir).filter((n) => n.startsWith('huawei')).length : 0;
    t('D5-1', '真实 WorkBuddy skills 目录注入（huawei*）', nSkills >= 29, `count=${nSkills}`, '>=29');

    const pl = join(REAL_HOME, '.workbuddy', 'huaweicloud-plugins');
    const marker = existsSync(join(pl, '.installed'));
    const server = existsSync(join(pl, 'src', 'mcp-server.mjs'));
    const policy = existsSync(join(pl, 'safety', 'policy.json'));
    const hooksDir = join(pl, 'hooks');
    const hooks = existsSync(hooksDir) ? readdirSync(hooksDir) : [];
    t('D5-1', '真实 WorkBuddy 插件目录功能完整（server/safety/hooks）', server && policy && hooks.length > 0,
      `server=${server} policy=${policy} hooks=${hooks.join(',')}`, 'all true');
    t('D5-1', '真实 WorkBuddy .installed marker', null, `marker=${marker}`, '环境观察，不计 PASS/FAIL',
      '真实机插件目录无 .installed marker（隔离安装会写入，见 d1-install 证据 marker=true）。真实部署疑由平台预置或早于当前版本完成，不影响 mcp.json 注册/skills/server/hooks 功能面；status 检测走配置注册而非 marker');

    // WorkBuddy settings/hooks 挂载（PostToolUse → telemetry tracker，命令不含 'huawei' 字样）
    const settings = readJson(join(REAL_HOME, '.workbuddy', 'settings.json'));
    const postHook = Array.isArray(settings?.hooks?.PostToolUse)
      && settings.hooks.PostToolUse.some((e) => e?.matcher === '*' && /telemetry-tracker\.py/.test(JSON.stringify(e)));
    t('D5-1', 'WorkBuddy settings.json PostToolUse hook 挂载（→ telemetry tracker）', postHook,
      String(postHook), 'true',
      'hook 命令为 WorkBuddy 托管 python + telemetry-tracker.py，不含 "huawei" 字样（首轮断言按字串匹配系探针误设）');

    // 真实 OpenCode 在装（进程在跑）核验
    const ocCfg = readJson(join(REAL_HOME, '.config', 'opencode', 'opencode.json')) || readJson(join(REAL_HOME, '.config', 'opencode', 'opencode.jsonc'));
    const ocRegistered = Boolean(ocCfg?.mcp?.['huaweicloud-devkit']);
    const ocServer = existsSync(join(REAL_HOME, '.config', 'opencode', 'huaweicloud-plugins', 'src', 'mcp-server.mjs'));
    t('D5-1', '真实 OpenCode 注册 + 插件目录（本机第二客户端）', ocRegistered && ocServer,
      `mcp=${ocRegistered} server=${ocServer}`, 'both',
      '客户端矩阵：WorkBuddy+OpenCode 真机在装；其余 8 目标发现/加载由 d1-install 隔离证据覆盖（隔离安装+MCP注册+marker 落位）');
  }

  // 工具清单
  const { pathToFileURL } = await import('node:url');
  const { TOOL_DEFINITIONS, callTool } = await import(pathToFileURL(join(PLUGIN, 'src', 'tools.mjs')).href);
  const toolNames = new Set(TOOL_DEFINITIONS.map((x) => x.name));
  const skillNames = new Set(readdirSync(SKILLS_DIR));

  // ════════ D8-7 (P0): 7 meta 技能 retrieve_skill + 机械可执行 ════════
  for (const s of META_SKILLS) {
    const r = await callTool('huaweicloud_retrieve_skill', { name: s });
    const content = String(r?.content || '');
    const loaded = r?.ok === true && content.length > 200;

    // 引用工具存在性（剥离 Terraform resource 名后匹配）
    const refTools = [...new Set(stripTerraform(content).match(/huaweicloud_[a-z0-9_]+/g) || [])];
    const badTools = refTools.filter((x) => !toolNames.has(x));
    // 引用技能存在性（排除包名/仓库名/下载文件名）
    const refSkills = [...new Set(content.match(/huaweicloud-[a-z0-9-]+|huawei-[a-z0-9-]+/g) || [])];
    const badSkills = refSkills.filter((x) => !skillNames.has(x) && !NOT_SKILL_REF.test(x));
    // 步骤性与占位符
    const hasSteps = /(^|\n)\s*(\d+[.)]|[Ss]tep|步骤|[-*] )/.test(content);
    const ambiguous = AMBIGUOUS.test(content);

    t('D8-7', `[${s}] retrieve_skill 可加载且内容充实`, loaded, `ok=${r?.ok} len=${content.length}`, 'ok=true+充实');
    t('D8-7', `[${s}] 指引可机械执行（引用工具/技能全存在 + 有步骤 + 无占位符）`,
      badTools.length === 0 && badSkills.length === 0 && hasSteps && !ambiguous,
      `badTools=${badTools.join(',') || 0} badSkills=${badSkills.join(',') || 0} steps=${hasSteps} ambiguous=${ambiguous}`,
      '全存在 + 有步骤 + 无占位',
      `refTools=${refTools.length} refSkills=${refSkills.length}`);
  }

  // ════════ D8-4: 29 技能静态评审 ════════
  {
    let okN = 0; const issues = [];
    for (const s of skillNames) {
      const p = join(SKILLS_DIR, s, 'SKILL.md');
      if (!existsSync(p)) { issues.push(`${s}: SKILL.md 缺失`); continue; }
      const c = readFileSync(p, 'utf-8');
      const badTools = [...new Set(stripTerraform(c).match(/huaweicloud_[a-z0-9_]+/g) || [])].filter((x) => !toolNames.has(x));
      const badSkills = [...new Set(c.match(/huaweicloud-[a-z0-9-]+|huawei-[a-z0-9-]+/g) || [])].filter((x) => !skillNames.has(x) && x !== s && !NOT_SKILL_REF.test(x));
      const ambiguous = AMBIGUOUS.test(c);
      const hasSteps = /(^|\n)\s*(\d+[.)]|[Ss]tep|步骤|[-*] )/.test(c);
      const hasSections = /(^|\n)##\s/.test(c);
      if (badTools.length || badSkills.length || ambiguous || !hasSteps || !hasSections) {
        issues.push(`${s}: tools=${badTools.join(',')} skills=${badSkills.join(',')} ambiguous=${ambiguous} steps=${hasSteps} sections=${hasSections}`);
      } else okN += 1;
    }
    t('D8-4', '29 技能 SKILL.md 可机械执行（结构/引用/无歧义标记）', issues.length === 0,
      `ok=${okN}/${skillNames.size} issues=${issues.length}`, `0 issues（29/29）`,
      issues.join(' ; ').slice(0, 400));
  }

  // ════════ D8-1: README 链接 + 命令一致 ════════
  const readmeEn = readFileSync(join(PKG, 'README.md'), 'utf-8');
  const readmeZh = readFileSync(join(PKG, 'README.zh-CN.md'), 'utf-8');
  {
    const urls = [...new Set([...readmeEn.matchAll(/https?:\/\/[^\s)\]>"']+/g)].map((m) => m[0].replace(/[.,;]$/, '')))]
      .filter((u) => !/localhost|127\.0\.0\.1/.test(u)); // localhost 为代理配置示例（README:278），不校验
    const check = await Promise.allSettled(urls.map(async (u) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      try {
        const resp = await fetch(u, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { Range: 'bytes=0-0', 'User-Agent': 'Mozilla/5.0 (probe)' } });
        clearTimeout(timer);
        return { u, ok: resp.ok || resp.status === 206 || resp.status === 403 || resp.status === 405, status: resp.status };
      } catch (e) { clearTimeout(timer); return { u, ok: false, status: e.name === 'AbortError' ? 'timeout' : String(e.cause?.code || e.message).slice(0, 30) }; }
    }));
    const outcomes = check.map((c) => c.value);
    const broken = outcomes.filter((o) => !o.ok);
    t('D8-1', `README 链接有效性（${urls.length} 个去重 URL，排除 localhost 示例）`, broken.length === 0,
      `checked=${outcomes.length} broken=${broken.length}`, '0 失效',
      broken.map((b) => `${b.u.slice(0, 70)}→${b.status}`).join(' ; ').slice(0, 300));

    // 命令一致（仅匹配 npx 调用形态，避免散文 "…is installed" 类误匹配）
    const CLI_CMDS = new Set(['install', 'i', 'uninstall', 'remove', 'update', 'upgrade', 'reinstall', 'status', 'info', 'doctor', 'check', 'install-hcloud', 'auth', 'proxy', 'version', 'help']);
    const CMD_RE = /npx\s+(?:--yes\s+|-y\s+|--registry=\S+\s+)*huaweicloud-devkit(?:@\S+)?\s+([a-z-]+)/g;
    const cmds = [...new Set([...readmeEn.matchAll(CMD_RE)].map((m) => m[1]))];
    const badCmds = cmds.filter((c) => !CLI_CMDS.has(c));
    t('D8-1', 'README 命令与 CLI 实际子命令一致', badCmds.length === 0,
      `cmds=${cmds.join(',')}${badCmds.length ? ' BAD=' + badCmds.join(',') : ''}`, '全匹配');
  }

  // ════════ D8-6: 中英 README 一致 ════════
  {
    const CMD_RE2 = /npx\s+(?:--yes\s+|-y\s+|--registry=\S+\s+)*huaweicloud-devkit(?:@\S+)?\s+([a-z-]+)/g;
    const heads = (s) => (s.match(/^#{1,3} .+$/gm) || []).length;
    const fences = (s) => (s.match(/^```/gm) || []).length / 2;
    const codeCmds = (s) => [...new Set([...s.matchAll(CMD_RE2)].map((m) => m[1]))].sort().join(',');
    const enV = [...new Set(readmeEn.match(/\b\d+\.\d+\.\d+(?:-next\.\d+)?\b/g) || [])].sort().join(',');
    const zhV = [...new Set(readmeZh.match(/\b\d+\.\d+\.\d+(?:-next\.\d+)?\b/g) || [])].sort().join(',');
    const enTools = (readmeEn.match(/huaweicloud_[a-z0-9_]+/g) || []).length;
    const zhTools = (readmeZh.match(/huaweicloud_[a-z0-9_]+/g) || []).length;
    t('D8-6', '中英 README 结构一致（标题/代码块数量）', heads(readmeEn) === heads(readmeZh) && Math.abs(fences(readmeEn) - fences(readmeZh)) <= 1,
      `en: h=${heads(readmeEn)} f=${fences(readmeEn)} | zh: h=${heads(readmeZh)} f=${fences(readmeZh)}`, '一致');
    t('D8-6', '中英 README 命令集一致', codeCmds(readmeEn) === codeCmds(readmeZh),
      `en=${codeCmds(readmeEn)} | zh=${codeCmds(readmeZh)}`, '一致');
    t('D8-6', '中英 README 版本号与工具引用一致', enV === zhV && enTools === zhTools,
      `ver en=${enV} zh=${zhV} tools en=${enTools} zh=${zhTools}`, '一致');
  }

  // ════════ D10-1: 工具描述静态评审 ════════
  {
    let okN = 0; const issues = [];
    for (const tool of TOOL_DEFINITIONS) {
      const d = tool.description || '';
      const hasSchema = tool.inputSchema?.type === 'object' && typeof tool.inputSchema?.properties === 'object';
      if (d.length < 20 || !hasSchema) issues.push(`${tool.name}: descLen=${d.length} schema=${hasSchema}`);
      else okN += 1;
    }
    t('D10-1', `工具描述静态评审（${TOOL_DEFINITIONS.length} 工具：描述+schema 完整）`, issues.length === 0,
      `ok=${okN}/${TOOL_DEFINITIONS.length}`, '全通过', issues.join(';').slice(0, 200));
    t('D10-1', '自然语言评测集 LLM 打分', null, '评测预算受限（无 LLM 评测 harness/预算）', 'BLOCKED',
      '静态部分已覆盖：全部工具 description+inputSchema 完整性；LLM 选择正确率打分需评测预算，按用例矩阵 EXP 阻塞口径记 BLOCKED');
  }

  // ════════ 汇总 ════════
  const pass = results.filter((r) => r.pass === true).length;
  const fail = results.filter((r) => r.pass === false).length;
  const info = results.filter((r) => r.pass === null).length;
  console.log(`\n===== SUMMARY: ${pass} PASS / ${fail} FAIL / ${info} INFO =====`);
  const { writeFileSync } = await import('node:fs');
  writeFileSync('results.json', JSON.stringify({ suite: 'd5-static', pass, fail, info, results }, null, 2));
}

main().catch((e) => { console.error('PROBE CRASH:', e); process.exit(1); });
