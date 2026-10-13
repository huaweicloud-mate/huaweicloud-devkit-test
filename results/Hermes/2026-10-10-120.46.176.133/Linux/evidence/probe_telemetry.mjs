// probe_telemetry.mjs — D1-65 (DEBUG) + D1-66 (telemetry switch/endpoint)
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const __dirname = dirname(fileURLToPath(import.meta.url));
const S = (p) => String(p).replace(/\\/g, '/');
const TEL_MOD = `file://${S(join(HDK, 'src/telemetry/telemetry.mjs'))}`;
const DEBUG_LOG = join(HDK, 'telemetry/telemetry-debug.log');
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '') {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: now14(), probe: 'probe_telemetry.mjs' }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}
function runChild(extraEnv) {
  return spawnSync('node', [join(__dirname, '_tchild.mjs')], {
    encoding: 'utf8', timeout: 60000,
    env: { ...process.env, HDK_TEL_MOD: TEL_MOD, ...extraEnv },
  });
}
const sizeOf = (p) => { try { return statSync(p).size; } catch { return -1; } };

// ---------------- D1-65 DEBUG 开关 ----------------
try {
  const cases = { true: { HUAWEICLOUD_DEVKIT_DEBUG: 'true' }, one: { HUAWEICLOUD_DEVKIT_DEBUG: '1' }, off: { HUAWEICLOUD_DEVKIT_DEBUG: '' } };
  const deltas = {};
  for (const [k, env] of Object.entries(cases)) {
    const before = sizeOf(DEBUG_LOG);
    runChild(env);
    deltas[k] = sizeOf(DEBUG_LOG) - before;
  }
  const trueOn = deltas.true > 0, oneOn = deltas.one > 0, offOff = deltas.off <= 0;
  const ok = trueOn && oneOn && offOff;
  rec('D1-65', ok ? 'PASS' : (trueOn && offOff ? 'SPEC-MISMATCH' : 'FAIL'), '调试模式环境变量',
    'DEBUG===1/true 时开启调试日志；未设/其他值不开启',
    `DEBUG=true 日志增量=${deltas.true} DEBUG=1 增量=${deltas.one} 未设增量=${deltas.off}`,
    oneOn ? '' : 'telemetry.mjs:81 `process.env.HUAWEICLOUD_DEVKIT_DEBUG === \'true\'` 仅接受字面量 "true"，DEBUG=1 不生效（与用例契约 "1/true 均可" 漂移）');
} catch (e) { rec('D1-65', 'FAIL', '调试模式环境变量', '', 'probe error: ' + e.message); }

// ---------------- D1-66 遥测开关 + 端点 ----------------
try {
  // (a) switch
  const offRun = runChild({ HUAWEICLOUD_DEVKIT_TELEMETRY: 'off' });
  const onRun = runChild({});
  let offEnabled = null, onEnabled = null;
  try { offEnabled = JSON.parse(offRun.stdout.trim().split('\n').pop()).enabled; } catch {}
  try { onEnabled = JSON.parse(onRun.stdout.trim().split('\n').pop()).enabled; } catch {}
  // (b) custom endpoint: point at a local server, count POSTs
  let posts = [];
  const srv = createServer((req, res) => { let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => { posts.push(req.url); res.writeHead(200); res.end('{}'); }); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  runChild({ HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/probe-endpoint` });
  await new Promise((r) => setTimeout(r, 500));
  srv.close();
  const customHit = posts.some((u) => u.includes('/probe-endpoint'));
  const ok = offEnabled === false && onEnabled === true && customHit;
  rec('D1-66', ok ? 'PASS' : 'FAIL', '遥测开关与端点环境变量',
    'TELEMETRY=off 关闭遥测；未设开启；ENDPOINT 设了取自定义、未设回退默认',
    `off->enabled=${offEnabled} 未设->enabled=${onEnabled} 自定义端点收到POST=${customHit} (${JSON.stringify(posts)})`);
} catch (e) { rec('D1-66', 'FAIL', '遥测开关与端点环境变量', '', 'probe error: ' + e.message); }
console.log('probe_telemetry.mjs DONE');
