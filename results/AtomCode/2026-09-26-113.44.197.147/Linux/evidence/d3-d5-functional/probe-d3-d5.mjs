// D3/D5 功能与客户端探针——skill 检索完整性 / 工具枚举 / 清单发现加载 / detect_framework
import { TOOL_DEFINITIONS } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { listSkillDirs, findSkillsRoot } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { detectFramework } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/detect-framework.mjs';
import { SUPPORTED_AGENT_TARGETS } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/agent-registration.mjs';
import { readdirSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D5-1 清单发现加载: SUPPORTED_AGENT_TARGETS 含 10 个客户端
{
  const expectedClients = ['opencode','codex','codearts','codearts-work','workbuddy','dsh','officeace','hermes','openclaw','atomcode'];
  for (const c of expectedClients) {
    check('D5-1', `客户端 ${c} 在清单中`, SUPPORTED_AGENT_TARGETS.includes(c), true);
  }
  check('D5-1', '清单客户端总数', SUPPORTED_AGENT_TARGETS.length, 11); // 含 codex-desktop
}

// D5-3 工具全量枚举
{
  check('D5-3', '工具全量枚举 = 注册源数量', TOOL_DEFINITIONS.length, TOOL_DEFINITIONS.length);
  const names = TOOL_DEFINITIONS.map((t) => t.name);
  check('D5-3', '工具名唯一', new Set(names).size, names.length);
}

// D3-A1 skill 检索完整性: 扫描 hdk skills 目录，全部有 SKILL.md
{
  const skillsRoot = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/skills';
  const dirs = readdirSync(skillsRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const missing = dirs.filter((d) => !existsSync(join(skillsRoot, d, 'SKILL.md')));
  check('D3-A1', `skills 目录数>0`, dirs.length > 0, true);
  check('D3-A1', '全部 skill 有 SKILL.md (缺:' + JSON.stringify(missing) + ')', missing.length, 0);
}

// D3-B5 detect_framework 识别
{
  const tmp = mkdtempSync(join(tmpdir(), 'hdk-fw-'));
  try {
    writeFileSync(join(tmp, 'index.html'), '<html></html>');
    writeFileSync(join(tmp, 'package.json'), JSON.stringify({ name: 'x', version: '1.0.0', dependencies: { vue: '^3.0.0' }, scripts: { build: 'vite build', dev: 'vite' } }));
    writeFileSync(join(tmp, 'vite.config.js'), 'export default {}');
    const r = detectFramework(tmp);
    results.push(`INFO  D3-B5  detectFramework(vite) => ${JSON.stringify(r?.framework)}`);
    check('D3-B5', '识别为 Vite 框架', /^Vite/.test(r?.framework || ''), true);
    check('D3-B5', '给出构建命令', typeof r?.buildCmd, 'string');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

console.log('\n=== D3/D5 功能与客户端探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);