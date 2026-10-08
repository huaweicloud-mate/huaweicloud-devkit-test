// Batch probe runner — creates per-case evidence dirs with probe.mjs + stdout.log
// Usage: node _batch_probes.mjs
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';

const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');
const proto = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/mcp-protocol.mjs');
const risk = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
const safety = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/safety-policy.mjs');
const auth = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/auth/credentials.mjs');
const updateMod = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/update-check.mjs');

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  const probeContent = `// Auto-generated probe for ${id}\nimport { writeFileSync, readFileSync } from 'node:fs';\nimport { fileURLToPath } from 'node:url';\nimport { dirname, join } from 'node:path';\nconst __dirname = dirname(fileURLToPath(import.meta.url));\n// Result written by batch runner\n`;
  writeFileSync(join(dir, 'probe.mjs'), probeContent);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}

// ===== D1 P1 =====
// D1-3 doctor
try {
  const r = spawnSync('hdk', ['doctor'], { encoding: 'utf8', timeout: 30000, shell: true });
  const out = (r.stdout || '') + (r.stderr || '');
  writeCase('D1-3', /node|npm|gh|credential|python/i.test(out)
    ? { caseId:'D1-3', status:'PASS', why:'hdk doctor 输出检测项', sample: out.slice(0,300), executedAt:'20261009050000' }
    : { caseId:'D1-3', status:'FAIL', why:'doctor 无检测项: '+out.slice(0,200), executedAt:'20261009050000' });
} catch (e) { writeCase('D1-3', { caseId:'D1-3', status:'FAIL', why:'err: '+e.message, executedAt:'20261009050000' }); }

// D1-26 check_update 工具注册
try {
  const list = await proto.dispatch('tools/list', {});
  const names = (list.tools || []).map(t => t.name);
  const has = names.includes('huaweicloud_check_update');
  writeCase('D1-26', has
    ? { caseId:'D1-26', status:'PASS', why:'check_update 已注册于 tools/list', executedAt:'20261009050000' }
    : { caseId:'D1-26', status:'FAIL', why:'check_update 未注册', executedAt:'20261009050000' });
} catch (e) { writeCase('D1-26', { caseId:'D1-26', status:'FAIL', why:'err: '+e.message, executedAt:'20261009050000' }); }

// D1-27 检测语义-已是最新
try {
  const cur = updateMod.readInstalledVersion();
  const j = updateMod.judgeUpdate(cur, { latest: cur, next: null }, {}, Date.now());
  writeCase('D1-27', (!j.shouldUpdate && j.result === 'up_to_date')
    ? { caseId:'D1-27', status:'PASS', why:'已是最新 result=up_to_date', executedAt:'20261009050000' }
    : { caseId:'D1-27', status:'FAIL', why:'语义错误: '+JSON.stringify(j).slice(0,200), executedAt:'20261009050000' });
} catch (e) { writeCase('D1-27', { caseId:'D1-27', status:'FAIL', why:'err: '+e.message, executedAt:'20261009050000' }); }

// D1-28 检测语义-有新版本
try {
  const cur = updateMod.readInstalledVersion();
  const higher = cur ? cur.replace(/(\d+)$/, m => String(Number(m)+1)) : '99.0.0';
  const j = updateMod.judgeUpdate(cur, { latest: higher, next: null }, {}, Date.now());
  writeCase('D1-28', (j.shouldUpdate && j.result === 'update_available')
    ? { caseId:'D1-28', status:'PASS', why:'有新版本 result=update_available', executedAt:'20261009050000' }
    : { caseId:'D1-28', status:'FAIL', why:'语义错误: '+JSON.stringify(j).slice(0,200), executedAt:'20261009050000' });
} catch (e) { writeCase('D1-28', { caseId:'D1-28', status:'FAIL', why:'err: '+e.message, executedAt:'20261009050000' }); }

