// probe_s6.mjs — D3-S6 真云：FunctionGraph 函数创建 + 定时(TIMER)触发器绑定 → 测后删除归零
// 修复 2026-10-04 探针缺 required 参数(memory_size/timeout)导致函数未创建的问题。
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const EVID = process.env.EVID_DIR;
const REGION = process.env.HW_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-8);
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '') {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: now14(), probe: 'probe_s6.mjs' }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}
const sh = (a, t = 120000) => { const r = spawnSync(a[0], a.slice(1), { encoding: 'utf8', timeout: t }); return { out: (r.stdout || '') + (r.stderr || ''), code: r.status }; };
const jparse = (s) => { try { return JSON.parse(s); } catch { return null; } };

const fn = `hdk1-s6-${TS}`;
const b64 = Buffer.from("def handler(event, context):\n    return {'statusCode': 200, 'body': 'ok'}\n").toString('base64');
let urn = null, created = false, trigCreated = false, trigId = null, deleted = false, gone = false, why = '';
try {
  const cf = sh(['hcloud', 'FunctionGraph', 'CreateFunction', `--func_name=${fn}`, '--package=default',
    '--runtime=Python3.9', '--handler=handler.handler', '--code_type=inline', `--func_code.file=${b64}`,
    '--memory_size=128', '--timeout=30', `--cli-region=${REGION}`]);
  const cfj = jparse(cf.out);
  urn = cfj?.func_urn || null;
  created = !!urn;

  if (created) {
    const ct = sh(['hcloud', 'FunctionGraph', 'CreateFunctionTrigger', `--function_urn=${urn}`,
      '--trigger_type_code=TIMER', `--event_data.name=timer-${TS}`, '--event_data.schedule=3m',
      '--event_data.schedule_type=Rate', `--cli-region=${REGION}`]);
    const ctj = jparse(ct.out);
    trigId = ctj?.trigger_id || null;
    trigCreated = !!trigId;
    const lt = sh(['hcloud', 'FunctionGraph', 'ListFunctionTriggers', `--function_urn=${urn}`, `--cli-region=${REGION}`]);
    const ltj = jparse(lt.out);
    const listed = JSON.stringify(ltj || lt.out).includes('TIMER');
    if (!trigCreated) why = 'TIMER 触发器创建失败: ' + ct.out.slice(0, 200);
    else if (!listed) why = '触发器创建后 ListFunctionTriggers 未见 TIMER';
  } else {
    why = 'CreateFunction 失败: ' + cf.out.slice(0, 200);
  }

  if (created) {
    // KooCLI trap: ':latest' suffix breaks DeleteFunction → strip it
    const delUrn = urn.replace(/:latest$/, '');
    const df = sh(['hcloud', 'FunctionGraph', 'DeleteFunction', `--function_urn=${delUrn}`, `--cli-region=${REGION}`]);
    const lf = sh(['hcloud', 'FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`, '--maxitems=50']);
    deleted = df.code === 0 && !/error/i.test(df.out);
    gone = !lf.out.includes(fn);
    if (!gone) why = (why ? why + ' | ' : '') + 'DeleteFunction 后仍残留: ' + lf.out.slice(0, 160);
  } else {
    gone = !sh(['hcloud', 'FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`, '--maxitems=50']).out.includes(fn);
  }

  const ok = created && trigCreated && gone;
  rec('D3-S6', ok ? 'PASS' : 'FAIL', '场景-FunctionGraph定时任务',
    '函数创建成功+定时触发器绑定，返回可调用标识；测后删除归零',
    `创建=${created} urn=${urn ? 'yes' : 'no'} TIMER触发器=${trigCreated} triggerId=${trigId ? 'yes' : 'no'} 删除=${deleted} 归零=${gone}`,
    ok ? '' : why);
} catch (e) {
  try { if (urn) sh(['hcloud', 'FunctionGraph', 'DeleteFunction', `--function_urn=${urn}`, `--cli-region=${REGION}`]); } catch {}
  rec('D3-S6', 'FAIL', '场景-FunctionGraph定时任务', '函数创建成功+定时触发器绑定，返回可调用标识；测后删除归零', 'probe error: ' + e.message, String(e.stack || '').slice(0, 200));
}
console.log('probe_s6.mjs DONE');