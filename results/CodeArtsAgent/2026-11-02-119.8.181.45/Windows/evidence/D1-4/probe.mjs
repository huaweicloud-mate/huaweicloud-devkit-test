import { writeFileSync } from 'node:fs';
const results = {};
try {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync('npx', ['--yes', 'huaweicloud-devkit', 'status'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
  const hasOutput = r.stdout && r.stdout.length > 50;
  results['D1-4'] = { status: hasOutput ? 'PASS' : 'FAIL', why: `status output=${hasOutput ? 'present' : 'empty'}` };
} catch(e) { results['D1-4'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
