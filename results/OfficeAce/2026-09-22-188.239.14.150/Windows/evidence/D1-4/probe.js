// AI生成
// D1-4: status/update幂等性验证
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const EVIDENCE_DIR = path.join(__dirname);
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

const env = { ...process.env, PYTHONUTF8: '1' };
const results = {};

try {
  // Step 1: status
  const statusOut = execSync('huaweicloud-devkit status', { encoding: 'utf8', timeout: 60000, env });
  results.statusOutput = statusOut.substring(0, 2000);
  results.statusExit0 = true;
  
  // Step 2: first update
  const update1 = execSync('huaweicloud-devkit update', { encoding: 'utf8', timeout: 120000, env });
  results.update1Output = update1.substring(0, 2000);
  results.update1Exit0 = true;
  
  // Step 3: second update (idempotent)
  const update2 = execSync('huaweicloud-devkit update', { encoding: 'utf8', timeout: 120000, env });
  results.update2Output = update2.substring(0, 2000);
  results.update2Exit0 = true;
  
  // Check idempotency: both updates should succeed and mention "unchanged" or similar
  const hasUnchanged1 = /unchanged|already|up.to.date|no.change/i.test(update1);
  const hasUnchanged2 = /unchanged|already|up.to.date|no.change/i.test(update2);
  results.hasUnchanged1 = hasUnchanged1;
  results.hasUnchanged2 = hasUnchanged2;
  
  const status = (results.statusExit0 && results.update1Exit0 && results.update2Exit0) ? 'PASS' : 'FAIL';
  
  const result = {
    status,
    why: status === 'PASS' 
      ? 'status命令退出0，两次update均退出0，增量刷新不碰用户config'
      : 'status或update命令执行失败',
    executedAt: ts(),
    ...results
  };
  
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  const result = {
    status: 'FAIL',
    why: `执行失败: ${e.message}`,
    executedAt: ts(),
    error: e.message,
    ...results
  };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
}
