// AI生成
// D1-3: doctor健康自检
// Probe: run `npx huaweicloud-devkit doctor` and verify health check output
// Expected: 检测项准确，失败场景如实报告且给出修复指引
const { execSync } = require('child_process');
try {
  const out = execSync('npx huaweicloud-devkit doctor', { encoding: 'utf8', timeout: 60000 });
  console.log(out);
  const hasPass = /\[PASS\]/.test(out);
  const hasResults = /Results:\s+\d+\s+pass/.test(out);
  console.log(`\n--- VERIFICATION ---`);
  console.log(`Has [PASS] markers: ${hasPass}`);
  console.log(`Has Results summary: ${hasResults}`);
  console.log(`Overall: ${hasPass && hasResults ? 'PASS' : 'FAIL'}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
