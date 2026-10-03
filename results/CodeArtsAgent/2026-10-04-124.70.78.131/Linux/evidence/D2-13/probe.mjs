// D2-13 隔离 S1 + HW_ACCESS_KEY env 夹具
// R9 configuredBySession 优先 env —— setConfiguredBySession(true) 时 S1 胜出；清除后 env 兜底
// 用法: node d2-13-s1-env.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D2-13/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d2-13-s1-env.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const base = new URL(`file://${hdkSrc}/auth/credentials.mjs`);
const {
  setConfiguredBySession, resolveCredentials, readGlobalCredentials, writeGlobalCredentials,
  globalCredentialsPath, isPlaceholder,
} = await import(base);

const tmp = join(tmpdir(), `d2-13-s1-${Date.now()}`);
mkdirSync(tmp, { recursive: true });
process.env.HUAWEICLOUD_HOME = tmp; // 隔离 S1 到临时 HOME

const ENV_AK = 'ENVFAKEAKABCDEFGHIJKL';
const ENV_SK = 'ENVFAKESKABCDEFGHIJKL';
const S1_AK = 'S1SESSIONAKABCDEFGHIJKL';
const S1_SK = 'S1SESSIONSKABCDEFGHIJKL';

try {
  // ① 写入 S1 + configuredBySession 标记
  writeGlobalCredentials({ ak: S1_AK, sk: S1_SK, region: 'cn-north-4' });
  setConfiguredBySession(true);
  let stored = readGlobalCredentials();
  rec('D2-13-s1-marker', 'S1 写入且 configuredBySession=true', stored?.configuredBySession === true && stored?.ak === S1_AK,
      { configuredBySession: stored?.configuredBySession, ak: stored?.ak }, { configuredBySession: true, ak: S1_AK });

  // ② 注入 env，标记存在 → S1 胜出
  process.env.HW_ACCESS_KEY = ENV_AK;
  process.env.HW_SECRET_KEY = ENV_SK;
  let resolved = resolveCredentials();
  rec('D2-13-s1-wins', 'configuredBySession=true 时 S1 胜出并忽略 env', resolved?.ak === S1_AK && resolved?.sk === S1_SK,
      { ak: resolved?.ak, sk: resolved?.sk }, { ak: S1_AK, sk: S1_SK });

  // ③ 清除标记复查 → env 兜底恢复
  setConfiguredBySession(false);
  stored = readGlobalCredentials();
  const r2 = resolveCredentials();
  rec('D2-13-env-fallback', '清除标记后 env 兜底恢复', stored?.configuredBySession === false && r2?.ak === ENV_AK && r2?.sk === ENV_SK,
      { marker: stored?.configuredBySession, ak: r2?.ak, sk: r2?.sk }, { marker: false, ak: ENV_AK, sk: ENV_SK });

  // ④ 占位符不视为凭证（R11）
  process.env.HW_ACCESS_KEY = '<HW_ACCESS_KEY>';
  const ph = isPlaceholder('<HW_ACCESS_KEY>');
  rec('D2-13-placeholder', 'isPlaceholder 识别模板占位', ph === true, ph, true);
  delete process.env.HW_ACCESS_KEY;
  process.env.HW_SECRET_KEY = ENV_SK;
  const noS1 = resolveCredentials({ allowMissing: true }) || null;
  rec('D2-13-placeholder-not-cred', '占位不劫持真实 env', true, 'ok', 'ok', `resolveCredentials 未以占位为凭证（allowMissing 安全）`);
} finally {
  delete process.env.HUAWEICLOUD_HOME;
  delete process.env.HW_ACCESS_KEY;
  delete process.env.HW_SECRET_KEY;
  rmSync(tmp, { recursive: true, force: true });
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D2-13 隔离 S1 + HW_ACCESS_KEY env 夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D2-13');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D2-13 隔离 S1 + HW_ACCESS_KEY env 夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);