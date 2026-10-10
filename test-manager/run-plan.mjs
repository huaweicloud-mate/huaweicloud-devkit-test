// run-plan.mjs — ai Test Manager 决策引擎 CLI
//
// 用法:
//   node test-manager/run-plan.mjs [--version v1.2.0] [--diff <git-diff-range>] [--out <dir>]
//   node test-manager/run-plan.mjs --diff main..HEAD        # 默认用该范围改的文件
//
// 输出（对齐 test-ai-orchestration-architecture.md）:
//   <out>/test-strategy.md     # 策略：risk / affectedDimensions / recommended
//   <out>/missions/<missionId>.yaml   # Worker 消费的使命清单
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planTestRun } from './tm-plan.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function argv(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function diffChangedFiles(range) {
  try {
    const out = execSync(`git diff --name-only ${range}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function renderStrategy(strategy) {
  const lines = [];
  lines.push(`# 测试策略 (${strategy.version})`);
  lines.push(`日期: ${strategy.date} | 风险等级: **${strategy.risk}**`);
  lines.push('');
  lines.push(`> ${strategy.riskNote}`);
  lines.push('');
  lines.push('## 受影响维度');
  for (const d of strategy.affectedDimensions) {
    lines.push(`- **${d.dim}** [${d.risk}] ${d.label} — ${d.note}`);
    lines.push(`  - 命中模块: ${d.modules.join(', ')}`);
    lines.push(`  - 相关用例: ${d.cases.join(', ')}`);
  }
  lines.push('');
  lines.push('## 推荐执行范围');
  const r = strategy.recommended;
  lines.push(`- 必跑维度: ${r.mustRunDimensions.join(', ') || '(无)'}`);
  lines.push(`- 必跑用例数: ${r.mustRunCaseCount}`);
  lines.push(`- 全量回归: ${r.fullSuite ? '是' : '否'}`);
  if (r.skip.length) lines.push(`- 可跳过: ${r.skip.join(', ')}`);
  if (r.fixedBaselines.length) lines.push(`- 固定基线(禁剪): ${r.fixedBaselines.join(', ')}`);
  lines.push('');
  lines.push('## 固定安全基线');
  lines.push(strategy.fixedBaselines.map((b) => `- ${b}`).join('\n'));
  lines.push('');
  return lines.join('\n');
}

function renderMission(mission) {
  const lines = [];
  lines.push(`apiVersion: test.huaweicloud.com/v1`);
  lines.push(`kind: TestMission`);
  lines.push(`metadata:`);
  lines.push(`  id: "${mission.missionId}"`);
  lines.push(`  domain: "${mission.domain}"`);
  lines.push(`  priority: ${mission.priority}`);
  lines.push(`  estimatedDuration: "${mission.estimatedDuration}"`);
  lines.push(`spec:`);
  lines.push(`  scope: |`);
  lines.push(`    ${mission.scope}`);
  lines.push(`  affectedTools:`);
  for (const t of mission.affectedTools) lines.push(`    - ${t}`);
  lines.push(`  affectedCases:`);
  for (const c of mission.affectedCases) lines.push(`    - ${c}`);
  lines.push(`  constraints:`);
  lines.push(`    - "P0 用例不得 NOT_RUN"`);
  lines.push(`    - "执行结果须按用例 ID 落 evidence/<case-id>/"`);
  lines.push(`  qualityCriteria:`);
  for (const q of mission.qualityCriteria) lines.push(`    - "${q}"`);
  lines.push(``);
  return lines.join('\n');
}

const version = argv('--version', 'unversioned');
const diff = argv('--diff', '');
const outDir = argv('--out', join(__dirname, 'out'));

const changeScope = { changedFiles: diff ? diffChangedFiles(diff) : [], changedTools: [] };
const { strategy, missions } = planTestRun({ version, changeScope });

if (changeScope.changedFiles.length === 0) {
  console.log('[WARN] 未解析到变更文件（--diff 范围为空或非 git 仓库），输出空策略');
}

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'missions'), { recursive: true });

const strategyPath = join(outDir, 'test-strategy.md');
writeFileSync(strategyPath, renderStrategy(strategy), 'utf-8');
console.log(`策略: ${strategyPath} (risk=${strategy.risk}, dims=${strategy.affectedDimensions.length})`);

for (const m of missions) {
  const p = join(outDir, 'missions', `${m.missionId}.yaml`);
  writeFileSync(p, renderMission(m), 'utf-8');
  console.log(`使命: ${p} (${m.missionId} ${m.domain} ${m.priority})`);
}

console.log(`\n共 ${missions.length} 个使命，风险等级 ${strategy.risk}`);