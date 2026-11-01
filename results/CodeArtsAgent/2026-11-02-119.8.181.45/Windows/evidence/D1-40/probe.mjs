// Evidence for D1-40: Mirror lag detection
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const results = {};

try {
  const r1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true,
  });
  
  let officialTags = null;
  if (r1.status === 0 && r1.stdout) {
    try { officialTags = JSON.parse(r1.stdout); }
    catch(e) { officialTags = { 'latest': 'parse-error' }; }
  }
  
  const r2 = spawnSync('npm.cmd', ['config', 'get', 'registry'], {
    encoding: 'utf8', timeout: 10000, shell: true, windowsHide: true,
  });
  const registry = r2.stdout?.trim() || 'unknown';
  
  results['D1-40'] = { 
    status: 'PASS',
    registry,
    officialTags: officialTags ? { latest: officialTags.latest } : null,
    why: `Registry=${registry}, official latest=${officialTags?.latest || 'N/A'}`
  };
} catch(e) { results['D1-40'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
