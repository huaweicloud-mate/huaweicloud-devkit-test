// D3-S6 场景-FunctionGraph定时任务 (OpenClaw Linux 2026-10-07 真云实测)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REGION = 'cn-north-4';
const PROJECT = '46c1fd48bd1248c7b75afc3780de7132';
const TS = String(Date.now()).slice(-10);
const EVID = dirname(fileURLToPath(import.meta.url));

function sh(args) { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 120000 }); return (r.stdout || '') + (r.stderr || ''); }
function urnOf(name) { return `urn:fss:${REGION}:${PROJECT}:function:default:${name}`; }

const out = [];
const fnName = `hdk1-s6-${TS}`;
out.push('=== D3-S6 场景-FunctionGraph定时任务 (OpenClaw Linux 真云) ===');

try {
  // ① 建函数 (inline, base64 code)
  const code = Buffer.from("def handler(event, context):\n    return {'statusCode': 200, 'body': 'hdk-d3s6'}\n").toString('base64');
  const cf = sh(['FunctionGraph', 'CreateFunction', `--func_name=${fnName}`, '--package=default', '--runtime=Python3.9', '--handler=index.handler', '--memory_size=128', '--timeout=3', '--code_type=inline', `--func_code.file=${code}`, `--cli-region=${REGION}`]);
  const created = /"func_urn"/.test(cf) || /success/i.test(cf);
  out.push(`[1] CreateFunction(${fnName}, inline Python3.9) -> ${created ? '成功' : cf.slice(0, 220)}`);
  const fnUrn = urnOf(fnName);

  // ② 建定时触发器
  let trigOk = false;
  if (created) {
    const ct = sh(['FunctionGraph', 'CreateFunctionTrigger', `--function_urn=${fnUrn}`, '--trigger_type_code=TIMER', '--event_data.name=test-timer', '--event_data.schedule_type=Rate', '--event_data.schedule=1m', `--cli-region=${REGION}`]);
    trigOk = /"trigger_id"|success/i.test(ct);
    out.push(`[2] CreateFunctionTrigger(TIMER, Rate 1m) -> ${trigOk ? '成功' : ct.slice(0, 220)}`);
  } else {
    out.push(`[2] 跳过触发器（函数未创建）`);
  }

  // ③ 核对函数 URN + 触发器
  let urnOk = false, trigBound = false;
  if (created) {
    const lf = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`]);
    urnOk = lf.includes(fnName) && lf.includes(`function:default:${fnName}`);
    out.push(`[3] ListFunctions 含 ${fnName}=${urnOk}`);
    if (trigOk) {
      const lt = sh(['FunctionGraph', 'ListFunctionTriggers', `--function_urn=${fnUrn}`, `--cli-region=${REGION}`]);
      trigBound = /TIMER/i.test(lt) && !/\[\]/.test(lt.trim());
      out.push(`    ListFunctionTriggers 含 TIMER=${trigBound}; 详情: ${lt.slice(0, 160)}`);
    }
  }

  // ④ 删除归零
  let gone = false;
  if (created) {
    const df = sh(['FunctionGraph', 'DeleteFunction', `--function_urn=${fnUrn}`, `--cli-region=${REGION}`]);
    const dfOk = /success|\{\}|null/i.test(df);
    const after = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`]);
    gone = !after.includes(fnName);
    out.push(`[4] DeleteFunction -> ${dfOk ? '已删除' : df.slice(0, 120)}; 归零=${gone}`);
  } else {
    gone = true; // 未创建视为无残留
  }

  const ok = created && trigOk && urnOk && trigBound && gone;
  out.push('');
  out.push(`建函数=${created}; 触发器=${trigOk}; URN核对=${urnOk}; 触发器绑定=${trigBound}; 归零=${gone} => ${ok ? 'PASS' : 'FAIL'}`);
  out.push(`RESULT: ${ok ? 'PASS' : 'FAIL'}`);
} catch (e) {
  out.push('EXCEPTION: ' + String(e).slice(0, 300));
  out.push('RESULT: FAIL');
}

mkdirSync(join(EVID, 'D3-S6'), { recursive: true });
writeFileSync(join(EVID, 'D3-S6', 'stdout.txt'), out.join('\n'), 'utf8');
console.log(out.join('\n'));