// probe_d3s6.mjs — D3-S6 场景-FunctionGraph定时任务（复跑，按账户/权限限制如实分类）
// 断言：函数创建成功 + 定时(TIMER)触发器绑定 → 返回可调用标识；测后删除归零。
// 分类：若云端返回账户/权限类错误（FSS.0403 user restricted / insufficient balance 等），
//       按「环境/权限阻塞」记 BLOCKED + blockedReason，而非误记为产品 FAIL。
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const EVID = process.env.EVID_DIR;
const REGION = process.env.HW_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-8);
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(status, actual, detail = '') {
  const d = join(EVID, 'D3-S6'); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: 'D3-S6', title: '场景-FunctionGraph定时任务', expected: '函数创建成功+定时触发器绑定，返回可调用标识；测后删除归零', actual, detail, executedAt: now14(), probe: 'probe_d3s6.mjs' }, null, 2), 'utf8');
  console.log(`${status}\tD3-S6\t${String(actual).slice(0, 220)}`);
}
const sh = (a, t = 120000) => { const r = spawnSync('hcloud', a, { encoding: 'utf8', timeout: t }); return { out: (r.stdout || '') + (r.stderr || ''), code: r.status }; };
const jparse = (s) => { try { return JSON.parse(s.slice(s.indexOf('{'))); } catch { return null; } };
const ACCOUNT_RE = /(FSS\.0403|user restricted|insufficient balance|op_restricted|UserRestricted|Forbidden\.)/i;

const fn = `hdk1-s6-${TS}`;
const b64 = Buffer.from("def handler(event, context):\n    return {'statusCode': 200, 'body': 'ok'}\n").toString('base64');
try {
  const cf = sh(['FunctionGraph', 'CreateFunction', `--func_name=${fn}`, '--package=default', '--runtime=Python3.9',
    '--handler=handler.handler', '--code_type=inline', `--func_code.file=${b64}`, '--memory_size=128',
    '--timeout=30', `--cli-region=${REGION}`]);
  const cfj = jparse(cf.out);
  const urn = cfj?.func_urn || null;
  let trig = null;
  if (urn) {
    const ct = sh(['FunctionGraph', 'CreateFunctionTrigger', `--function_urn=${urn}`, '--trigger_type_code=TIMER',
      '--event_data.name=timer-' + TS, '--event_data.schedule=3m', '--event_data.schedule_type=Rate', `--cli-region=${REGION}`]);
    trig = jparse(ct.out)?.trigger_id || null;
  }
  const list = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`, '--maxitems=20']);
  const listed = list.out.includes(fn);
  let delTxt = '(未创建)';
  if (urn) delTxt = sh(['FunctionGraph', 'DeleteFunction', `--function_urn=${urn}`, `--cli-region=${REGION}`]).out.slice(0, 80);
  const after = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`, '--maxitems=20']);
  const gone = !after.out.includes(fn);
  const created = !!(urn || listed);

  if (!created && ACCOUNT_RE.test(cf.out)) {
    rec('BLOCKED', `创建=false urn=no 归零=${gone}`, `账户/权限限制：${cf.out.replace(/\s+/g, ' ').slice(0, 220)} 【解除条件】账户解除受限（user restricted / sufficient balance）后可复测；本用例未创建任何资源，无残留`);
  } else {
    const ok = created && !!trig && gone;
    rec(ok ? 'PASS' : 'FAIL', `创建=${created} urn=${urn ? 'yes' : 'no'} TIMER触发器=${trig ? 'yes' : 'no'} 删除=${delTxt} 归零=${gone}`,
      ok ? '' : `FunctionGraph 函数创建/触发器绑定未完成；createOut=${cf.out.replace(/\s+/g, ' ').slice(0, 200)}`);
  }
} catch (e) { rec('FAIL', 'probe error: ' + String(e.message).slice(0, 200)); }
