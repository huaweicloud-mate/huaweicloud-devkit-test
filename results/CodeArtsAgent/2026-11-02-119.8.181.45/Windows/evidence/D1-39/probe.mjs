// Evidence for D1-39: Windows upgrade detection chain
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const results = {};

try {
  const r1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true,
  });
  const hasEINVAL = r1.error?.code === 'EINVAL';
  
  const r2 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true,
  });
  const worksWithShell = r2.status === 0;
  
  results['D1-39'] = { 
    status: hasEINVAL ? 'FAIL' : 'PASS',
    einvalError: r1.error?.code,
    worksWithShell,
    r2status: r2.status,
    why: hasEINVAL ? 'EINVAL on Windows without shell:true' : 'No EINVAL - detection chain works'
  };
} catch(e) { results['D1-39'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
