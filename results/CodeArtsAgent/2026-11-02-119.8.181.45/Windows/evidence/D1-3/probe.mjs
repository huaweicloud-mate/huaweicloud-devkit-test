import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const results = {};

try {
  const r = spawnSync('npx', ['--yes', 'huaweicloud-devkit', 'doctor', '--target', 'hermes'], {
    encoding: 'utf8', timeout: 60000, shell: true, windowsHide: true
  });
  const hasOutput = r.stdout && r.stdout.length > 50;
  results['D1-3'] = { 
    status: hasOutput ? 'PASS' : 'FAIL', 
    stdout: r.stdout?.substring(0, 300),
    stderr: r.stderr?.substring(0, 100),
    why: `doctor output=${hasOutput ? 'present' : 'empty'}`
  };
} catch(e) { results['D1-3'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
