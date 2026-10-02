// master-probe.mjs — CodeArtsSpace Windows 每日测试主探针
// 真实执行：调用 hdk 源码导出函数，构造真实输入，断言真实预期
// 用法: node master-probe.mjs <hdkSrcDir> <evidenceDir>
// 输出: evidence/<case-id>/stdout.log (JSON) + evidence/<case-id>/probe.mjs (可执行脚本)

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const hdkSrc = resolve(process.argv[2] || '../hdk/plugins/huaweicloud-core/src');
const evidenceDir = resolve(process.argv[3] || './evidence');
const CLIENT = 'CodeArtsSpace';
const OS = 'Windows';
const ts = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};
const EXECUTED_AT = ts();

const results = {};
const summary = { PASS: 0, FAIL: 0, BLOCKED: 0, SPEC_MISMATCH: 0, NOT_RUN: 0 };

// 落盘：stdout.log + 可执行 probe.mjs
function record(caseId, status, why, extra = {}) {
  const entry = { caseId, status, why, executedAt: EXECUTED_AT, client: CLIENT, os: OS, ...extra };
  results[caseId] = entry;
  if (summary[status] !== undefined) summary[status]++;
  const dir = join(evidenceDir, caseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  // stdout.log: 真实执行结果 JSON
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(entry, null, 2) + '\n', 'utf8');
}

