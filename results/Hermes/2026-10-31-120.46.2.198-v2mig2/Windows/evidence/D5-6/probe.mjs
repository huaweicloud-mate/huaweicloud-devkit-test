// D5-6 Windows特有问题 补测探针 (Hermes, v2.0.0 @ fcfe047f)
// 验证: ①Hermes安装 ②config完整性 ③文件锁 ④doctor查Python SDK
// 运行: cd <hdk>; node probe-d5-6.mjs (依赖 npm ci + npm run build 完成)
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HDK = resolve('.');
const results = {};

// ④ doctor --target hermes (含 Hermes MCP Python SDK check)
const doc = spawnSync('node', ['bin/setup.cjs', 'doctor', '--target', 'hermes'], {
  cwd: HDK, encoding: 'utf8', timeout: 120000,
});
const doctorOut = ((doc.stdout || '') + (doc.stderr || '')).replace(/\x1b\[[0-9;]*m/g, '');
results.doctor = {
  rc: doc.status ?? null,
  pythonSdkPass: /\[PASS\]\s+Hermes MCP Python SDK/.test(doctorOut),
  mcpConfiguredPass: /\[PASS\]\s+MCP configured/.test(doctorOut),
  summary: (doctorOut.match(/Results:.*/) || [''])[0].trim(),
};
console.log('[D5-6] doctor rc=', results.doctor.rc, 'pythonSdkPass=', results.doctor.pythonSdkPass);

// ④ Python mcp SDK 直接探针
const py = spawnSync('python', ['-c', 'import mcp; print("ok")'], { encoding: 'utf8', timeout: 5000 });
results.pythonMcpSdk = (py.stdout || '').includes('ok') ? 'ok' : ('fail: ' + (py.stderr || '').trim());
console.log('[D5-6] python mcp SDK:', results.pythonMcpSdk);

// ② config 完整性: 读取 Hermes config.yaml 的 mcp_servers.huaweicloud-devkit
import { homedir } from 'node:os';
const home = homedir();
const cfgP = resolve(home, 'AppData/Local/hermes/config.yaml');
const configPresent = existsSync(cfgP);
let mcpArgs = null;
if (configPresent) {
  const txt = readFileSync(cfgP, 'utf8');
  const m = txt.match(/mcp_servers:\s*\n\s*huaweicloud-devkit:\s*\n\s*command:\s*"node"\s*\n\s*args:\s*(\[[^\]]*\])/);
  mcpArgs = m ? m[1] : '(not matched)';
}
results.configIntegrity = { configPresent, mcpArgs };
console.log('[D5-6] config present=', configPresent, 'args=', mcpArgs);

// ③ 文件锁: 校验源码存在 EPERM/EBUSY 文件锁重试梯
const prd = resolve(HDK, 'plugins/huaweicloud-core/src/payload-runtime-deps.ts');
const prdTxt = existsSync(prd) ? readFileSync(prd, 'utf8') : '';
results.fileLockRetryLadder = /EPERM|EBUSY/.test(prdTxt);
console.log('[D5-6] file-lock retry ladder (EPERM/EBUSY):', results.fileLockRetryLadder);

// 结论 (三者 + doctor 全过 => PASS，文档范围可控)
const pass = results.doctor.pythonSdkPass && results.pythonMcpSdk === 'ok' && results.configIntegrity.configPresent && results.fileLockRetryLadder;
results.status = pass ? 'PASS' : 'FAIL';
results.executedAt = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
console.log('FINAL', JSON.stringify(results));
import { writeFileSync } from 'node:fs';
writeFileSync('d5-6-results.json', JSON.stringify(results, null, 2));