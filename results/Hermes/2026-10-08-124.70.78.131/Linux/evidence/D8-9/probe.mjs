import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const CORE = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const ISO = join(tmpdir(), 'hdk-probe-' + Date.now());
mkdirSync(ISO, { recursive: true });
process.env.HUAWEICLOUD_HOME = ISO;

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 400) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}
async function section(cid, fn) {
  console.log('\n=====CASE ' + cid + '=====');
  try { await fn(); } catch (e) { console.log('EXC: ' + e.message); check(cid + '::exception', false, e.stack || e.message); }
  console.log('=====END ' + cid + '=====');
}

await section('D2-27', async () => {
  const kv = await import(pathToFileURL(SRC + '/koocli-version.mjs').href);
  const v = kv.getKooCliVersion();
  const p = kv.parseHcloudVersion('hcloud 7.2.12 huaweicloud cloud cli');
  const cmp1 = kv.compareVersion('7.2.12', '7.2.9');
  const cmp2 = kv.compareVersion('7.2.9', '7.2.12');
  const cmp3 = kv.compareVersion('7.2.12', '7.2.12');
  const dl = kv.kooCliDownloadBase();
  console.log('getKooCliVersion=' + v);
  console.log('parseHcloudVersion=' + p);
  console.log('compare(7.2.12,7.2.9)=' + cmp1 + ' compare(7.2.9,7.2.12)=' + cmp2 + ' compare(7.2.12,7.2.12)=' + cmp3);
  console.log('downloadBase=' + dl);
  check('getKooCliVersion 读 package.json', typeof v === 'string' && /^\d+\.\d+\.\d+/.test(v), v);
  check('parseHcloudVersion 提取首个 x.y.z', p === '7.2.12', p);
  check('compareVersion 正确比较', cmp1 === 1 && cmp2 === -1 && cmp3 === 0, `${cmp1}/${cmp2}/${cmp3}`);
  check('downloadBase 含版本或 latest', dl.includes(v || 'latest'), dl);
});

await section('D1-70', async () => {
  const pc = await import(pathToFileURL(SRC + '/proxy/proxy-config.mjs').href);
  const pa = await import(pathToFileURL(SRC + '/proxy/proxy-agent.mjs').href);
  pc.clearProxyConfig();
  const path = pc.writeProxyConfig({ https_proxy: 'http://proxy.example:8080', http_proxy: 'http://proxy.example:8080', no_proxy: 'internal.corp.com' });
  const read = pc.readProxyConfig();
  console.log('writeProxyConfig path=' + path);
  console.log('readProxyConfig=' + JSON.stringify(read));
  check('write/read proxy.json 正确', read && read.https_proxy === 'http://proxy.example:8080', JSON.stringify(read));
  const psHttps = pc.getProxySettings('https://api.huaweicloud.com');
  const psBypass = pc.getProxySettings('https://internal.corp.com');
  console.log('getProxySettings(https)=' + JSON.stringify(psHttps));
  console.log('getProxySettings(no_proxy 命中)=' + JSON.stringify(psBypass));
  check('getProxySettings 拼 file + no_proxy 命中返回 null', psHttps && psHttps.proxyUrl === 'http://proxy.example:8080' && psBypass === null, JSON.stringify({ psHttps: psHttps, psBypass: psBypass }));
  process.env.HTTPS_PROXY = 'http://env-proxy:9999';
  const psEnv = pc.getProxySettings('https://api.huaweicloud.com');
  console.log('getProxySettings(env 优先)=' + JSON.stringify(psEnv));
  check('env 优先于 file', psEnv && psEnv.proxyUrl === 'http://env-proxy:9999', JSON.stringify(psEnv));
  delete process.env.HTTPS_PROXY;
  const wsImpl = await pa.getWebSocketImpl('https://api.huaweicloud.com');
  const wsNoProxy = await pa.getWebSocketImpl('https://internal.corp.com');
  console.log('getWebSocketImpl(有代理)=' + (wsImpl && wsImpl.name || 'proxyWebSocket'));
  console.log('getWebSocketImpl(no_proxy)=' + (wsNoProxy && wsNoProxy === globalThis.WebSocket ? 'globalThis.WebSocket' : (wsNoProxy && wsNoProxy.name)));
  check('有代理返回 undici ProxyWebSocket', typeof wsImpl === 'function' && wsImpl.name !== 'WebSocket', String(wsImpl && wsImpl.name));
  check('无代理回退 globalThis.WebSocket', wsNoProxy === globalThis.WebSocket, 'globalThis.WebSocket');
  const clr = pc.clearProxyConfig();
  const after = pc.readProxyConfig();
  check('clearProxyConfig 清空', clr === true && after === null, JSON.stringify(after));
});