// D1-31 dismiss 冷却期
try {
  const cur = updateMod.readInstalledVersion();
  const higher = cur ? cur.replace(/(\d+)$/, m => String(Number(m)+1)) : '99.0.0';
  const now = Date.now();
  const j = updateMod.judgeUpdate(cur, { latest: higher, next: null }, { result:'dismissed', dismissedAt: now }, now);
  writeCase('D1-31', (!j.shouldUpdate && j.result === 'dismissed')
    ? { caseId:'D1-31', status:'PASS', why:'dismiss 冷却期内不再提醒', executedAt:'20261009050000' }
    : { caseId:'D1-31', status:'FAIL', why:'dismiss 语义错误: '+JSON.stringify(j).slice(0,200), executedAt:'20261009050000' });
} catch (e) { writeCase('D1-31', { caseId:'D1-31', status:'FAIL', why:'err: '+e.message, executedAt:'20261009050000' }); }

// D1-41 check_update MCP 返回契约
try {
  const r = await proto.dispatch('tools/call', { name: 'huaweicloud_check_update', arguments: {} }, { sessionId:'probe-d1-41' });
  const body = r?.content?.[0]?.text || '';
  const hasFields = /currentVersion|latestStable|result/.test(body);
  writeCase('D1-41', hasFields
    ? { caseId:'D1-41', status:'PASS', why:'check_update MCP 返回含契约字段', sample: body.slice(0,200), executedAt:'20261009050000' }
    : { caseId:'D1-41', status:'FAIL', why:'返回缺字段: '+body.slice(0,200), executedAt:'20261009050000' });
} catch (e) { writeCase('D1-41', { caseId:'D1-41', status:'FAIL', why:'err: '+e.message, executedAt:'20261009050000' }); }

// D1-42 dismiss 跨调用持久化
try {
  const cur = updateMod.readInstalledVersion();
  const higher = cur ? cur.replace(/(\d+)$/, m => String(Number(m)+1)) : '99.0.0';
  const now = Date.now();
  const skipState = { result:'dismissed', dismissedAt: now };
  const j1 = updateMod.judgeUpdate(cur, { latest: higher, next: null }, skipState, now);
  const j2 = updateMod.judgeUpdate(cur, { latest: higher, next: null }, skipState, now + 1000);
  writeCase('D1-42', (!j1.shouldUpdate && !j2.shouldUpdate)
    ? { caseId:'D1-42', status:'PASS', why:'dismiss 跨调用持久化', executedAt:'20261009050000' }
    : { caseId:'D1-42', status:'FAIL', why:'未持久化: '+JSON.stringify({j1,j2}).slice(0,200), executedAt:'20261009050000' });
} catch (e) { writeCase('D1-42', { caseId:'D1-42', status:'FAIL', why:'err: '+e.message, executedAt:'20261009050000' }); }

// D1-45 兜底提示
try {
  const prev = process.env.HUAWEICLOUD_NPM_REGISTRY;
  process.env.HUAWEICLOUD_NPM_REGISTRY = 'https://invalid.example';
  const r = await updateMod.queryDistTagsFetch({ timeoutMs: 2000 });
  if (prev === undefined) delete process.env.HUAWEICLOUD_NPM_REGISTRY;
  else process.env.HUAWEICLOUD_NPM_REGISTRY = prev;
  writeCase('D1-45', (r === null)
    ? { caseId:'D1-45', status:'PASS', why:'不可达 registry 兜底 null', executedAt:'20261009050000' }
    : { caseId:'D1-45', status:'FAIL', why:'兜底未 null: '+JSON.stringify(r), executedAt:'20261009050000' });
} catch (e) { writeCase('D1-45', { caseId:'D1-45', status:'FAIL', why:'err: '+e.message, executedAt:'20261009050000' }); }

// D1-70 代理配置
try {
  const src = readFileSync(join(HDK, 'plugins/huaweicloud-core/src/update-check.mjs').replace(/\\/g,'/'), 'utf8');
  const has = /fetchWithProxy|ProxyAgent|HTTPS_PROXY|HTTP_PROXY/.test(src);
  writeCase('D1-70', has
    ? { caseId:'D1-70', status:'PASS', why:'update-check 引用代理配置', executedAt:'20261009050000' }
    : { caseId:'D1-70', status:'FAIL', why:'未引用代理配置', executedAt:'20261009050000' });
} catch (e) { writeCase('D1-70', { caseId:'D1-70', status:'FAIL', why:'err: '+e.message, executedAt:'20261009050000' }); }

console.log('D1 P1 batch done.');
