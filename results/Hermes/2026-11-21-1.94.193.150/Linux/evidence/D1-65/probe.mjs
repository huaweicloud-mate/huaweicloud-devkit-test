import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CORE = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const read = (f) => readFileSync(f, 'utf8');

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 500) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}

// ===== D1-65 DEBUG 环境变量 =====
console.log('\n=====CASE D1-65=====');
{
  const uc = read(SRC + '/update-check.mjs');
  const tm = read(SRC + '/telemetry/telemetry.mjs');
  const ucLine = uc.split('\n').map((l) => l.trim()).find((l) => l.includes('HUAWEICLOUD_DEVKIT_DEBUG'));
  const tmLine = tm.split('\n').map((l) => l.trim()).find((l) => l.includes('HUAWEICLOUD_DEVKIT_DEBUG'));
  console.log('update-check.mjs DEBUG 判断: ' + ucLine);
  console.log('telemetry.mjs DEBUG 判断: ' + tmLine);
  const ucOk1 = /===\s*'1'/.test(ucLine);
  const ucOkTrue = /===\s*'true'/.test(ucLine);
  const tmOk = /===\s*'true'/.test(tmLine);
  const tmOk1 = /===\s*'1'/.test(tmLine);
  console.log(`断言: update-check '1'=${ucOk1} 'true'=${ucOkTrue}; telemetry 'true'=${tmOk} '1'=${tmOk1}`);
  check('D1-65 调试开关(更新检查域支持 1/true)', ucOk1 && ucOkTrue, ucLine);
  // 期望 DEBUG===1/true 都开启；telemetry 仅 'true' —— 组件间不一致（潜在 SPEC-MISMATCH）
  check('D1-65 调试开关(遥测域支持 true)', tmOk, tmLine);
  console.log('备注: 未设/其他值不开启 — 源码为 === ' + "'true'" + ' / ' + "'1'||'true'" + ' 严格比较，未设或 off/其他值均不开启');
}
console.log('=====END D1-65=====');

// ===== D1-66 遥测开关与端点 =====
console.log('\n=====CASE D1-66=====');
{
  const tele = await import(pathToFileURL(SRC + '/telemetry/telemetry.mjs').href);
  const tm = read(SRC + '/telemetry/telemetry.mjs');
  const endpointLine = tm.split('\n').map((l) => l.trim()).find((l) => l.includes('DEFAULT_ENDPOINT ='));
  const getEndpointLine = tm.split('\n').map((l) => l.trim()).find((l) => l.includes('HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT || DEFAULT_ENDPOINT'));
  console.log('DEFAULT_ENDPOINT: ' + endpointLine);
  console.log('getEndpoint(): ' + getEndpointLine);
  const old = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  let allOk = true;
  for (const [v, exp] of [['off', false], ['on', true], ['', true]]) {
    process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = v;
    const got = tele.isTelemetryEnabled();
    const ok = got === exp;
    allOk = allOk && ok;
    console.log(`  TELEMETRY=${JSON.stringify(v)} -> ${got} (期望 ${exp}) ${ok ? 'OK' : 'FAIL'}`);
  }
  if (old === undefined) delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY; else process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = old;
  check('isTelemetryEnabled 三态 off/on/未设', allOk, 'off->false,on->true,未设->true');
  check('getEndpoint 未设回退 DEFAULT_ENDPOINT', /HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT \|\| DEFAULT_ENDPOINT/.test(getEndpointLine), getEndpointLine);
}
console.log('=====END D1-66=====');

// ===== D1-67 Agent toolkit 模式 + DSH 跳过安装 =====
console.log('\n=====CASE D1-67=====');
{
  const sc = read(SRC + '/setup-cli.mjs');
  const mg = read(SRC + '/mcp-config-merge.mjs');
  const toolkitLines = sc.split('\n').map((l) => l.trim()).filter((l) => l.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE'));
  const skipLines = sc.split('\n').map((l) => l.trim()).filter((l) => l.includes('HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL'));
  const reqEnvLine = mg.split('\n').map((l) => l.trim()).find((l) => l.includes('REQUIRED_ENV_KEYS ='));
  console.log('setup-cli AGENT_TOOLKIT_MODE 注入点(前3):');
  toolkitLines.slice(0, 3).forEach((l) => console.log('  ' + l));
  console.log('setup-cli SKIP_DSH 分支:');
  skipLines.forEach((l) => console.log('  ' + l));
  console.log('mcp-config-merge REQUIRED_ENV_KEYS: ' + reqEnvLine);
  const toolkitOk = toolkitLines.some((l) => l.includes("value: 'local'") || l.includes(": 'local'") || l.includes('= "local"') || l.includes(': local'));
  const skipOk = skipLines.some((l) => l.includes("=== '1'"));
  const reqEnvOk = /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(reqEnvLine) && /HCLOUD_BIN/.test(reqEnvLine);
  check('AGENT_TOOLKIT_MODE 注入 agent env(local)', toolkitOk, toolkitLines[0] || '');
  check('SKIP_DSH=1 跳过 DSH 插件安装', skipOk, skipLines[0] || '');
  check('REQUIRED_ENV_KEYS 含 HCLOUD_BIN', reqEnvOk, reqEnvLine);
}
console.log('=====END D1-67=====');

// ===== D1-68 图标离线 + 区域环境变量 =====
console.log('\n=====CASE D1-68=====');
{
  const oldOffline = process.env.HUAWEICLOUD_ICONS_OFFLINE;
  process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
  const icon = await import(pathToFileURL(SRC + '/icon-library.mjs').href);
  icon.clearIconCache();
  const r = await icon.getServiceIcon('ecs');
  console.log('ICONS_OFFLINE=1 -> getServiceIcon source=' + r.source + ' ok=' + r.ok + ' count=' + r.count);
  if (oldOffline === undefined) delete process.env.HUAWEICLOUD_ICONS_OFFLINE; else process.env.HUAWEICLOUD_ICONS_OFFLINE = oldOffline;
  check('ICONS_OFFLINE=1 走本地 snapshot 不联网', r.ok === true && r.source === 'snapshot', 'source=' + r.source);
  const cred = read(SRC + '/auth/credentials.mjs');
  const regionLines = cred.split('\n').map((l) => l.trim()).filter((l) => /HUAWEICLOUD_REGION|HW_REGION/.test(l));
  console.log('credentials.mjs region 相关行:');
  regionLines.forEach((l) => console.log('  ' + l));
  const hasHuawei = cred.includes('HUAWEICLOUD_REGION');
  const hasHw = cred.includes('HW_REGION');
  check('HUAWEICLOUD_REGION/HW_REGION 均在默认 region 逻辑中', hasHuawei && hasHw, regionLines.join(' | '));
  // 优先级：HUAWEICLOUD_REGION 优先于 HW_REGION
  const priorityLine = regionLines.find((l) => l.includes('HUAWEICLOUD_REGION') && l.includes('HW_REGION'));
  console.log('优先级行: ' + (priorityLine || '(分散在多行，见上)'));
}
console.log('=====END D1-68=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));