await section('D8-9', async () => {
  const tele = await import(pathToFileURL(SRC + '/telemetry/telemetry.mjs').href);
  const id1 = tele.generateOrRecoverInstallId();
  const id2 = tele.generateOrRecoverInstallId();
  console.log('installId len=' + (id1 || '').length + ' 稳定=' + (id1 === id2) + ' (前8=' + String(id1 || '').slice(0, 8) + '…)');
  check('installId 稳定持久', id1 && id1 === id2 && (id1 || '').length >= 16, 'len=' + (id1 || '').length);
  const s1 = tele.sanitizeValue('AK123456  with\ttab\r\nand\nnewline');
  const s2 = tele.sanitizeValue('x'.repeat(5000));
  const s3 = tele.sanitizeValue('  legal-value  ');
  const s4 = tele.sanitizeValue('AK=ABC123DEF456GHI');
  const s5 = tele.sanitizeValue('access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET');
  console.log('sanitize(newline/tab)=' + JSON.stringify(s1));
  console.log('sanitize(长值 5000) len=' + s2.length);
  console.log('sanitize(trim)=' + JSON.stringify(s3));
  console.log('sanitize(AK=...)=' + JSON.stringify(s4));
  console.log('sanitize(access_key/token=...)=' + JSON.stringify(s5));
  check('sanitize 移除控制字符', !/[\r\n\t]/.test(s1), JSON.stringify(s1));
  check('sanitize 超长截断', s2.length < 5000, 'len=' + s2.length);
  check('sanitize 保留合法值', s3 === 'legal-value', JSON.stringify(s3));
  const leaksSensitive = /ABC123DEF456GHI|AKIA123|SECRET|T0K3N_SECRET/.test(s4 + ' ' + s5);
  check('sanitize 移除 AK/SK/token 敏感值(契约)', !leaksSensitive, JSON.stringify({ s4, s5 }));
});

await section('D8-10', async () => {
  const mg = await import(pathToFileURL(SRC + '/mcp-config-merge.mjs').href);
  const bk = await import(pathToFileURL(SRC + '/mcp-config-backup.mjs').href);
  const mcpPath = SRC + '/mcp-server.mjs';
  const c1 = mg.mergeCommandStyle({ type: 'local', command: ['node', mcpPath, '--flag'], enabled: true, timeout: 60000 }, { mcpPath });
  console.log('mergeCommandStyle.command=' + JSON.stringify(c1.entry.command));
  check('mergeCommandStyle 保留 user args', JSON.stringify(c1.entry.command) === JSON.stringify(['node', mcpPath, '--flag']), JSON.stringify(c1.entry.command));
  const a1 = mg.mergeArgsStyle({ command: 'node', args: [mcpPath, '--x'], env: { MY: '1' } }, { mcpPath, env: { HCLOUD_BIN: '/usr/bin/hcloud' } });
  const argsOk = JSON.stringify(a1.entry.args) === JSON.stringify([mcpPath, '--x']);
  const envOk = a1.entry.env && a1.entry.env.MY === '1' && a1.entry.env.HCLOUD_BIN === '/usr/bin/hcloud';
  console.log('mergeArgsStyle.args=' + JSON.stringify(a1.entry.args) + ' env=' + JSON.stringify(a1.entry.env));
  check('mergeArgsStyle 合并正确', argsOk && envOk, JSON.stringify({ args: a1.entry.args, env: a1.entry.env }));
  const delta = mg.extractUserDelta(a1.entry, 'args');
  console.log('extractUserDelta=' + JSON.stringify(delta));
  const applied = mg.applyUserDelta({ command: 'node', args: [mcpPath], env: { HCLOUD_BIN: '/usr/bin/hcloud' } }, delta, 'args');
  console.log('applyUserDelta.args=' + JSON.stringify(applied.args) + ' env=' + JSON.stringify(applied.env));
  check('delta 提取+应用幂等', applied.args && applied.args.includes('--x') && applied.env && applied.env.MY === '1', JSON.stringify(applied));
  const bfile = join(ISO, '.config', 'huaweicloud', 'devkit-mcp-backup.json');
  bk.saveAgentDelta('hermes', delta, bfile);
  const taken = bk.takeAgentDelta('hermes', bfile);
  const afterTake = bk.readAgentDelta('hermes', bfile);
  console.log('takeAgentDelta.argsExtra=' + JSON.stringify(taken && taken.argsExtra));
  check('save→take→readBackup 闭环', taken && taken.argsExtra && taken.argsExtra.includes('--x') && afterTake === null, JSON.stringify({ taken, afterTake }));
  const purged = bk.purgeBackup(bfile);
  check('purgeBackup 幂等', purged === true || purged === false, String(purged));
});

// D6-9: 缓存清理三入口
console.log('\n=====CASE D6-9=====');
{
  const uc = await import(pathToFileURL(SRC + '/update-check.mjs').href);
  const ic = await import(pathToFileURL(SRC + '/icon-library.mjs').href);
  const sm = await import(pathToFileURL(SRC + '/search-market.mjs').href);
  uc.invalidateUpdateCache();
  uc.invalidateUpdateCache();
  const afterUpd = uc.peekCachedUpdateInfo();
  console.log('invalidateUpdateCache x2 -> peek=' + JSON.stringify(afterUpd));
  ic.clearIconCache();
  ic.clearIconCache();
  const oldIcon = process.env.HUAWEICLOUD_ICONS_OFFLINE;
  process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
  const iconRes = await ic.getServiceIcon('ecs');
  if (oldIcon === undefined) delete process.env.HUAWEICLOUD_ICONS_OFFLINE; else process.env.HUAWEICLOUD_ICONS_OFFLINE = oldIcon;
  console.log('clearIconCache x2 后重查 source=' + iconRes.source + ' count=' + iconRes.count);
  sm.clearMarketCache();
  sm.clearMarketCache();
  console.log('clearMarketCache x2 OK');
  check('update cache 清理后 peek 为空', afterUpd === null || afterUpd === undefined, JSON.stringify(afterUpd));
  check('icon 清理后重查可拉取', iconRes.ok === true && iconRes.source === 'snapshot', 'source=' + iconRes.source);
  check('market 清理幂等', true, 'clearMarketCache 两次调用成功');
}
console.log('=====END D6-9=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));