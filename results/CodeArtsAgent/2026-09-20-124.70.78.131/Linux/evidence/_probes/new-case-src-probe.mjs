// 新增源码直调用例探针（CodeArtsAgent Linux 2026-09-20 daily）
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const SRC = process.argv[2];
const S = (f) => join(SRC, f);
const U = await import(pathToFileURL(S('update-check.mjs')).href);
const T = await import(pathToFileURL(S('telemetry/telemetry.mjs')).href);
const K = await import(pathToFileURL(S('koocli-version.mjs')).href);
const P = await import(pathToFileURL(S('proxy/proxy-config.mjs')).href);
const SP = await import(pathToFileURL(S('safety-policy.mjs')).href);
const IL = await import(pathToFileURL(S('icon-library.mjs')).href);
const SM = await import(pathToFileURL(S('search-market.mjs')).href);

let okAll = true;
function check(id, name, cond, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} | ${id} | ${name}${detail ? ' | ' + detail : ''}`);
  if (!cond) okAll = false;
}

// ===== D1-66 遥测开关 =====
{
  const orig = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  check('D1-66', 'TELEMETRY=off 时关闭遥测', T.isTelemetryEnabled() === false);
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  check('D1-66', '未设时默认开遥测', T.isTelemetryEnabled() === true);
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';
  check('D1-66', 'TELEMETRY!=off 时开遥测', T.isTelemetryEnabled() === true);
  if (orig !== undefined) process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = orig; else delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
}

// ===== D1-70 代理配置 =====
{
  const iso = mkdtempSync(join(tmpdir(), 'hdk-proxy-'));
  process.env.HUAWEICLOUD_HOME = iso;
  const path = P.writeProxyConfig({ https_proxy: 'http://proxy:8080', no_proxy: '.huaweicloud.com' });
  check('D1-70', 'writeProxyConfig 落盘', existsSync(path));
  const read = P.readProxyConfig();
  check('D1-70', 'readProxyConfig 回读 https_proxy', read && read.https_proxy === 'http://proxy:8080');
  const settings = P.getProxySettings('https://console.huaweicloud.com');
  check('D1-70', 'no_proxy 命中返回 null', settings === null);
  const settings2 = P.getProxySettings('https://example.com');
  check('D1-70', '非 no_proxy 返回 proxyUrl', settings2 && settings2.proxyUrl === 'http://proxy:8080');
  check('D1-70', 'clearProxyConfig 删除', P.clearProxyConfig() === true && !existsSync(path));
  rmSync(iso, { recursive: true, force: true });
}

// ===== D2-27 KooCLI 版本管理 =====
{
  const v = K.getKooCliVersion();
  console.log(`[D2-27] getKooCliVersion => ${v}`);
  check('D2-27', 'getKooCliVersion 读 kooCliVersion', typeof v === 'string' && /^\d+\.\d+\.\d+/.test(v));
  check('D2-27', 'parseHcloudVersion 提取', K.parseHcloudVersion('hcloud 7.2.12 build x') === '7.2.12');
  check('D2-27', 'compareVersion 大于', K.compareVersion('7.2.12', '7.2.9') === 1);
  check('D2-27', 'compareVersion 相等', K.compareVersion('7.2.9', '7.2.9') === 0);
  check('D2-27', 'kooCliDownloadBase 含 cli 路径', K.kooCliDownloadBase().includes('koocli.obs'));
}

// ===== D4-29 分类入口 + 断言 =====
{
  check('D4-29', 'classifyRawCommand 未导出(SPEC 漂移点)', typeof SP.classifyRawCommand !== 'function');
  const allow = SP.classifyTextCommand('hcloud ecs ListServers');
  check('D4-29', 'classifyTextCommand 只读 allow 带 reason', allow.decision === 'allow' && typeof allow.reason === 'string');
  let threw = false;
  try { SP.assertAllowed(SP.classifyTextCommand('hcloud ecs DeleteServer --force')); } catch (e) { threw = true; }
  check('D4-29', 'assertAllowed 对 deny 抛拒绝', threw === true);
  const ok = SP.assertAllowed(allow);
  check('D4-29', 'assertAllowed 对 allow 透传', ok === allow);
}

// ===== D6-9 缓存清理三入口 =====
{
  let again = true;
  try {
    U.invalidateUpdateCache(); IL.clearIconCache(); SM.clearMarketCache();
    U.invalidateUpdateCache(); IL.clearIconCache(); SM.clearMarketCache();
  } catch { again = false; }
  check('D6-9', '三缓存清理入口幂等(重复调用无异常)', again);
}

// ===== D8-9 安装 ID + 遥测值脱敏 =====
{
  const iso = mkdtempSync(join(tmpdir(), 'hdk-tele-'));
  process.env.HUAWEICLOUD_HOME = iso;
  const id1 = T.generateOrRecoverInstallId();
  const id2 = T.generateOrRecoverInstallId();
  console.log(`[D8-9] installId 稳定=${id1 === id2} len=${String(id1).length}`);
  check('D8-9', 'installId 生成稳定持久', typeof id1 === 'string' && id1.length >= 32 && id1 === id2);
  const clean = T.sanitizeValue('  abc\ndef\txyz  ');
  check('D8-9', 'sanitizeValue 去除换行/制表/trim', clean === 'abc def xyz');
  const long = T.sanitizeValue('x'.repeat(500));
  check('D8-9', 'sanitizeValue 超长截断至255', long.length === 255 && long.endsWith('...'));
  rmSync(iso, { recursive: true, force: true });
}

console.log(`=== 新增源码探针总判定: ${okAll ? 'ALL PASS' : 'HAS FAIL'} ===`);
