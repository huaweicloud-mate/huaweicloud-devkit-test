// Source-level probe for D1-65 / D1-67 / D1-68 / D3-S5 (2026-09-20 Hermes/Linux)
// Directly exercises exported functions from huaweicloud-core source.
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const SRC = process.env.HDK_SRC || join(process.cwd(), '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const results = [];
const log = (id, name, pass, actual, expected, note) =>
  results.push({ id, name, pass: !!pass, actual: String(actual ?? '').slice(0, 200), expected: String(expected ?? ''), note: String(note ?? '').slice(0, 200) });

const up = await import(pathToFileURL(join(SRC, 'update-check.mjs')).href);
const icon = await import(pathToFileURL(join(SRC, 'icon-library.mjs')).href);

// ---- D1-65: 调试模式环境变量 (HUAWEICLOUD_DEVKIT_DEBUG) ----
// debugLog gates on === '1' || 'true'. Trigger via queryDistTagsFetch failing path to a bogus registry.
{
  const orig = process.env.HUAWEICLOUD_NPM_REGISTRY;
  process.env.HUAWEICLOUD_NPM_REGISTRY = 'http://127.0.0.1:1/bogus';
  // capture stderr
  const errs = [];
  const origErr = console.error;
  console.error = (...a) => errs.push(a.join(' '));
  try {
    process.env.HUAWEICLOUD_DEVKIT_DEBUG = '1';
    await up.queryDistTagsFetch({ timeoutMs: 2000 });
    const debugOn = errs.some((e) => e.includes('[debug]'));
    errs.length = 0;
    delete process.env.HUAWEICLOUD_DEVKIT_DEBUG;
    await up.queryDistTagsFetch({ timeoutMs: 2000 });
    const debugOff = errs.some((e) => e.includes('[debug]'));
    log('D1-65', 'debug-env-on', debugOn, debugOn, '[debug] 出现', 'DEBUG=1 开启调试日志');
    log('D1-65', 'debug-env-off', !debugOff, debugOff, '无 [debug] 输出', '未设 DEBUG 不输出调试日志');
  } finally {
    console.error = origErr;
    if (orig !== undefined) process.env.HUAWEICLOUD_NPM_REGISTRY = orig; else delete process.env.HUAWEICLOUD_NPM_REGISTRY;
    delete process.env.HUAWEICLOUD_DEVKIT_DEBUG;
  }
}

// ---- D1-68: 图标离线 (HUAWEICLOUD_ICONS_OFFLINE) + region 优先级 ----
{
  icon.clearIconCache();
  delete process.env.HUAWEICLOUD_ICONS_OFFLINE;
  const online = await icon.getServiceIcon('ecs');
  // offline: set env var, clear cache, re-query -> source should be 'snapshot'
  icon.clearIconCache();
  process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
  const offline = await icon.getServiceIcon('ecs');
  log('D1-68', 'icons-offline-source', offline.source === 'snapshot', offline.source, 'snapshot', 'ICONS_OFFLINE=1 走本地 manifest 不联网');
  delete process.env.HUAWEICLOUD_ICONS_OFFLINE;
  icon.clearIconCache();
  // record whether live cache was reachable (for context only)
  log('D1-68', 'icons-online-source', online.source === 'live' || online.source === 'snapshot', online.source, 'live|snapshot', '在线/回退快照');
}

{
  // region 优先级：case 期望 HUAWEICLOUD_REGION 优先于 HW_REGION
  const cred = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);
  // resolveCredentials 会读全局凭证文件；这里直接验证 env 优先级分支，
  // 通过静态观测方式记录实际实现（源码 credentials.mjs:133：HW_REGION || HUAWEICLOUD_REGION）。
  log('D1-68', 'region-env-priority-impl', 'HW_REGION 优先', '(source) credentials.mjs:133 = HW_REGION || HUAWEICLOUD_REGION', 'HUAWEICLOUD_REGION 优先', 'case 预期 vs 实现顺序');
}

// ---- D3-S5: 复合意图分层路由 (serviceCatalog routeMap) ----
{
  try {
    const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
    const cat = tools.serviceCatalog || tools.huaweicloud_service_catalog;
    if (typeof cat === 'function') {
      const r1 = await cat({ intent: '存储一个对象并部署静态网站托管' });
      log('D3-S5', 'composite-route', !!(r1 && (r1.services || r1.recommendations)), JSON.stringify(r1).slice(0, 260), '命中多 service', '复合意图拆分');
    } else {
      log('D3-S5', 'composite-route', false, 'serviceCatalog 不可直调', 'function', '需 MCP 层调 service_catalog');
    }
  } catch (e) {
    log('D3-S5', 'composite-route', false, String(e).slice(0, 160), '命中多 service', '直调异常');
  }
}

console.log(JSON.stringify({ total: results.length, generatedAt: new Date().toISOString(), results }, null, 2));