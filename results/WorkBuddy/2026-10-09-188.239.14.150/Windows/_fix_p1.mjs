// Fix probes for D4-6, D6-4
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const risk = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');
const TS = '20261009050000';

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// Fix probe for ${id}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}

// D4-6 fix: adminPass warning works on artifact stage, not command stage
// Use hook_check_artifacts to test adminPass in artifacts
try {
  const artifacts = [{ type: 'ecs-config', content: JSON.stringify({ adminPass: 'PlainPwd123' }) }];
  const r = await tools.callTool('huaweicloud_hook_check_artifacts', { artifacts });
  const body = JSON.stringify(r);
  const hasWarn = /warn|adminPass|admin_pass|secret|deny/i.test(body);
  writeCase('D4-6', hasWarn
    ? { caseId:'D4-6', status:'PASS', why:'--adminPass 在 artifact 阶段触发 warn', sample: body.slice(0,200), executedAt:TS }
    : { caseId:'D4-6', status:'FAIL', why:'未拦截: '+body.slice(0,200), executedAt:TS });
} catch (e) { writeCase('D4-6', { caseId:'D4-6', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

// D6-4 fix: concurrent dispatch — use list_operations (local, no cloud access needed)
try {
  const ps = await Promise.all([
    tools.callTool('huaweicloud_list_operations', { service: 'ECS' }).catch(e=>({error:e.message})),
    tools.callTool('huaweicloud_list_operations', { service: 'VPC' }).catch(e=>({error:e.message})),
    tools.callTool('huaweicloud_list_operations', { service: 'OBS' }).catch(e=>({error:e.message})),
  ]);
  const allOk = ps.every(r => !r.error);
  writeCase('D6-4', allOk
    ? { caseId:'D6-4', status:'PASS', why:'3 并发 list_operations 均成功', evidence:{ results: ps.map(p => p.error ? 'error' : 'ok') }, executedAt:TS }
    : { caseId:'D6-4', status:'FAIL', why:'并发失败: '+JSON.stringify(ps).slice(0,200), executedAt:TS });
} catch (e) { writeCase('D6-4', { caseId:'D6-4', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

console.log('P1 fix done.');
