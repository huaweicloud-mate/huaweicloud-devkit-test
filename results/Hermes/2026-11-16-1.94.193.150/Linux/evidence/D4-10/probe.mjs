// 补充探针（源码级直调）：D1-30 semver 比对正确性 / D4-10 规则库新增回归
// 用法: node supplement-import.mjs <src目录>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const S = process.argv[2];
const { semverCompare } = await import(pathToFileURL(join(S, 'update-check.mjs')).href);
const { evaluateCommandRisk } = await import(pathToFileURL(join(S, 'risk-rule-engine.mjs')).href);

function section(id, run) {
  console.log(`=====CASE ${id}=====`);
  try { run(); } catch (e) { console.log('EXCEPTION:', e.message); }
  console.log(`=====END ${id}=====`);
}

// ---- D1-30 semver 比对正确性 ----
section('D1-30', () => {
  const cases = [
    ['1.1.2 vs 1.1.1 (应>0)', semverCompare('1.1.2', '1.1.1') > 0],
    ['1.1.1 vs 1.1.2 (应<0)', semverCompare('1.1.1', '1.1.2') < 0],
    ['1.1.0 vs 1.1.0-next.9 (正式版>预发布,应>0)', semverCompare('1.1.0', '1.1.0-next.9') > 0],
    ['1.1.0-next.9 vs 1.1.0 (应<0)', semverCompare('1.1.0-next.9', '1.1.0') < 0],
    ['相等=0 (1.2.3 vs 1.2.3)', semverCompare('1.2.3', '1.2.3') === 0],
    ['无效串按字典序 (abc vs abd 应<0)', semverCompare('abc', 'abd') < 0],
    ['无效串相等 (x vs x 应=0)', semverCompare('x', 'x') === 0],
  ];
  for (const [label, ok] of cases) {
    console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}`);
  }
});

// ---- D4-10 规则库新增回归：新规则不误杀既有正常操作 ----
section('D4-10', () => {
  const benign = [
    ['只读 ListServers', 'hcloud ecs ListServers'],
    ['只读 ShowProfile', 'hcloud configure show'],
    ['只读 ListSecretVersions', 'hcloud csms ListSecretVersions --secret-name x'],
    ['查询配额 ListRegions', 'hcloud iam ListRegions'],
    ['普通 npm 安装(非破坏)', 'npm install lodash'],
  ];
  for (const [tag, cmd] of benign) {
    const r = evaluateCommandRisk(cmd);
    const rules = (r.findings || []).map((f) => f.ruleId).join(',');
    // 只读/常规操作不应被误判为 deny（破坏/凭证/暴露类高危）
    const high = (r.findings || []).filter((f) => /destructive|credential|secret|admin|public|expose/i.test(f.ruleId || ''));
    console.log(`[${tag}] $ ${cmd}  => decision=${r.decision} findings=${rules || '(无)'} 高危命中=${high.length}`);
  }
  // 对照：高危仍应命中
  const d = evaluateCommandRisk('hcloud ecs DeleteServer --force');
  console.log('[对照高危] hcloud ecs DeleteServer --force => decision=' + d.decision + ' findings=' + (d.findings || []).map((f) => f.ruleId).join(','));
});
console.log('=== DONE ===');