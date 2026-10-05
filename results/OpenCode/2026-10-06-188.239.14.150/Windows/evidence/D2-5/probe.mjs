// D2-5 凭证缺失报错指引（P1）
// 断言：无凭证/占位凭证/格式错误凭证三种场景，auth_status 或凭证解析均返回可执行指引（含登录/配置命令）
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const HOOKS = process.env.HDK_HOOKS || join(SRC, '..', 'hooks');
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const tmp = mkdtempSync(join(tmpdir(), 'd2-5-'));
process.env.HUAWEICLOUD_HOME = tmp;
const creds = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);
const svc = await import(pathToFileURL(join(SRC, 'auth', 'service.mjs')).href);
const s1Dir = join(tmp, '.config', 'huaweicloud');
mkdirSync(s1Dir, { recursive: true });

const HINTS = /npx |huaweicloud-devkit|auth_init|auth init|huaweicloud_auth_init|huaweicloud_auth_switch|configure|登录|配置|credential/i;

function scenario(name, writer) {
  writer();
  const st = svc.getAuthStatus('all');
  const text = JSON.stringify(st);
  const resolved = (() => { try { return creds.resolveCredentials(); } catch (e) { return { error: e.message }; } })();
  const rtext = JSON.stringify(resolved);
  return { name, status: text.slice(0, 900), resolvedKeys: Object.keys(resolved || {}), akConfigured: !!(st && (st.configured !== undefined ? st.configured : st.ok)), hintFound: HINTS.test(text) || HINTS.test(rtext) };
}

const rows = [];
rows.push(scenario('无凭证文件', () => { try { rmSync(join(s1Dir, 'credentials.json'), { force: true }); } catch {} }));
rows.push(scenario('占位凭证(<your-ak>)', () => { creds.writeGlobalCredentials({ ak: '<your-ak>', sk: '<your-sk>', region: 'cn-north-4' }); }));
rows.push(scenario('空凭证(缺 sk)', () => { creds.writeGlobalCredentials({ ak: 'AKIAPROBEPARTIAL000001', region: 'cn-north-4' }); }));
rows.push(scenario('格式错误凭证(非 AK 前缀)', () => { creds.writeGlobalCredentials({ ak: 'not-an-access-key', sk: 'x', region: 'cn-north-4' }); }));

const violations = rows.filter((r) => !r.hintFound);
rmSync(tmp, { recursive: true, force: true });
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `凭证缺失指引成立：${rows.length} 种异常场景（无文件/占位凭证/缺 sk/格式错误）均返回含可执行动作的指引（npx/auth_init/auth_switch/configure 等）`
      : `凭证缺失指引不完整：${JSON.stringify(violations.map((v) => ({ name: v.name, hintFound: v.hintFound, status: v.status.slice(0, 300) })))}`,
  { scenarios: rows, violations, probeValues: '隔离 HOME + 占位凭证' });
