import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const evBase = 'C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/huaweicloud-devkit-test/results/CodeArtsWork/2026-09-21-120.46.40.202/Windows/evidence';

// D1-3: doctor health check
console.log('=== D1-3: doctor health check ===');
try {
  const output = execFileSync('huaweicloud-devkit', ['doctor'], { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
  const hasPass = /\[PASS\]/i.test(output);
  const hasFail = /\[FAIL\]/i.test(output);
  const allPass = hasPass && !hasFail;
  console.log('  doctor output has PASS: ' + hasPass);
  console.log('  doctor output has FAIL: ' + hasFail);
  console.log('  all checks passed: ' + allPass);
  mkdirSync(join(evBase, 'D1-3'), { recursive: true });
  writeFileSync(join(evBase, 'D1-3', 'stdout.log'), output);
  console.log('D1-3_VERDICT=' + (allPass ? 'PASS' : 'FAIL'));
} catch (e) {
  // doctor might output to stderr
  const out = (e.stdout || '') + (e.stderr || '') + (e.message || '');
  const hasPass = /\[PASS\]/i.test(out);
  const hasFail = /\[FAIL\]/i.test(out);
  const allPass = hasPass && !hasFail;
  mkdirSync(join(evBase, 'D1-3'), { recursive: true });
  writeFileSync(join(evBase, 'D1-3', 'stdout.log'), out);
  console.log('  doctor (via stderr) has PASS: ' + hasPass + ', has FAIL: ' + hasFail);
  console.log('D1-3_VERDICT=' + (allPass ? 'PASS' : 'FAIL'));
}
