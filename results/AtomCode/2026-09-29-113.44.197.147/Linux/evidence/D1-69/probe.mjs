// AtomCode 2026-09-21 补充探针(侧2)：覆盖 D1-65(调试模式环境变量)、D1-69(CLI help 子命令)、D4-25(Python hook 命令遥测分类)
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
let pass = 0, fail = 0;
const chk = (id, desc, cond) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'} ${id} ${desc} => ${JSON.stringify(cond)}`); };

// ---- D1-65 调试模式环境变量：HUAWEICLOUD_DEVKIT_DEBUG=1 时 queryDistTagsSync 正常返回 ----
console.log('=== D1-65 调试模式环境变量 ===');
{
  const { queryDistTagsSync } = await import(`file://${HDK}/plugins/huaweicloud-core/src/update-check.mjs`);
  process.env.HUAWEICLOUD_DEVKIT_DEBUG = '1';
  let tags = null;
  try { tags = queryDistTagsSync({ timeoutMs: 10000 }); } catch (e) { console.log('NOTE D1-65 queryDistTagsSync threw: ' + (e && e.message)); }
  delete process.env.HUAWEICLOUD_DEVKIT_DEBUG;
  const ok = tags !== null && typeof tags === 'object' && (tags.latest || tags.next);
  // DEBUG 分支生效的源头核对：源码 debugLog 仅当 DEBUG==='1'|'true' 时 console.error
  chk('D1-65', 'DEBUG=1 queryDistTagsSync 正常返回 dist-tags(非空对象)', ok);
}

// ---- D1-69 CLI help 子命令（真机执行 huaweicloud-devkit help）----
console.log('=== D1-69 CLI help 子命令 ===');
const h = spawnSync('huaweicloud-devkit', ['help'], { encoding: 'utf8' });
const hout = `${h.stdout || ''}${h.stderr || ''}`;
chk('D1-69', `help 子命令输出帮助且 exit=0 => exit=${h.status}`, h.status === 0);
chk('D1-69', '帮助文本含 Usage/Commands', /Usage/.test(hout) && /Commands/.test(hout));

// ---- D4-25 Python hook 事件遥测分类（record_cli_event 写命令应归 cli:write）----
console.log('=== D4-25 Python hook 事件遥测分类 ===');
const pyHook = join(HDK, 'plugins', 'huaweicloud-core', 'hooks', 'huaweicloud-safety.py');
const evts = join(HDK, 'plugins', 'telemetry', 'hook-events.jsonl');  // PLUGIN_DIR=plugins, TELEMETRY_DIR=plugins/telemetry
try { rmSync(evts, { force: true }); } catch {}
function record(text) {
  const script = `import importlib.util\n` +
    `spec = importlib.util.spec_from_file_location('hs', ${JSON.stringify(pyHook)})\n` +
    `m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)\n` +
    `m.record_cli_event(${JSON.stringify(text)})\n`;
  const r = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
  if (r.status !== 0 || (r.stderr || '').trim()) console.log(`      D4-25 record('${text}') rc=${r.status} err=${(r.stderr || '').slice(0,120)}`);
}
record('hcloud ECS NovaListServers --project_id=x');
record('hcloud ECS CreateServers --flavor=s6 --adminPass=x');
record('hcloud ECS FooBarUnknownAction');
let readKey = null, writeKey = null, invokeKey = null;
try {
  const lines = readFileSync(evts, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  readKey = lines.find((e) => /ListServers/.test(e.value))?.key ?? null;
  writeKey = lines.find((e) => /CreateServers/.test(e.value))?.key ?? null;
  invokeKey = lines.find((e) => /FooBarUnknownAction/.test(e.value))?.key ?? null;
} catch (e) { console.log('NOTE D4-25 event read err: ' + (e && e.message)); }
chk('D4-25', '事件键 cli:read', readKey === 'cli:read');
chk('D4-25', '事件键 cli:write', writeKey === 'cli:write');
chk('D4-25', '事件键 cli:invoke', invokeKey === 'cli:invoke');
try { rmSync(evts, { force: true }); } catch {}

console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);