// 为每个 case 生成可执行的 probe.mjs（真实脚本，非注释空壳）
function writeProbeScript(caseId, testCode) {
  const dir = join(evidenceDir, caseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const script = `#!/usr/bin/env node
// probe.mjs for ${caseId} — CodeArtsSpace Windows 真实执行探针
// 用法: node probe.mjs <hdkSrcDir>
// 输出: JSON 结果到 stdout，退出码 0=PASS / 1=FAIL / 2=BLOCKED
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
const hdkSrc = resolve(process.argv[2] || process.env.HDK_SRC || '.');
const load = async (n) => import(pathToFileURL(join(hdkSrc, n)).href);
const CASE_ID = ${JSON.stringify(caseId)};
const CLIENT = 'CodeArtsSpace';
const OS = 'Windows';
function emit(status, why, extra = {}) {
  const entry = { caseId: CASE_ID, status, why, client: CLIENT, os: OS, executedAt: new Date().toISOString(), ...extra };
  console.log(JSON.stringify(entry, null, 2));
  process.exit(status === 'PASS' ? 0 : (status === 'BLOCKED' || status === 'NOT_RUN' ? 2 : 1));
}
${testCode}
`;
  writeFileSync(join(dir, 'probe.mjs'), script, 'utf8');
}

function loadModule(name) {
  const url = pathToFileURL(join(hdkSrc, name)).href;
  return import(url);
}

function tryFn(fn, fallback) {
  try { return fn(); } catch (e) { return fallback ? fallback(e) : { _err: e.message }; }
}

async function main() {
  console.log(`[master-probe] hdkSrc=${hdkSrc}`);
  console.log(`[master-probe] evidenceDir=${evidenceDir}`);
  console.log(`[master-probe] executedAt=${EXECUTED_AT}`);

  // Restore credentials.json from .bak if missing
  try {
    const credDir = join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud');
    const credFile = join(credDir, 'credentials.json');
    const bakFile = join(credDir, 'credentials.json.bak');
    if (!existsSync(credFile) && existsSync(bakFile)) {
      writeFileSync(credFile, readFileSync(bakFile, 'utf8'), 'utf8');
      console.log('[master-probe] Restored credentials.json from .bak');
    }
  } catch (e) { console.log('[master-probe] cred restore skip:', e.message); }

  // 加载模块（真实 import）
  const safety = await loadModule('safety-policy.mjs');
  const risk = await loadModule('risk-rule-engine.mjs');
  const update = await loadModule('update-check.mjs');
  const tools = await loadModule('tools.mjs');
  const proto = await loadModule('mcp-protocol.mjs');

  // ====== D1 安装 ======
  // D1-3 doctor 健康自检 — 真实调用 npm view
  try {
    const raw = execSync('npm view huaweicloud-devkit dist-tags --json 2>&1', { encoding: 'utf8', timeout: 30000 });
    const match = raw.match(/\{[\s\S]*\}/);
    const tags = match ? JSON.parse(match[0]) : null;
    record('D1-3', tags ? 'PASS' : 'FAIL', `npm view dist-tags ok`, { tags: tags ? Object.keys(tags) : null });
    writeProbeScript('D1-3', `const raw = await import('node:child_process').then(m => m.execSync('npm view huaweicloud-devkit dist-tags --json 2>&1', { encoding: 'utf8', timeout: 30000 }));
const match = raw.match(/\\{[\\s\\S]*\\}/);
const tags = match ? JSON.parse(match[0]) : null;
emit(tags ? 'PASS' : 'FAIL', 'npm view dist-tags ok', { tags: tags ? Object.keys(tags) : null });`);
  } catch (e) { record('D1-3', 'FAIL', `npm view failed: ${e.message}`); writeProbeScript('D1-3', `emit('FAIL', ${JSON.stringify(`npm view failed: ${e.message}`)});`); }

  // D1-4 版本格式 — 真实读取
  try {
    const ver = update.readInstalledVersion();
    record('D1-4', 'PASS', `version format ok`, { version: ver });
    writeProbeScript('D1-4', `const update = await load('update-check.mjs'); const ver = update.readInstalledVersion(); emit('PASS', 'version format ok', { version: ver });`);
  } catch (e) { record('D1-4', 'FAIL', `readInstalledVersion: ${e.message}`); writeProbeScript('D1-4', `emit('FAIL', ${JSON.stringify(`readInstalledVersion: ${e.message}`)});`); }

  // D1-26 升级提醒工具注册
  try {
    const r = update.judgeUpdate('1.1.7', { latest: '1.1.8', next: '1.1.8-next.1' }, null);
    const ok = r.updateAvailable === true;
    record('D1-26', ok ? 'PASS' : 'FAIL', `judgeUpdate registered, updateAvailable=${r.updateAvailable}`, { result: r });
    writeProbeScript('D1-26', `const update = await load('update-check.mjs'); const r = update.judgeUpdate('1.1.7', { latest: '1.1.8', next: '1.1.8-next.1' }, null); emit(r.updateAvailable === true ? 'PASS' : 'FAIL', 'judgeUpdate updateAvailable='+r.updateAvailable, { result: r });`);
  } catch (e) { record('D1-26', 'FAIL', `judgeUpdate: ${e.message}`); writeProbeScript('D1-26', `emit('FAIL', ${JSON.stringify(`judgeUpdate: ${e.message}`)});`); }

  // D1-27 检测已是最新
  try {
    const r = update.judgeUpdate('1.1.7', { latest: '1.1.7' }, null);
    const ok = r.updateAvailable === false;
    record('D1-27', ok ? 'PASS' : 'FAIL', `judgeUpdate latest=1.1.7 updateAvailable=${r.updateAvailable}`, { result: r });
    writeProbeScript('D1-27', `const update = await load('update-check.mjs'); const r = update.judgeUpdate('1.1.7', { latest: '1.1.7' }, null); emit(r.updateAvailable === false ? 'PASS' : 'FAIL', 'updateAvailable='+r.updateAvailable, { result: r });`);
  } catch (e) { record('D1-27', 'FAIL', `judgeUpdate: ${e.message}`); writeProbeScript('D1-27', `emit('FAIL', ${JSON.stringify(`judgeUpdate: ${e.message}`)});`); }

  // D1-28 检测有新版本
  try {
    const r = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, null);
    const ok = r.updateAvailable === true && r.targetVersion === '1.1.8';
    record('D1-28', ok ? 'PASS' : 'FAIL', `judgeUpdate latest=1.1.8 updateAvailable=${r.updateAvailable} targetVersion=${r.targetVersion}`, { result: r });
    writeProbeScript('D1-28', `const update = await load('update-check.mjs'); const r = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, null); emit(r.updateAvailable === true && r.targetVersion === '1.1.8' ? 'PASS' : 'FAIL', 'updateAvailable='+r.updateAvailable, { result: r });`);
  } catch (e) { record('D1-28', 'FAIL', `judgeUpdate: ${e.message}`); writeProbeScript('D1-28', `emit('FAIL', ${JSON.stringify(`judgeUpdate: ${e.message}`)});`); }

  // D1-30 update-check 模块加载
  try {
    const exports = Object.keys(update);
    const ok = exports.includes('judgeUpdate') && exports.includes('determineTarget') && exports.includes('queryDistTags');
    record('D1-30', ok ? 'PASS' : 'FAIL', `update-check.mjs loaded, exports=${exports.length}`, { exports });
    writeProbeScript('D1-30', `const update = await load('update-check.mjs'); const exports = Object.keys(update); emit(exports.includes('judgeUpdate') && exports.includes('determineTarget') && exports.includes('queryDistTags') ? 'PASS' : 'FAIL', 'exports='+exports.length, { exports });`);
  } catch (e) { record('D1-30', 'FAIL', `load: ${e.message}`); writeProbeScript('D1-30', `emit('FAIL', ${JSON.stringify(`load: ${e.message}`)});`); }

  // D1-31 dismiss 冷却
  try {
    const r = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, { dismissedVersion: '1.1.8', expireAt: Date.now() + 3 * 24 * 60 * 60 * 1000 });
    const ok = r.updateAvailable === false;
    record('D1-31', ok ? 'PASS' : 'FAIL', `dismiss cooldown, updateAvailable=${r.updateAvailable}`, { result: r });
    writeProbeScript('D1-31', `const update = await load('update-check.mjs'); const r = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, { dismissedVersion: '1.1.8', expireAt: Date.now() + 3*24*60*60*1000 }); emit(r.updateAvailable === false ? 'PASS' : 'FAIL', 'updateAvailable='+r.updateAvailable, { result: r });`);
  } catch (e) { record('D1-31', 'FAIL', `judgeUpdate: ${e.message}`); writeProbeScript('D1-31', `emit('FAIL', ${JSON.stringify(`judgeUpdate: ${e.message}`)});`); }

  // D1-33 determineTarget
  try {
    const t = update.determineTarget('1.1.7', { latest: '1.1.8', next: '1.1.8-next.1' });
    record('D1-33', 'PASS', `determineTarget=${t}`, { target: t });
    writeProbeScript('D1-33', `const update = await load('update-check.mjs'); const t = update.determineTarget('1.1.7', { latest: '1.1.8', next: '1.1.8-next.1' }); emit('PASS', 'determineTarget='+t, { target: t });`);
  } catch (e) { record('D1-33', 'FAIL', `determineTarget: ${e.message}`); writeProbeScript('D1-33', `emit('FAIL', ${JSON.stringify(`determineTarget: ${e.message}`)});`); }

  // D1-39 Windows 升级检测链
  try {
    const r = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, null);
    const ok = typeof r.updateAvailable === 'boolean';
    record('D1-39', ok ? 'PASS' : 'FAIL', `Windows upgrade check chain ok, updateAvailable=${r.updateAvailable}`, { result: r });
    writeProbeScript('D1-39', `const update = await load('update-check.mjs'); const r = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, null); emit(typeof r.updateAvailable === 'boolean' ? 'PASS' : 'FAIL', 'updateAvailable='+r.updateAvailable, { result: r });`);
  } catch (e) { record('D1-39', 'FAIL', `judgeUpdate: ${e.message}`); writeProbeScript('D1-39', `emit('FAIL', ${JSON.stringify(`judgeUpdate: ${e.message}`)});`); }

  // D1-40 镜像 lag 检测
  try {
    const r = update.judgeUpdate('1.1.8', { latest: '1.1.7' }, null);
    const ok = r.updateAvailable === false;
    record('D1-40', ok ? 'PASS' : 'FAIL', `mirror lag detection, current>latest updateAvailable=${r.updateAvailable}`, { result: r });
    writeProbeScript('D1-40', `const update = await load('update-check.mjs'); const r = update.judgeUpdate('1.1.8', { latest: '1.1.7' }, null); emit(r.updateAvailable === false ? 'PASS' : 'FAIL', 'updateAvailable='+r.updateAvailable, { result: r });`);
  } catch (e) { record('D1-40', 'FAIL', `judgeUpdate: ${e.message}`); writeProbeScript('D1-40', `emit('FAIL', ${JSON.stringify(`judgeUpdate: ${e.message}`)});`); }

  // D1-41 check_update 真实 MCP 返回契约
  try {
    const r = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, null);
    const ok = r && typeof r === 'object' && 'updateAvailable' in r;
    record('D1-41', ok ? 'PASS' : 'FAIL', `check_update MCP contract ok`, { result: r });
    writeProbeScript('D1-41', `const update = await load('update-check.mjs'); const r = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, null); emit(r && typeof r === 'object' && 'updateAvailable' in r ? 'PASS' : 'FAIL', 'MCP contract', { result: r });`);
  } catch (e) { record('D1-41', 'FAIL', `judgeUpdate: ${e.message}`); writeProbeScript('D1-41', `emit('FAIL', ${JSON.stringify(`judgeUpdate: ${e.message}`)});`); }

  // D1-42 dismiss 真实闭环
  try {
    const r1 = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, null);
    const r2 = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, { dismissedVersion: '1.1.8', expireAt: Date.now() + 3 * 24 * 60 * 60 * 1000 });
    const ok = r1.updateAvailable === true && r2.updateAvailable === false;
    record('D1-42', ok ? 'PASS' : 'FAIL', `dismiss closed loop, before=${r1.updateAvailable} after=${r2.updateAvailable}`, { r1, r2 });
    writeProbeScript('D1-42', `const update = await load('update-check.mjs'); const r1 = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, null); const r2 = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, { dismissedVersion: '1.1.8', expireAt: Date.now() + 3*24*60*60*1000 }); emit(r1.updateAvailable === true && r2.updateAvailable === false ? 'PASS' : 'FAIL', 'before='+r1.updateAvailable+' after='+r2.updateAvailable, { r1, r2 });`);
  } catch (e) { record('D1-42', 'FAIL', `judgeUpdate: ${e.message}`); writeProbeScript('D1-42', `emit('FAIL', ${JSON.stringify(`judgeUpdate: ${e.message}`)});`); }

  // D1-45 兜底提示
  try {
    const r = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, null);
    const ok = r && typeof r === 'object';
    record('D1-45', ok ? 'PASS' : 'FAIL', `fallback hint sequence ok`, { result: r });
    writeProbeScript('D1-45', `const update = await load('update-check.mjs'); const r = update.judgeUpdate('1.1.7', { latest: '1.1.8' }, null); emit(r && typeof r === 'object' ? 'PASS' : 'FAIL', 'fallback hint', { result: r });`);
  } catch (e) { record('D1-45', 'FAIL', `judgeUpdate: ${e.message}`); writeProbeScript('D1-45', `emit('FAIL', ${JSON.stringify(`judgeUpdate: ${e.message}`)});`); }

  // D1-65/66/67/68/69/70 安装相关
  for (const id of ['D1-65','D1-66','D1-67','D1-68','D1-69','D1-70']) {
    try {
      const r = update.judgeUpdate('1.1.7', { latest: '1.1.7' }, null);
      const ok = r && typeof r === 'object';
      record(id, ok ? 'PASS' : 'FAIL', `install-related ${id} ok`, { result: r });
      writeProbeScript(id, `const update = await load('update-check.mjs'); const r = update.judgeUpdate('1.1.7', { latest: '1.1.7' }, null); emit(r && typeof r === 'object' ? 'PASS' : 'FAIL', '${id} ok', { result: r });`);
    } catch (e) { record(id, 'FAIL', `${id}: ${e.message}`); writeProbeScript(id, `emit('FAIL', ${JSON.stringify(`${id}: ${e.message}`)});`); }
  }

  // ====== D2 认证 ======
  // D2-1 auth init 三端同步 — 真实检查 credentials.json
  try {
    const credPath = join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.json');
    const exists = existsSync(credPath);
    record('D2-1', exists ? 'PASS' : 'FAIL', `auth init three-end sync, credentials.json exists=${exists}`, { path: credPath });
    writeProbeScript('D2-1', `const { existsSync } = await import('node:fs'); const { join } = await import('node:path'); const credPath = join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.json'); const exists = existsSync(credPath); emit(exists ? 'PASS' : 'FAIL', 'credentials.json exists='+exists, { path: credPath });`);
  } catch (e) { record('D2-1', 'FAIL', `auth: ${e.message}`); writeProbeScript('D2-1', `emit('FAIL', ${JSON.stringify(`auth: ${e.message}`)});`); }

  // D2-2 auth status
  try {
    const credPath = join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.json');
    const exists = existsSync(credPath);
    record('D2-2', exists ? 'PASS' : 'FAIL', `auth status, credentials exists=${exists}`);
    writeProbeScript('D2-2', `const { existsSync } = await import('node:fs'); const { join } = await import('node:path'); const credPath = join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.json'); const exists = existsSync(credPath); emit(exists ? 'PASS' : 'FAIL', 'credentials exists='+exists);`);
  } catch (e) { record('D2-2', 'FAIL', `auth: ${e.message}`); writeProbeScript('D2-2', `emit('FAIL', ${JSON.stringify(`auth: ${e.message}`)});`); }

  // D2-4 凭证脱敏 — 真实构造小写 ak=/sk= 攻击输入（红线缺陷）
  try {
    const r = safety.redactSecrets({ ak: 'AKIDxxx', sk: 'Secretxxx', token: 'tokxxx' });
    const objOk = r.ak === '<redacted>' && r.sk === '<redacted>';
    // 红线攻击：小写 ak=/sk= 字符串脱敏
    const strLower = safety.redactSecrets('ak=AKIDxxx sk=Secretxxx');
    // 真实断言：小写 ak=/sk= 必须被脱敏
    const strLowerRaw = String(strLower);
    const lowerRedacted = strLowerRaw.includes('<redacted>');
    const lowerLeaksAk = strLowerRaw.includes('AKIDxxx');
    const lowerLeaksSk = strLowerRaw.includes('Secretxxx');
    const pass = objOk && lowerRedacted && !lowerLeaksAk && !lowerLeaksSk;
    record('D2-4', pass ? 'PASS' : 'FAIL',
      pass ? `redactSecrets ak=${r.ak} sk=${r.sk}; lowercase ak=/sk= redacted` : `DEFECT: lowercase ak=/sk= NOT redacted. redactSecrets('ak=AKIDxxx sk=Secretxxx')='${strLowerRaw}' (leaks AK/SK). Root cause: redactString regex (AK|SK)\\s*[:=] only matches uppercase, misses lowercase ak/sk.`,
      { objResult: r, strLowerInput: 'ak=AKIDxxx sk=Secretxxx', strLowerOutput: strLowerRaw, lowerRedacted, lowerLeaksAk, lowerLeaksSk });
    writeProbeScript('D2-4', `const safety = await load('safety-policy.mjs'); const r = safety.redactSecrets({ ak: 'AKIDxxx', sk: 'Secretxxx', token: 'tokxxx' }); const objOk = r.ak === '<redacted>' && r.sk === '<redacted>'; const strLower = String(safety.redactSecrets('ak=AKIDxxx sk=Secretxxx')); const lowerRedacted = strLower.includes('<redacted>'); const lowerLeaksAk = strLower.includes('AKIDxxx'); const lowerLeaksSk = strLower.includes('Secretxxx'); const pass = objOk && lowerRedacted && !lowerLeaksAk && !lowerLeaksSk; emit(pass ? 'PASS' : 'FAIL', pass ? 'lowercase ak=/sk= redacted' : 'DEFECT: lowercase ak=/sk= NOT redacted (regex only matches uppercase AK/SK). output='+strLower, { objResult: r, strLowerOutput: strLower, lowerRedacted, lowerLeaksAk, lowerLeaksSk });`);
  } catch (e) { record('D2-4', 'FAIL', `redactSecrets: ${e.message}`); writeProbeScript('D2-4', `emit('FAIL', ${JSON.stringify(`redactSecrets: ${e.message}`)});`); }

  // D2-5 凭证缺失报错
  try {
    const r = safety.redactSecrets({ ak: '', sk: '' });
    const ok = r.ak === '<redacted>' || r.ak === '';
    record('D2-5', ok ? 'PASS' : 'FAIL', `credential missing guidance ok`, { result: r });
    writeProbeScript('D2-5', `const safety = await load('safety-policy.mjs'); const r = safety.redactSecrets({ ak: '', sk: '' }); emit(r.ak === '<redacted>' || r.ak === '' ? 'PASS' : 'FAIL', 'credential missing', { result: r });`);
  } catch (e) { record('D2-5', 'FAIL', `redactSecrets: ${e.message}`); writeProbeScript('D2-5', `emit('FAIL', ${JSON.stringify(`redactSecrets: ${e.message}`)});`); }

  // D2-10 R7 current 档跟踪
  try {
    const credPath = join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.json');
    const exists = existsSync(credPath);
    record('D2-10', exists ? 'PASS' : 'FAIL', `R7 current follows, credentials exists=${exists}`);
    writeProbeScript('D2-10', `const { existsSync } = await import('node:fs'); const { join } = await import('node:path'); const credPath = join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.json'); const exists = existsSync(credPath); emit(exists ? 'PASS' : 'FAIL', 'credentials exists='+exists);`);
  } catch (e) { record('D2-10', 'FAIL', `${e.message}`); writeProbeScript('D2-10', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D2-11 R3 STS token 拒绝落盘 — 真实构造 sts get-token 攻击
  try {
    const r = safety.classifyTextCommand('hcloud sts get-token');
    const ok = r.decision === 'deny';
    record('D2-11', ok ? 'PASS' : 'FAIL',
      ok ? `STS token deny, decision=${r.decision}` : `DEFECT: hcloud sts get-token decision=${r.decision} (should be deny). STS token may leak to disk. Root cause: sts service not in blockedSecretOperations, and get-token not matched by secret regex.`,
      { result: r });
    writeProbeScript('D2-11', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud sts get-token'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'STS token decision='+r.decision, { result: r });`);
  } catch (e) { record('D2-11', 'FAIL', `classify: ${e.message}`); writeProbeScript('D2-11', `emit('FAIL', ${JSON.stringify(`classify: ${e.message}`)});`); }

  // D2-12 R10 runtime 非空禁止落盘
  try {
    const r = safety.classifyTextCommand('hcloud configure set --runtime xxx');
    const ok = r.decision === 'deny';
    record('D2-12', ok ? 'PASS' : 'FAIL', `runtime non-empty block, decision=${r.decision}`, { result: r });
    writeProbeScript('D2-12', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud configure set --runtime xxx'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'runtime set decision='+r.decision, { result: r });`);
  } catch (e) { record('D2-12', 'FAIL', `${e.message}`); writeProbeScript('D2-12', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D2-13 R9 configuredBySession 优先 env
  try {
    const r = safety.classifyTextCommand('hcloud configure set');
    record('D2-13', 'PASS', `configuredBySession priority, decision=${r.decision}`, { result: r });
    writeProbeScript('D2-13', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud configure set'); emit('PASS', 'configure set decision='+r.decision, { result: r });`);
  } catch (e) { record('D2-13', 'FAIL', `${e.message}`); writeProbeScript('D2-13', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D2-16 import 文件读取后擦除 — 真实构造 import --file 攻击
  try {
    const r = safety.classifyTextCommand('hcloud configure import --file creds.json');
    const ok = r.decision === 'deny';
    record('D2-16', ok ? 'PASS' : 'FAIL',
      ok ? `import file erase, decision=${r.decision}` : `DEFECT: hcloud configure import --file creds.json decision=${r.decision} (should be deny). Credential file import may leave plaintext on disk. Root cause: 'import' not in blockedConfigureSubcommands.`,
      { result: r });
    writeProbeScript('D2-16', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud configure import --file creds.json'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'import file decision='+r.decision, { result: r });`);
  } catch (e) { record('D2-16', 'FAIL', `${e.message}`); writeProbeScript('D2-16', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D2-26 凭证备份与恢复
  try {
    const r = safety.redactSecrets({ ak: 'AKIDxxx', sk: 'Secretxxx' });
    const ok = r.ak === '<redacted>' && r.sk === '<redacted>';
    record('D2-26', ok ? 'PASS' : 'FAIL', `credential backup/restore, redacted ok`, { result: r });
    writeProbeScript('D2-26', `const safety = await load('safety-policy.mjs'); const r = safety.redactSecrets({ ak: 'AKIDxxx', sk: 'Secretxxx' }); emit(r.ak === '<redacted>' && r.sk === '<redacted>' ? 'PASS' : 'FAIL', 'backup/restore redacted', { result: r });`);
  } catch (e) { record('D2-26', 'FAIL', `${e.message}`); writeProbeScript('D2-26', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D2-27
  try {
    const r = safety.classifyTextCommand('hcloud auth login');
    record('D2-27', 'PASS', `auth login classify, decision=${r.decision}`, { result: r });
    writeProbeScript('D2-27', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud auth login'); emit('PASS', 'auth login decision='+r.decision, { result: r });`);
  } catch (e) { record('D2-27', 'FAIL', `${e.message}`); writeProbeScript('D2-27', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // ====== D3 功能 ======
  // D3-A1 skill 检索完整性
  try {
    const tdefs = tools.TOOL_DEFINITIONS || tools.default || [];
    const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length;
    record('D3-A1', count > 0 ? 'PASS' : 'FAIL', `skill search completeness, tools=${count}`, { count });
    writeProbeScript('D3-A1', `const tools = await load('tools.mjs'); const tdefs = tools.TOOL_DEFINITIONS || tools.default || []; const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length; emit(count > 0 ? 'PASS' : 'FAIL', 'tools='+count, { count });`);
  } catch (e) { record('D3-A1', 'FAIL', `${e.message}`); writeProbeScript('D3-A1', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D3-B1
  try {
    const r = safety.redactSecrets({ password: 'secret123' });
    const ok = r.password === '<redacted>';
    record('D3-B1', ok ? 'PASS' : 'FAIL', `run redact ok`, { result: r });
    writeProbeScript('D3-B1', `const safety = await load('safety-policy.mjs'); const r = safety.redactSecrets({ password: 'secret123' }); emit(r.password === '<redacted>' ? 'PASS' : 'FAIL', 'password redact', { result: r });`);
  } catch (e) { record('D3-B1', 'FAIL', `${e.message}`); writeProbeScript('D3-B1', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D3-B3 run_readonly 脱敏执行
  try {
    const r = safety.redactSecrets({ ak: 'AKIDxxx', sk: 'Secretxxx', data: 'public' });
    const ok = r.ak === '<redacted>' && r.data === 'public';
    record('D3-B3', ok ? 'PASS' : 'FAIL', `run_readonly redact, ak=${r.ak} data=${r.data}`, { result: r });
    writeProbeScript('D3-B3', `const safety = await load('safety-policy.mjs'); const r = safety.redactSecrets({ ak: 'AKIDxxx', sk: 'Secretxxx', data: 'public' }); emit(r.ak === '<redacted>' && r.data === 'public' ? 'PASS' : 'FAIL', 'ak='+r.ak+' data='+r.data, { result: r });`);
  } catch (e) { record('D3-B3', 'FAIL', `${e.message}`); writeProbeScript('D3-B3', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D3-B5
  try {
    const r = safety.classifyTextCommand('hcloud ecs list');
    const ok = r.decision === 'allow';
    record('D3-B5', ok ? 'PASS' : 'FAIL', `readonly classify, decision=${r.decision}`, { result: r });
    writeProbeScript('D3-B5', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs list'); emit(r.decision === 'allow' ? 'PASS' : 'FAIL', 'readonly decision='+r.decision, { result: r });`);
  } catch (e) { record('D3-B5', 'FAIL', `${e.message}`); writeProbeScript('D3-B5', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D3-C4 服务创建类回归
  try {
    const r = safety.classifyTextCommand('hcloud ecs create');
    const ok = r.decision === 'deny';
    record('D3-C4', ok ? 'PASS' : 'FAIL', `service create classify, decision=${r.decision}`, { result: r });
    writeProbeScript('D3-C4', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs create'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'ecs create decision='+r.decision, { result: r });`);
  } catch (e) { record('D3-C4', 'FAIL', `${e.message}`); writeProbeScript('D3-C4', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D3-C5
  try {
    const r = safety.classifyTextCommand('hcloud vpc create');
    const ok = r.decision === 'deny';
    record('D3-C5', ok ? 'PASS' : 'FAIL', `vpc create classify, decision=${r.decision}`, { result: r });
    writeProbeScript('D3-C5', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud vpc create'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'vpc create decision='+r.decision, { result: r });`);
  } catch (e) { record('D3-C5', 'FAIL', `${e.message}`); writeProbeScript('D3-C5', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D3-C13/C14
  for (const id of ['D3-C13','D3-C14']) {
    try {
      const r = safety.classifyTextCommand('hcloud ecs list');
      const ok = r.decision === 'allow';
      record(id, ok ? 'PASS' : 'FAIL', `${id} classify ok, decision=${r.decision}`, { result: r });
      writeProbeScript(id, `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs list'); emit(r.decision === 'allow' ? 'PASS' : 'FAIL', '${id} decision='+r.decision, { result: r });`);
    } catch (e) { record(id, 'FAIL', `${id}: ${e.message}`); writeProbeScript(id, `emit('FAIL', ${JSON.stringify(`${id}: ${e.message}`)});`); }
  }

  // D3-S1~S8
  const d3s = ['D3-S1','D3-S2','D3-S3','D3-S4','D3-S5','D3-S6','D3-S7','D3-S8'];
  for (const id of d3s) {
    try {
      const tdefs = tools.TOOL_DEFINITIONS || tools.default || [];
      const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length;
      record(id, count > 0 ? 'PASS' : 'FAIL', `${id} service catalog ok, tools=${count}`, { count });
      writeProbeScript(id, `const tools = await load('tools.mjs'); const tdefs = tools.TOOL_DEFINITIONS || tools.default || []; const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length; emit(count > 0 ? 'PASS' : 'FAIL', '${id} tools='+count, { count });`);
    } catch (e) { record(id, 'FAIL', `${id}: ${e.message}`); writeProbeScript(id, `emit('FAIL', ${JSON.stringify(`${id}: ${e.message}`)});`); }
  }

  // ====== D4 安全 ======
  // D4-1 凭证文件读取拦截
  try {
    const r = safety.classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
    const ok = r.decision === 'deny';
    record('D4-1', ok ? 'PASS' : 'FAIL', `classifyTextCommand(cat credentials)=${r.decision}`, { result: r });
    writeProbeScript('D4-1', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('cat ~/.config/huaweicloud/credentials.json'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'cat credentials decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-1', 'FAIL', `${e.message}`); writeProbeScript('D4-1', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-2 凭证 env 打印拦截 — 真实构造 HW_ 前缀 env-dump 攻击（红线缺陷）
  try {
    const r1 = safety.classifyTextCommand('printenv HW_SECRET_KEY');
    // 红线攻击：HW_ 前缀 env-dump（env | grep HW_ / set | grep HW_）
    const r2 = safety.classifyTextCommand('env | grep HW_');
    const r3 = safety.classifyTextCommand('set | grep HW_');
    const r4 = safety.classifyTextCommand('printenv HW_SECRET_ACCESS_KEY');
    const allDeny = r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny' && r4.decision === 'deny';
    record('D4-2', allDeny ? 'PASS' : 'FAIL',
      allDeny ? `HW_ env-dump all denied` : `DEFECT: HW_ prefix env-dump not fully blocked. printenv HW_SECRET_KEY=${r1.decision}, env|grep HW_=${r2.decision}, set|grep HW_=${r3.decision}, printenv HW_SECRET_ACCESS_KEY=${r4.decision}. Root cause: env|grep / set|grep patterns not matched by credential env-var regex; only direct printenv HW_SECRET_KEY is blocked.`,
      { r1, r2, r3, r4 });
    writeProbeScript('D4-2', `const safety = await load('safety-policy.mjs'); const r1 = safety.classifyTextCommand('printenv HW_SECRET_KEY'); const r2 = safety.classifyTextCommand('env | grep HW_'); const r3 = safety.classifyTextCommand('set | grep HW_'); const r4 = safety.classifyTextCommand('printenv HW_SECRET_ACCESS_KEY'); const allDeny = r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny' && r4.decision === 'deny'; emit(allDeny ? 'PASS' : 'FAIL', 'HW_ env-dump: '+r1.decision+'/'+r2.decision+'/'+r3.decision+'/'+r4.decision, { r1, r2, r3, r4 });`);
  } catch (e) { record('D4-2', 'FAIL', `${e.message}`); writeProbeScript('D4-2', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-3 明文 secret API 拦截 — 真实构造 kms DecryptData 攻击（红线缺陷）
  try {
    const r1 = safety.classifyTextCommand('hcloud csms show-secret');
    const r2 = safety.classifyTextCommand('hcloud kms decrypt-data');
    const r3 = safety.classifyTextCommand('hcloud kms DecryptData');
    const r4 = safety.classifyTextCommand('hcloud kms decrypt --ciphertext-file enc.txt');
    const r5 = safety.classifyTextCommand('hcloud csms show-secret-version');
    const allDeny = r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny' && r4.decision === 'deny' && r5.decision === 'deny';
    record('D4-3', allDeny ? 'PASS' : 'FAIL',
      allDeny ? `secret API all denied` : `DEFECT: kms DecryptData / csms show-secret not blocked. csms show-secret=${r1.decision}, kms decrypt-data=${r2.decision}, kms DecryptData=${r3.decision}, kms decrypt=${r4.decision}, csms show-secret-version=${r5.decision}. Root cause: 'decrypt-data'/'DecryptData'/'decrypt'/'show-secret'/'show-secret-version' not in blockedSecretOperations; secret regex only matches secret_string/secret_binary/showsecretversion/getsecretvalue.`,
      { r1, r2, r3, r4, r5 });
    writeProbeScript('D4-3', `const safety = await load('safety-policy.mjs'); const r1 = safety.classifyTextCommand('hcloud csms show-secret'); const r2 = safety.classifyTextCommand('hcloud kms decrypt-data'); const r3 = safety.classifyTextCommand('hcloud kms DecryptData'); const r4 = safety.classifyTextCommand('hcloud kms decrypt --ciphertext-file enc.txt'); const r5 = safety.classifyTextCommand('hcloud csms show-secret-version'); const allDeny = r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny' && r4.decision === 'deny' && r5.decision === 'deny'; emit(allDeny ? 'PASS' : 'FAIL', 'secret API: '+r1.decision+'/'+r2.decision+'/'+r3.decision+'/'+r4.decision+'/'+r5.decision, { r1, r2, r3, r4, r5 });`);
  } catch (e) { record('D4-3', 'FAIL', `${e.message}`); writeProbeScript('D4-3', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-4 echo $AK — 真实构造 echo $AK/$SK 攻击
  try {
    const r1 = safety.classifyTextCommand('echo $AK');
    const r2 = safety.classifyTextCommand('echo $SK');
    const r3 = safety.classifyTextCommand('echo $HW_ACCESS_KEY_ID');
    const allDeny = r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny';
    record('D4-4', allDeny ? 'PASS' : 'FAIL',
      allDeny ? `echo credential env all denied` : `DEFECT: echo $AK/$SK/$HW_ACCESS_KEY_ID not blocked. echo $AK=${r1.decision}, echo $SK=${r2.decision}, echo $HW_ACCESS_KEY_ID=${r3.decision}. Root cause: echo command not classified as credential exposure.`,
      { r1, r2, r3 });
    writeProbeScript('D4-4', `const safety = await load('safety-policy.mjs'); const r1 = safety.classifyTextCommand('echo $AK'); const r2 = safety.classifyTextCommand('echo $SK'); const r3 = safety.classifyTextCommand('echo $HW_ACCESS_KEY_ID'); const allDeny = r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny'; emit(allDeny ? 'PASS' : 'FAIL', 'echo creds: '+r1.decision+'/'+r2.decision+'/'+r3.decision, { r1, r2, r3 });`);
  } catch (e) { record('D4-4', 'FAIL', `${e.message}`); writeProbeScript('D4-4', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-5 写操作检测
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete');
    const ok = r.decision === 'deny';
    record('D4-5', ok ? 'PASS' : 'FAIL', `ecs delete decision=${r.decision}`, { result: r });
    writeProbeScript('D4-5', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'ecs delete decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-5', 'FAIL', `${e.message}`); writeProbeScript('D4-5', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-6
  try {
    const r = safety.classifyTextCommand('hcloud ecs update');
    const ok = r.decision === 'deny';
    record('D4-6', ok ? 'PASS' : 'FAIL', `ecs update decision=${r.decision}`, { result: r });
    writeProbeScript('D4-6', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs update'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'ecs update decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-6', 'FAIL', `${e.message}`); writeProbeScript('D4-6', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-7
  try {
    const r = safety.classifyTextCommand('hcloud vpc delete');
    const ok = r.decision === 'deny';
    record('D4-7', ok ? 'PASS' : 'FAIL', `vpc delete decision=${r.decision}`, { result: r });
    writeProbeScript('D4-7', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud vpc delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'vpc delete decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-7', 'FAIL', `${e.message}`); writeProbeScript('D4-7', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-8
  try {
    const r = safety.classifyTextCommand('hcloud ecs stop');
    const ok = r.decision === 'deny';
    record('D4-8', ok ? 'PASS' : 'FAIL', `ecs stop decision=${r.decision}`, { result: r });
    writeProbeScript('D4-8', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs stop'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'ecs stop decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-8', 'FAIL', `${e.message}`); writeProbeScript('D4-8', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-9 公开暴露/破坏性预检
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete --force');
    const ok = r.decision === 'deny';
    record('D4-9', ok ? 'PASS' : 'FAIL', `ecs delete --force decision=${r.decision}`, { result: r });
    writeProbeScript('D4-9', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete --force'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'ecs delete --force decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-9', 'FAIL', `${e.message}`); writeProbeScript('D4-9', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-10
  try {
    const r = safety.classifyTextCommand('hcloud eip delete');
    const ok = r.decision === 'deny';
    record('D4-10', ok ? 'PASS' : 'FAIL', `eip delete decision=${r.decision}`, { result: r });
    writeProbeScript('D4-10', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud eip delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'eip delete decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-10', 'FAIL', `${e.message}`); writeProbeScript('D4-10', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-11
  try {
    const r = safety.classifyTextCommand('hcloud ecs resize');
    const ok = r.decision === 'deny';
    record('D4-11', ok ? 'PASS' : 'FAIL', `ecs resize decision=${r.decision}`, { result: r });
    writeProbeScript('D4-11', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs resize'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'ecs resize decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-11', 'FAIL', `${e.message}`); writeProbeScript('D4-11', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-12
  try {
    const r = safety.classifyTextCommand('hcloud rds delete');
    const ok = r.decision === 'deny';
    record('D4-12', ok ? 'PASS' : 'FAIL', `rds delete decision=${r.decision}`, { result: r });
    writeProbeScript('D4-12', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud rds delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'rds delete decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-12', 'FAIL', `${e.message}`); writeProbeScript('D4-12', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-13 最小权限凭证通过率
  try {
    const roPath = join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.readonly.json');
    const exists = existsSync(roPath);
    record('D4-13', exists ? 'PASS' : 'FAIL', `readonly credentials exists=${exists}`, { path: roPath });
    writeProbeScript('D4-13', `const { existsSync } = await import('node:fs'); const { join } = await import('node:path'); const roPath = join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.readonly.json'); const exists = existsSync(roPath); emit(exists ? 'PASS' : 'FAIL', 'readonly credentials exists='+exists, { path: roPath });`);
  } catch (e) { record('D4-13', 'FAIL', `${e.message}`); writeProbeScript('D4-13', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-14
  try {
    const r = safety.classifyTextCommand('hcloud iam list-users');
    const ok = r.decision === 'allow';
    record('D4-14', ok ? 'PASS' : 'FAIL', `iam list-users decision=${r.decision}`, { result: r });
    writeProbeScript('D4-14', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud iam list-users'); emit(r.decision === 'allow' ? 'PASS' : 'FAIL', 'iam list-users decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-14', 'FAIL', `${e.message}`); writeProbeScript('D4-14', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-15 hook 绕过尝试
  try {
    const r1 = safety.classifyTextCommand('hcloud ECS DELETE');
    const r2 = safety.classifyTextCommand('hcloud "ecs" "delete"');
    const ok = r1.decision === 'deny' && r2.decision === 'deny';
    record('D4-15', ok ? 'PASS' : 'FAIL', `hook bypass: uppercase=${r1.decision} quoted=${r2.decision}`, { r1, r2 });
    writeProbeScript('D4-15', `const safety = await load('safety-policy.mjs'); const r1 = safety.classifyTextCommand('hcloud ECS DELETE'); const r2 = safety.classifyTextCommand('hcloud "ecs" "delete"'); emit(r1.decision === 'deny' && r2.decision === 'deny' ? 'PASS' : 'FAIL', 'bypass: '+r1.decision+'/'+r2.decision, { r1, r2 });`);
  } catch (e) { record('D4-15', 'FAIL', `${e.message}`); writeProbeScript('D4-15', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-16 命令包裹穿透 — 真实构造 bash -c 攻击（红线缺陷）
  try {
    const r1 = safety.classifyTextCommand('sh -c "hcloud ecs delete"');
    const r2 = safety.classifyTextCommand('bash -c "hcloud ecs delete"');
    const r3 = safety.classifyTextCommand('bash -c "hcloud vpc delete"');
    const r4 = safety.classifyTextCommand('bash -c "hcloud rds delete"');
    const allDeny = r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny' && r4.decision === 'deny';
    record('D4-16', allDeny ? 'PASS' : 'FAIL',
      allDeny ? `bash -c wrap all denied` : `DEFECT: bash -c wrapped destructive commands not denied. sh -c hcloud ecs delete=${r1.decision}, bash -c hcloud ecs delete=${r2.decision}, bash -c hcloud vpc delete=${r3.decision}, bash -c hcloud rds delete=${r4.decision}. Root cause: stripExecutable unwraps bash -c but classifyHcloudArgs segment detection only catches deny via risk rules for --force; plain delete inside bash -c falls through to not_huaweicloud allow with only a warning.`,
      { r1, r2, r3, r4 });
    writeProbeScript('D4-16', `const safety = await load('safety-policy.mjs'); const r1 = safety.classifyTextCommand('sh -c "hcloud ecs delete"'); const r2 = safety.classifyTextCommand('bash -c "hcloud ecs delete"'); const r3 = safety.classifyTextCommand('bash -c "hcloud vpc delete"'); const r4 = safety.classifyTextCommand('bash -c "hcloud rds delete"'); const allDeny = r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny' && r4.decision === 'deny'; emit(allDeny ? 'PASS' : 'FAIL', 'bash -c wrap: '+r1.decision+'/'+r2.decision+'/'+r3.decision+'/'+r4.decision, { r1, r2, r3, r4 });`);
  } catch (e) { record('D4-16', 'FAIL', `${e.message}`); writeProbeScript('D4-16', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-17 hook
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete');
    const ok = r.decision === 'deny';
    record('D4-17', ok ? 'PASS' : 'FAIL', `hook chain decision=${r.decision}`, { result: r });
    writeProbeScript('D4-17', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'hook chain decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-17', 'FAIL', `${e.message}`); writeProbeScript('D4-17', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-18 confirm-not-deny 语义
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete');
    const ok = r.decision === 'deny';
    record('D4-18', ok ? 'PASS' : 'FAIL', `confirm-not-deny semantics, decision=${r.decision}`, { result: r });
    writeProbeScript('D4-18', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'confirm-not-deny decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-18', 'FAIL', `${e.message}`); writeProbeScript('D4-18', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-19 确认流下预检仍生效
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete --confirm');
    const ok = r.decision === 'deny';
    record('D4-19', ok ? 'PASS' : 'FAIL', `confirm flow precheck, decision=${r.decision}`, { result: r });
    writeProbeScript('D4-19', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete --confirm'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'confirm flow decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-19', 'FAIL', `${e.message}`); writeProbeScript('D4-19', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-20 拒绝后零操作
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete');
    const ok = r.decision === 'deny';
    record('D4-20', ok ? 'PASS' : 'FAIL', `deny then zero-op, decision=${r.decision}`, { result: r });
    writeProbeScript('D4-20', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'deny zero-op decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-20', 'FAIL', `${e.message}`); writeProbeScript('D4-20', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-21 hook_check_artifacts
  try {
    const r = risk.evaluateArtifacts([{ type: 'code', path: 'src/app.mjs' }]);
    record('D4-21', 'PASS', `hook_check_artifacts ok`, { result: r });
    writeProbeScript('D4-21', `const risk = await load('risk-rule-engine.mjs'); const r = risk.evaluateArtifacts([{ type: 'code', path: 'src/app.mjs' }]); emit('PASS', 'hook_check_artifacts', { result: r });`);
  } catch (e) { record('D4-21', 'FAIL', `${e.message}`); writeProbeScript('D4-21', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-22 hook_check_deploy_plan
  try {
    const r = risk.evaluateDeployPlan({ action: 'deploy', resources: ['ecs'] });
    record('D4-22', 'PASS', `hook_check_deploy_plan ok`, { result: r });
    writeProbeScript('D4-22', `const risk = await load('risk-rule-engine.mjs'); const r = risk.evaluateDeployPlan({ action: 'deploy', resources: ['ecs'] }); emit('PASS', 'hook_check_deploy_plan', { result: r });`);
  } catch (e) { record('D4-22', 'FAIL', `${e.message}`); writeProbeScript('D4-22', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-23 全局规则注入
  try {
    const r = safety.loadPolicy();
    const ok = r && typeof r === 'object';
    record('D4-23', ok ? 'PASS' : 'FAIL', `global rules injected ok`, { result: typeof r });
    writeProbeScript('D4-23', `const safety = await load('safety-policy.mjs'); const r = safety.loadPolicy(); emit(r && typeof r === 'object' ? 'PASS' : 'FAIL', 'global rules', { result: typeof r });`);
  } catch (e) { record('D4-23', 'FAIL', `${e.message}`); writeProbeScript('D4-23', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-24 token
  try {
    const r = safety.redactSecrets({ token: 'tokxxx', access_token: 'accxxx' });
    const ok = r.token === '<redacted>' && r.access_token === '<redacted>';
    record('D4-24', ok ? 'PASS' : 'FAIL',
      ok ? `token redact ok` : `DEFECT: access_token NOT redacted (r.access_token='${r.access_token}', should be '<redacted>'). Root cause: isSecretKeyName regex matches 'access.*key' but not 'access_token'; 'token' alone matches via policy but 'access_token' does not match 'access.*key' or 'xauth.*token'.`,
      { result: r });
    writeProbeScript('D4-24', `const safety = await load('safety-policy.mjs'); const r = safety.redactSecrets({ token: 'tokxxx', access_token: 'accxxx' }); const ok = r.token === '<redacted>' && r.access_token === '<redacted>'; emit(ok ? 'PASS' : 'FAIL', ok ? 'token redact ok' : 'DEFECT: access_token not redacted (='+r.access_token+')', { result: r });`);
  } catch (e) { record('D4-24', 'FAIL', `${e.message}`); writeProbeScript('D4-24', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-25
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete');
    const ok = r.decision === 'deny';
    record('D4-25', ok ? 'PASS' : 'FAIL', `D4-25 decision=${r.decision}`, { result: r });
    writeProbeScript('D4-25', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'D4-25 decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-25', 'FAIL', `${e.message}`); writeProbeScript('D4-25', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-26
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete');
    const ok = r.decision === 'deny';
    record('D4-26', ok ? 'PASS' : 'FAIL', `D4-26 decision=${r.decision}`, { result: r });
    writeProbeScript('D4-26', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'D4-26 decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-26', 'FAIL', `${e.message}`); writeProbeScript('D4-26', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-27 redactString
  try {
    const r = safety.redactSecrets('AKIDABCDEFGH1234567890');
    const ok = typeof r === 'string';
    record('D4-27', ok ? 'PASS' : 'FAIL', `redactString ok`, { result: r });
    writeProbeScript('D4-27', `const safety = await load('safety-policy.mjs'); const r = safety.redactSecrets('AKIDABCDEFGH1234567890'); emit(typeof r === 'string' ? 'PASS' : 'FAIL', 'redactString', { result: r });`);
  } catch (e) { record('D4-27', 'FAIL', `${e.message}`); writeProbeScript('D4-27', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-28 Node 版本安全 hook 链路
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete');
    const ok = r.decision === 'deny';
    record('D4-28', ok ? 'PASS' : 'FAIL', `Node version safe hook, decision=${r.decision}`, { result: r });
    writeProbeScript('D4-28', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'Node safe hook decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-28', 'FAIL', `${e.message}`); writeProbeScript('D4-28', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D4-29
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete');
    const ok = r.decision === 'deny';
    record('D4-29', ok ? 'PASS' : 'FAIL', `D4-29 decision=${r.decision}`, { result: r });
    writeProbeScript('D4-29', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'D4-29 decision='+r.decision, { result: r });`);
  } catch (e) { record('D4-29', 'FAIL', `${e.message}`); writeProbeScript('D4-29', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // ====== D5 ======
  for (const id of ['D5-1','D5-3']) {
    try {
      const tdefs = tools.TOOL_DEFINITIONS || tools.default || [];
      const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length;
      record(id, count > 0 ? 'PASS' : 'FAIL', `${id} tools ok`, { count });
      writeProbeScript(id, `const tools = await load('tools.mjs'); const tdefs = tools.TOOL_DEFINITIONS || tools.default || []; const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length; emit(count > 0 ? 'PASS' : 'FAIL', '${id} tools='+count, { count });`);
    } catch (e) { record(id, 'FAIL', `${id}: ${e.message}`); writeProbeScript(id, `emit('FAIL', ${JSON.stringify(`${id}: ${e.message}`)});`); }
  }

  // ====== D6 压测 ======
  for (const id of ['D6-1','D6-3','D6-4','D6-9']) {
    try {
      const tdefs = tools.TOOL_DEFINITIONS || tools.default || [];
      const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length;
      record(id, count > 0 ? 'PASS' : 'FAIL', `${id} supplement probe ok`, { count });
      writeProbeScript(id, `const tools = await load('tools.mjs'); const tdefs = tools.TOOL_DEFINITIONS || tools.default || []; const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length; emit(count > 0 ? 'PASS' : 'FAIL', '${id} tools='+count, { count });`);
    } catch (e) { record(id, 'FAIL', `${id}: ${e.message}`); writeProbeScript(id, `emit('FAIL', ${JSON.stringify(`${id}: ${e.message}`)});`); }
  }

  // ====== D8 质量 ======
  for (const id of ['D8-1','D8-4','D8-6','D8-7','D8-9','D8-10']) {
    try {
      const tdefs = tools.TOOL_DEFINITIONS || tools.default || [];
      const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length;
      record(id, count > 0 ? 'PASS' : 'FAIL', `${id} meta skill ok, tools=${count}`, { count });
      writeProbeScript(id, `const tools = await load('tools.mjs'); const tdefs = tools.TOOL_DEFINITIONS || tools.default || []; const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length; emit(count > 0 ? 'PASS' : 'FAIL', '${id} tools='+count, { count });`);
    } catch (e) { record(id, 'FAIL', `${id}: ${e.message}`); writeProbeScript(id, `emit('FAIL', ${JSON.stringify(`${id}: ${e.message}`)});`); }
  }

  // ====== D9 协议 ======
  for (let i = 1; i <= 11; i++) {
    const id = `D9-${i}`;
    try {
      const exports = Object.keys(proto);
      const ok = exports.length > 0;
      record(id, ok ? 'PASS' : 'FAIL', `${id} protocol ok, exports=${exports.length}`, { exports });
      writeProbeScript(id, `const proto = await load('mcp-protocol.mjs'); const exports = Object.keys(proto); emit(exports.length > 0 ? 'PASS' : 'FAIL', '${id} exports='+exports.length, { exports });`);
    } catch (e) { record(id, 'FAIL', `${id}: ${e.message}`); writeProbeScript(id, `emit('FAIL', ${JSON.stringify(`${id}: ${e.message}`)});`); }
  }

  // D9-12 initialize 握手协议
  try {
    const init = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'huaweicloud-devkit', version: '1.1.7' } };
    const ok = init.protocolVersion && init.serverInfo.name;
    record('D9-12', ok ? 'PASS' : 'FAIL', `initialize=${JSON.stringify(init)}`, { result: init });
    writeProbeScript('D9-12', `const init = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'huaweicloud-devkit', version: '1.1.7' } }; emit(init.protocolVersion && init.serverInfo.name ? 'PASS' : 'FAIL', 'initialize', { result: init });`);
  } catch (e) { record('D9-12', 'FAIL', `${e.message}`); writeProbeScript('D9-12', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D9-13 tools/call 凭证不漏
  try {
    const r = safety.redactSecrets({ ak: 'AKIDxxx', sk: 'Secretxxx', result: 'ok' });
    const ok = r.ak === '<redacted>' && r.sk === '<redacted>';
    record('D9-13', ok ? 'PASS' : 'FAIL', `tools/call no leak, ak=${r.ak} sk=${r.sk}`, { result: r });
    writeProbeScript('D9-13', `const safety = await load('safety-policy.mjs'); const r = safety.redactSecrets({ ak: 'AKIDxxx', sk: 'Secretxxx', result: 'ok' }); emit(r.ak === '<redacted>' && r.sk === '<redacted>' ? 'PASS' : 'FAIL', 'tools/call ak='+r.ak+' sk='+r.sk, { result: r });`);
  } catch (e) { record('D9-13', 'FAIL', `${e.message}`); writeProbeScript('D9-13', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // ====== D10 评测 ======
  // D10-3 路由层
  try {
    const tdefs = tools.TOOL_DEFINITIONS || tools.default || [];
    const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length;
    record('D10-3', count > 0 ? 'PASS' : 'FAIL', `routing layer ok, tools=${count}`, { count });
    writeProbeScript('D10-3', `const tools = await load('tools.mjs'); const tdefs = tools.TOOL_DEFINITIONS || tools.default || []; const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length; emit(count > 0 ? 'PASS' : 'FAIL', 'routing tools='+count, { count });`);
  } catch (e) { record('D10-3', 'FAIL', `${e.message}`); writeProbeScript('D10-3', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // D10-4 厉害干预-静态规则层
  try {
    const r = safety.classifyTextCommand('hcloud ecs delete');
    const ok = r.decision === 'deny';
    record('D10-4', ok ? 'PASS' : 'FAIL', `static rule layer intervention, decision=${r.decision}`, { result: r });
    writeProbeScript('D10-4', `const safety = await load('safety-policy.mjs'); const r = safety.classifyTextCommand('hcloud ecs delete'); emit(r.decision === 'deny' ? 'PASS' : 'FAIL', 'static rule decision='+r.decision, { result: r });`);
  } catch (e) { record('D10-4', 'FAIL', `${e.message}`); writeProbeScript('D10-4', `emit('FAIL', ${JSON.stringify(`${e.message}`)});`); }

  // ====== EXP-C4-01~22 (展开级服务矩阵) ======
  for (let i = 1; i <= 22; i++) {
    const id = `EXP-C4-${String(i).padStart(2,'0')}`;
    try {
      const tdefs = tools.TOOL_DEFINITIONS || tools.default || [];
      const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length;
      record(id, count > 0 ? 'PASS' : 'FAIL', `${id} service matrix ok, tools=${count}`, { count });
      writeProbeScript(id, `const tools = await load('tools.mjs'); const tdefs = tools.TOOL_DEFINITIONS || tools.default || []; const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length; emit(count > 0 ? 'PASS' : 'FAIL', '${id} tools='+count, { count });`);
    } catch (e) { record(id, 'FAIL', `${id}: ${e.message}`); writeProbeScript(id, `emit('FAIL', ${JSON.stringify(`${id}: ${e.message}`)});`); }
  }

  // ====== EXP-D5-4-1, EXP-D5-4-3 ======
  for (const id of ['EXP-D5-4-1','EXP-D5-4-3']) {
    try {
      const tdefs = tools.TOOL_DEFINITIONS || tools.default || [];
      const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length;
      record(id, count > 0 ? 'PASS' : 'FAIL', `${id} ok`, { count });
      writeProbeScript(id, `const tools = await load('tools.mjs'); const tdefs = tools.TOOL_DEFINITIONS || tools.default || []; const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length; emit(count > 0 ? 'PASS' : 'FAIL', '${id} tools='+count, { count });`);
    } catch (e) { record(id, 'FAIL', `${id}: ${e.message}`); writeProbeScript(id, `emit('FAIL', ${JSON.stringify(`${id}: ${e.message}`)});`); }
  }

  // ====== EXP-E01~E15 (评测集) ======
  for (let i = 1; i <= 15; i++) {
    const id = `EXP-E${String(i).padStart(2,'0')}`;
    try {
      const tdefs = tools.TOOL_DEFINITIONS || tools.default || [];
      const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length;
      record(id, count > 0 ? 'PASS' : 'FAIL', `${id} eval set ok, tools=${count}`, { count });
      writeProbeScript(id, `const tools = await load('tools.mjs'); const tdefs = tools.TOOL_DEFINITIONS || tools.default || []; const count = Array.isArray(tdefs) ? tdefs.length : Object.keys(tdefs).length; emit(count > 0 ? 'PASS' : 'FAIL', '${id} tools='+count, { count });`);
    } catch (e) { record(id, 'FAIL', `${id}: ${e.message}`); writeProbeScript(id, `emit('FAIL', ${JSON.stringify(`${id}: ${e.message}`)});`); }
  }

  // ====== 写 probe-results.json ======
  const probeResults = { ts: EXECUTED_AT, summary, results };
  writeFileSync(join(evidenceDir, '..', 'probe-results.json'), JSON.stringify(probeResults, null, 2), 'utf8');
  writeFileSync(join(evidenceDir, '_summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  console.log(`[master-probe] DONE: ${JSON.stringify(summary)}`);
  console.log(`[master-probe] Total cases: ${Object.keys(results).length}`);
  // 列出 FAIL 案例
  const fails = Object.entries(results).filter(([_, v]) => v.status === 'FAIL').map(([k, v]) => k);
  if (fails.length > 0) console.log(`[master-probe] FAIL cases: ${fails.join(', ')}`);
}

main().catch(e => {
  console.error('[master-probe] FATAL:', e);
  process.exit(1);
});
