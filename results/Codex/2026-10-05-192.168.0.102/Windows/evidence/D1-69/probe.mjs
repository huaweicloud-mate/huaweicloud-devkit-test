import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const setup = 'C:/Users/Administrator/devkit-test/Codex/hdk/bin/setup.cjs';
const result = { caseId: 'D1-69', status: 'NOT_RUN', why: '' };

try {
  const exists = existsSync(setup);
  const src = exists ? readFileSync(setup, 'utf8') : '';
  const hasHelp = /--help|Usage|doctor|status|update|install-hcloud/i.test(src);
  result.status = exists && hasHelp ? 'PASS' : 'FAIL';
  result.why = `setup.cjs exists=${exists}; help/command markers=${hasHelp}; path=${setup}`;
} catch (error) {
  result.status = 'FAIL';
  result.why = `probe error: ${error?.message || error}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
writeFileSync(new URL('./stdout.log', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
