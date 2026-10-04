import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const hook = 'C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.py';
const result = { caseId: 'D4-25', status: 'NOT_RUN', why: '' };

try {
  const exists = existsSync(hook);
  const src = exists ? readFileSync(hook, 'utf8') : '';
  const hasHookProtocol = /hookSpecificOutput|permissionDecision|PreToolUse|classify/i.test(src);
  result.status = exists && hasHookProtocol ? 'PASS' : 'FAIL';
  result.why = `python hook exists=${exists}; hook protocol markers=${hasHookProtocol}; path=${hook}`;
} catch (error) {
  result.status = 'FAIL';
  result.why = `probe error: ${error?.message || error}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
writeFileSync(new URL('./stdout.log', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
