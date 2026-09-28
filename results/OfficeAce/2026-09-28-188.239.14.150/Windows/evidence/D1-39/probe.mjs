// D1-39: Windows 升级检测链可用性探针
// 测试 queryDistTagsSync 在 Windows 下不产生 EINVAL
import { spawnSync } from 'node:child_process';

const SRC = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src\\update-check.mjs';

async function main() {
  const findings = [];
  let status = 'PASS';
  let why = '';

  // 1. 验证 Node 版本（EINVAL 问题是 Node 22+ CVE-2024-27980 引入）
  const nodeVersion = process.version;
  findings.push(`nodeVersion=${nodeVersion}`);
  findings.push(`platform=${process.platform}`);

  // 2. 直接测试 spawnSync 不带 shell:true 是否会 EINVAL（对照组）
  try {
    spawnSync('npm.cmd', ['--version'], { encoding: 'utf8', timeout: 10000, windowsHide: true });
    findings.push('spawnSync without shell:true: no EINVAL thrown');
  } catch (e) {
    findings.push(`spawnSync without shell:true: ${e.code || e.message}`);
  }

  // 3. 测试 spawnSync 带 shell:true（queryDistTagsSync 使用的模式）
  try {
    const r = spawnSync('npm.cmd', ['--version'], { encoding: 'utf8', timeout: 10000, windowsHide: true, shell: true });
    findings.push(`spawnSync with shell:true: status=${r.status}, stdout=${String(r.stdout || '').trim()}`);
  } catch (e) {
    findings.push(`spawnSync with shell:true: THROWN ${e.code || e.message}`);
    status = 'FAIL';
    why = `spawnSync with shell:true threw ${e.code || e.message}`;
  }

  // 4. 导入并调用 queryDistTagsSync
  let mod;
  try {
    mod = await import('file:///' + SRC.replace(/\\/g, '/'));
    findings.push('import update-check.mjs: OK');
  } catch (e) {
    findings.push(`import update-check.mjs: FAILED ${e.message}`);
    status = 'BLOCKED';
    why = `无法导入 update-check.mjs: ${e.message}`;
    return { status, why, findings };
  }

  // 5. 调用 queryDistTagsSync（短超时，关注是否 EINVAL）
  try {
    const result = mod.queryDistTagsSync({ timeoutMs: 15000 });
    if (result === null) {
      findings.push('queryDistTagsSync returned null (npm view failed or no network, but NO EINVAL)');
    } else {
      findings.push(`queryDistTagsSync returned: ${JSON.stringify(result)}`);
    }
    // 关键：没有抛出 EINVAL = PASS
    findings.push('NO EINVAL detected — shell:true mitigation is effective');
  } catch (e) {
    const isEINVAL = e.code === 'EINVAL' || String(e.message).includes('EINVAL');
    findings.push(`queryDistTagsSync THROWN: code=${e.code}, msg=${e.message}`);
    if (isEINVAL) {
      status = 'FAIL';
      why = `queryDistTagsSync threw EINVAL: ${e.message}`;
    } else {
      status = 'FAIL';
      why = `queryDistTagsSync threw unexpected error: ${e.message}`;
    }
  }

  // 6. 验证源码中 shell:true 存在（静态检查）
  try {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(SRC, 'utf8');
    const hasShellTrue = src.includes('shell: true');
    findings.push(`source contains shell:true: ${hasShellTrue}`);
    if (!hasShellTrue) {
      status = 'FAIL';
      why = 'source code does not contain shell:true mitigation';
    }
  } catch (e) {
    findings.push(`static check failed: ${e.message}`);
  }

  if (status === 'PASS') {
    why = 'queryDistTagsSync 在 Windows 下正常执行，未产生 EINVAL，shell:true 缓解措施有效';
  }

  return { status, why, findings };
}

const result = await main();
const now = new Date();
const ts = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0');

const output = {
  status: result.status,
  why: result.why,
  executedAt: ts,
  findings: result.findings
};

console.log(JSON.stringify(output, null, 2));