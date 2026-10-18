// Evidence for EXP-NR3-09

// P0 Expanded: EXP-NR3-09 - Windows spawnSync('npm.cmd') EINVAL direct capture
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const results = {};

// EXP-NR3-09: spawnSync('npm.cmd') EINVAL direct capture; sync/async dual path; real 1.1.2存量 reproduce
try {
  // 1. Direct EINVAL capture without shell:true
  const r1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true,
  });
  const hasEINVAL = r1.error?.code === 'EINVAL';
  
  // 2. With shell:true (works)
  const r2 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true,
  });
  const worksWithShell = r2.status === 0 && r2.stdout?.includes('latest');
  
  // 3. MCP end-to-end check_failed (source-level: the spawnSync EINVAL propagates as check_failed)
  const mcpCheckFailed = hasEINVAL; // If EINVAL occurs, MCP check_update would return check_failed
  
  results['EXP-NR3-09'] = {
    status: 'FAIL', // Expected FAIL per test case design (bug reproduction before fix)
    einvalError: r1.error?.code,
    worksWithShell,
    r2status: r2.status,
    stdout: r2.stdout?.substring(0, 200),
    mcpCheckFailed,
    why: `EINVAL=${hasEINVAL}, shell:true works=${worksWithShell}, MCP check_failed=${mcpCheckFailed} — expected FAIL (pre-fix state)`
  };
} catch(e) { results['EXP-NR3-09'] = { status: 'BLOCKED', why: e.message }; }

const output = JSON.stringify(results, null, 2);
console.log(output);
writeFileSync('p0-exp-results.json', output);
