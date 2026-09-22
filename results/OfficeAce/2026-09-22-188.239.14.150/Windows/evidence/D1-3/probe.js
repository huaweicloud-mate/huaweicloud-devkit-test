// AI生成
// D1-3: doctor健康自检
// Run `huaweicloud-devkit doctor` and verify health check output
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EVIDENCE_DIR = path.join(__dirname);
const ts = () => new Date().toISOString();

try {
  const out = execSync('huaweicloud-devkit doctor', {
    encoding: 'utf8', timeout: 60000,
    env: { ...process.env, PYTHONUTF8: '1' }
  });
  
  const hasPass = /\[PASS\]/.test(out);
  const hasResults = /Results:\s+\d+\s+pass/.test(out);
  const allPassed = /All checks passed/.test(out);
  const noFail = /0 fail/.test(out);
  
  const status = (hasPass && hasResults && noFail) ? 'PASS' : 'FAIL';
  
  const result = {
    status,
    why: status === 'PASS' 
      ? 'doctor命令输出含[PASS]标记和Results摘要，0 fail' 
      : 'doctor命令输出不符合预期：缺少PASS标记或Results摘要或有fail项',
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').slice(0,14),
    doctorOutput: out.substring(0, 3000),
    checks: { hasPass, hasResults, allPassed, noFail }
  };
  
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  const result = {
    status: 'FAIL',
    why: `doctor命令执行失败: ${e.message}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').slice(0,14),
    error: e.message
  };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
}
