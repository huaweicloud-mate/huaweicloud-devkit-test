import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { writeEvidence, writeProbe, ts } from './lib.mjs';

const ADM = JSON.parse(readFileSync(homedir() + '/.config/huaweicloud/credentials.json.bak-d3c2-20261120', 'utf8'));
const base = ['--cli-region=cn-north-4', '--cli-access-key=' + ADM.ak, '--cli-secret-key=' + ADM.sk];
const hc = (a, t = 300000) => { const r = spawnSync('hcloud', [...a, ...base], { encoding: 'utf8', timeout: t, windowsHide: true }); let p = null; try { p = JSON.parse(r.stdout); } catch { } return { rc: r.status, out: (r.stdout || '').slice(0, 2000), parsed: p }; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const code = Buffer.from('def handler(event, context):\n    return "ok"', 'utf8').toString('base64');

const fn = async () => {
  const name = 'tctest_codearts1_' + ts().slice(4, 14);
  const cr = hc(['FunctionGraph', 'CreateFunction', '--package=default', '--func_name=' + name, '--runtime=Python3.9', '--handler=index.handler', '--code_type=inline', '--func_code.file=' + code, '--memory_size=128', '--timeout=30'], 300000);
  const urn = cr.parsed && cr.parsed.func_urn;
  const funcId = cr.parsed && cr.parsed.func_id;
  const created = !!(urn && funcId);
  let trigOk = false, trigBody = null;
  if (created) {
    const t = hc(['FunctionGraph', 'CreateEvent', '--function_urn=' + urn, '--trigger_type_code=TIMER', '--trigger_status=ACTIVE', '--event_type_code=TIMER', '--trigger_name=' + name + '-timer', '--trigger_properties={"cron":"0 0 2 * * ?"}'], 120000);
    trigBody = { rc: t.rc, out: t.out.slice(0, 400) };
    trigOk = t.rc === 0 && !/error_code/.test(t.out);
  }
  const delUrn = urn ? urn.replace(':latest', '') : '';
  const del = created ? hc(['FunctionGraph', 'DeleteFunction', '--function_urn=' + delUrn], 300000) : { rc: null, out: '' };
  let gone = false;
  for (let i = 0; i < 20 && created; i++) { await sleep(3000); const l = hc(['FunctionGraph', 'ListFunctions']); const arr = (l.parsed && l.parsed.functions) || []; gone = !arr.some((f) => f.func_name === name); if (gone) break; }
  const ok = created && trigOk && gone;
  return { status: ok ? 'PASS' : 'FAIL', why: '真机 FunctionGraph：创建 ' + name + '=' + created + ' 触发器(TIMER/Cron)=' + trigOk + ' 删除=' + gone + (created ? '' : ' create=' + cr.out.slice(0, 160)), result: { name, urn, funcId, trigger: trigBody, deleted: del.rc, gone } };
};
const r = await fn();
writeEvidence('D3-S6', r);
try { writeProbe('D3-S6', '场景-FunctionGraph定时任务', fn); } catch { }
console.log('D3-S6', r.status, '|', String(r.why).slice(0, 300));
