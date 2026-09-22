// D1-extend: D1-65(DEBUG env) / D1-66(telemetry on/off) / D1-68(icon offline+region) / D1-70(proxy config) / D2-27(koocli version)
// 源码级直调 SUT 导出函数，结果落 stdout.log
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { isTelemetryEnabled, sanitizeValue } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';
import { getServiceIcon, clearIconCache } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/icon-library.mjs';
import { writeProxyConfig, readProxyConfig, getProxySettings, clearProxyConfig, getProxyUrlForTarget } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/proxy/proxy-config.mjs';
import { getKooCliVersion, parseHcloudVersion, compareVersion, kooCliDownloadBase, KOO_CLI_BASE } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/koocli-version.mjs';
import { resolveCredentials } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { queryDistTagsSync } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-23-1.94.218.129/Linux/evidence/d1-extend/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 160), expected: String(expected) });
}

// ===== D1-65: 调试模式环境变量 HUAWEICLOUD_DEVKIT_DEBUG =====
{
  // DEBUG=1 时 queryDistTagsSync 因 cwd 不存在触发 debugLog（写 stderr）；未设则无
  const rOn = spawnSync(process.execPath, ['--input-type=module', '-e',
    `process.env.HUAWEICLOUD_DEVKIT_DEBUG='1';import('${'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs'}').then(m=>m.queryDistTagsSync({cwd:'/nonexistent-dir-xyz'}))`],
    { encoding: 'utf8', timeout: 30000 });
  test('D1-65', 'debug-on-stderr', rOn.stderr.includes('[debug]'), rOn.stderr.slice(0, 120), 'DEBUG=1 → stderr 含 [debug]');

  const rOff = spawnSync(process.execPath, ['--input-type=module', '-e',
    `import('${'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs'}').then(m=>m.queryDistTagsSync({cwd:'/nonexistent-dir-xyz'}))`],
    { encoding: 'utf8', timeout: 30000 });
  test('D1-65', 'debug-off-silent', !rOff.stderr.includes('[debug]'), rOff.stderr.slice(0, 120), '未设 DEBUG → 无 [debug]');
}

// ===== D1-66: 遥测开关 HUAWEICLOUD_DEVKIT_TELEMETRY =====
{
  const orig = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  const offVal = isTelemetryEnabled();
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';
  const onVal = isTelemetryEnabled();
  if (orig === undefined) delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY; else process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = orig;
  test('D1-66', 'telemetry-off', offVal === false, offVal, 'TELEMETRY=off → false');
  test('D1-66', 'telemetry-on', onVal === true, onVal, 'TELEMETRY!=off → true');
}

// ===== D1-68: 图标离线 + region 优先 =====
{
  const orig = process.env.HUAWEICLOUD_ICONS_OFFLINE;
  process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
  clearIconCache();
  const icon = await getServiceIcon('ecs');
  if (orig === undefined) delete process.env.HUAWEICLOUD_ICONS_OFFLINE; else process.env.HUAWEICLOUD_ICONS_OFFLINE = orig;
  test('D1-68', 'icon-offline-snapshot', icon?.source === 'snapshot' && icon?.ok === true, icon?.source, 'offline=1 → source=snapshot');

  // region 优先：case 预期 HUAWEICLOUD_REGION 优先于 HW_REGION；实现 line133 为 HW_REGION || HUAWEICLOUD_REGION
  const oHw = process.env.HW_REGION, oCl = process.env.HUAWEICLOUD_REGION;
  process.env.HW_REGION = 'hw-region-val';
  process.env.HUAWEICLOUD_REGION = 'huaweicloud-region-val';
  const rc = resolveCredentials({});
  // 断言记录实际语义（实现取 HW_REGION 优先）
  test('D1-68', 'region-priority', rc.region === 'huaweicloud-region-val', `got=${rc.region} (HW_REGION=hw-region-val, HUAWEICLOUD_REGION=huaweicloud-region-val)`,
    'HUAWEICLOUD_REGION 优先于 HW_REGION（case 预期）');
  if (oHw === undefined) delete process.env.HW_REGION; else process.env.HW_REGION = oHw;
  if (oCl === undefined) delete process.env.HUAWEICLOUD_REGION; else process.env.HUAWEICLOUD_REGION = oCl;
}

// ===== D1-70: 代理配置读写 + no_proxy 绕过 =====
{
  const origHome = process.env.HUAWEICLOUD_HOME;
  // 用临时 HOME 隔离，避免污染真实 proxy.json
  process.env.HUAWEICLOUD_HOME = '/tmp/hdk-d170-proxyhome';
  clearProxyConfig();
  const p = writeProxyConfig({ https_proxy: 'http://127.0.0.1:8080', no_proxy: 'internal.example.com,*.local' });
  const cfg = readProxyConfig();
  test('D1-70', 'proxy-write-read', !!p && cfg?.https_proxy === 'http://127.0.0.1:8080', JSON.stringify(cfg), '写读一致');
  const noProxyHit = getProxySettings('https://internal.example.com/x');
  test('D1-70', 'no-proxy-bypass', noProxyHit === null, JSON.stringify(noProxyHit), 'no_proxy 命中 → null');
  const proxied = getProxySettings('https://public.example.com/x');
  test('D1-70', 'proxy-selected', proxied?.proxyUrl === 'http://127.0.0.1:8080', JSON.stringify(proxied), '未命中 no_proxy → 走代理');
  clearProxyConfig();
  if (origHome === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = origHome;
}

// ===== D2-27: KooCLI 版本管理 =====
{
  const v = getKooCliVersion();
  test('D2-27', 'getKooCliVersion', typeof v === 'string' && /^\d+\.\d+\.\d+/.test(v || ''), v, '读 kooCliVersion 为 x.y.z');
  const parsed = parseHcloudVersion('hcloud 7.2.12 (build abc) on Linux');
  test('D2-27', 'parseHcloudVersion', parsed === '7.2.12', parsed, '提取首个 x.y.z = 7.2.12');
  test('D2-27', 'compareVersion', compareVersion('7.2.12', '7.2.9') === 1 && compareVersion('7.2.12', '7.2.12') === 0 && compareVersion('1.0.0', '2.0.0') === -1, 'ok', '比较正确');
  const base = kooCliDownloadBase();
  test('D2-27', 'kooCliDownloadBase', base === `${KOO_CLI_BASE}/${v || 'latest'}`, base, 'downloadBase=KOO_CLI_BASE/<versionOrLatest>');
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);