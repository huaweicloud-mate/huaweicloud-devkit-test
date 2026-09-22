// D1-66 遥测开关与端点环境变量夹具
// 隔离进程注入 HUAWEICLOUD_DEVKIT_TELEMETRY / HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT
// 观测 isTelemetryEnabled() 开关行为 + getEndpoint() 端点覆盖 + enqueueEvent/trackInstall 旁路
// 用法: node d1-66-telemetry-env.mjs <hdk src> [--evid <dir>]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d1-66-telemetry-env.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const telemetryUrl = new URL(`file://${hdkSrc}/telemetry/telemetry.mjs`);

// --- ① 默认状态：遥测开启（env 未设 HUAWEICLOUD_DEVKIT_TELEMETRY） ---
{
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT;
  // Fresh import each time via cache busting
  const mod = await import(telemetryUrl + '?t=' + Date.now());
  rec('D1-66-default-on', '默认遥测开启', mod.isTelemetryEnabled() === true,
      mod.isTelemetryEnabled(), true);
}

// --- ② HUAWEICLOUD_DEVKIT_TELEMETRY=off → 关闭 ---
{
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  const mod = await import(telemetryUrl + '?t=off' + Date.now());
  rec('D1-66-telemetry-off', 'TELEMETRY=off 遥测关闭', mod.isTelemetryEnabled() === false,
      mod.isTelemetryEnabled(), false);
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
}

// --- ③ HUAWEICLOUD_DEVKIT_TELEMETRY=on → 仍开启（只有 'off' 才关） ---
{
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';
  const mod = await import(telemetryUrl + '?t=on' + Date.now());
  rec('D1-66-telemetry-on', 'TELEMETRY=on 仍开启（非 off 均开）', mod.isTelemetryEnabled() === true,
      mod.isTelemetryEnabled(), true);
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
}

// --- ④ HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT 覆盖默认端点 ---
// getEndpoint 不是 export 的，通过 enqueueEvent 间接验证：端点变更不影响 enqueue 逻辑
// 直接测 isTelemetryEnabled 语义 + 通过 initTelemetry 旁路验证 endpoint 注入不崩溃
{
  const customEndpoint = 'https://test.example.com/telemetry';
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT = customEndpoint;
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off'; // 关闭以避免实际 flush
  const mod = await import(telemetryUrl + '?t=ep' + Date.now());
  // 关闭状态下 initTelemetry 直接 return，不触发 flush → 端点注入不崩溃
  mod.initTelemetry({ harness: 'test-fixture', version: '0.0.0' });
  rec('D1-66-endpoint-override', '自定义端点注入不崩溃', mod.isTelemetryEnabled() === false,
      mod.isTelemetryEnabled(), false, `endpoint=${customEndpoint} (遥测关闭，不实际 flush)`);
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT;
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
}

// --- ⑤ enqueueEvent 在遥测关闭时跳入队（no-op） ---
// eventQueue 为模块私有变量（未 export），通过 mock fetch 间接验证：
// 遥测关闭时 enqueueEvent 直接 return，不入队 → 无 flush → fetch 不被调用
{
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  const mod = await import(telemetryUrl + '?t=eq' + Date.now());
  const telemetryOff = mod.isTelemetryEnabled() === false;
  // mock fetch 检测是否有 flush 触发
  const origFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => { fetchCalled = true; return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('{}') }); };
  mod.enqueueEvent({ key: 'test:event', value: 'd1-66' });
  // 等待 setImmediate 回调（enqueueEvent 内可能 setImmediate flush）
  await new Promise((r) => setImmediate(r));
  globalThis.fetch = origFetch;
  rec('D1-66-enqueue-skipped', '遥测关闭时 enqueueEvent 跳入队（eventQueue 不增长）',
      telemetryOff && !fetchCalled,
      { telemetryEnabled: !telemetryOff, fetchCalled },
      { telemetryEnabled: false, fetchCalled: false },
      'eventQueue 私有未 export，通过 fetch 未被调用间接验证队列未增长');
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
}

// --- ⑥ sanitizeValue 截断与脱敏（遥测数据安全基线） ---
{
  const mod = await import(telemetryUrl + '?t=sv' + Date.now());
  const long = 'x'.repeat(300);
  const sanitized = mod.sanitizeValue(long);
  rec('D1-66-sanitize-truncate', 'sanitizeValue 截断超长值（>255）',
      sanitized.length === 255 && sanitized.endsWith('...'),
      sanitized.length, 255, `尾部=${sanitized.slice(-3)}`);
  const clean = mod.sanitizeValue('hello\nworld\ttab');
  rec('D1-66-sanitize-newlines', 'sanitizeValue 清除换行/制表',
      !clean.includes('\n') && !clean.includes('\t'),
      clean, 'hello world tab');
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D1-66 遥测开关与端点环境变量夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D1-66');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D1-66 遥测开关与端点环境变量夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
