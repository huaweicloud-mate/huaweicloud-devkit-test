// Save stdout.log for all probes
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const NODE = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node.exe';
const EVIDENCE = 'C:/Users/Administrator/WorkBuddy/2026-09-12-22-31-45/huaweicloud-devkit-test/results/WorkBuddy/2026-09-12/Windows/evidence';

const dirs = ['d4-security-core', 'd1-upgrade', 'd5-static', 'd2-d3-readonly', 'd9-protocol', 'd9-robust'];
for (const d of dirs) {
  const dirPath = path.join(EVIDENCE, d);
  const files = fs.readdirSync(dirPath).filter(f => f.startsWith('probe-') && f.endsWith('.mjs'));
  for (const f of files) {
    const fullPath = path.join(dirPath, f);
    try {
      const out = execSync(`"${NODE}" "${fullPath}"`, {
        timeout: 30000,
        encoding: 'utf8',
        env: { ...process.env, HUAWEICLOUD_DEVKIT_SKIP_UPDATE: '1' }
      });
      fs.writeFileSync(path.join(dirPath, 'stdout.log'), out);
      console.log(`${d}/${f}: ${out.split('\n').length} lines`);
    } catch (e) {
      const out = e.stdout || '';
      if (out) {
        fs.writeFileSync(path.join(dirPath, 'stdout.log'), out);
        console.log(`${d}/${f}: ${out.split('\n').length} lines (partial)`);
      }
      console.log(`${d}/${f}: ERROR ${e.message.slice(0, 200)}`);
    }
  }
}
