// D3-S6 场景-FunctionGraph定时任务 (真云实测: 建函数+定时触发器+核对URN/触发器+删除归零)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR || dirname(fileURLToPath(import.meta.url));
const REGION = process.env.HDK_REGION || 'cn-north-4';
const PROJECT = '46c1fd48bd1248c7b75afc3780de7132';
const TS = String(Date.now()).slice(-10);
const { callTool } = await import(`file://${HDK}/src/tools.mjs`);

function sh(args) { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 120000 }); return (r.stdout || '') + (r.stderr || ''); }
function urnOf(name) { return `urn:fss:${REGION}:${PROJECT}:function:default:${name}`; }

const out = [];
out.push('=== D3-S6 场景-FunctionGraph定时任务 (真云) ===');
const fnName = `hdk1-s6-${TS}`;

// ① serviceCatalog 路由
const cat = await callTool('huaweicloud_service_catalog', { intent: '配置一个定时任务，定时触发函数' });
out.push(`[1] serviceCatalog("配置一个定时任务，定时触发函数") -> services=${JSON.stringify(cat?.recommendedServices)} skills=${JSON.stringify(cat?.recommendedSkills)}`);

// ② 清理历史遗留函数 (归零义务: 先清上次未删的 test-d3-s6-timer)
const legacy = await callTool('huaweicloud_list_operations', { service: 'FunctionGraph', timeoutMs: 30000 });
out.push(`[2] 前置: 清理历史遗留函数 test-d3-s6-timer (若存在)`);
let legacyDel = '';
try {
  legacyDel = sh(['FunctionGraph', 'DeleteFunction', `--function_urn=${urnOf('test-d3-s6-timer')}`, `--cli-region=${REGION}`]);
  out.push(`     DeleteFunction(test-d3-s6-timer) -> ${/success|\\{\\}|null/i.test(legacyDel) ? '已删除' : legacyDel.slice(0, 120)}`);
} catch (e) { out.push(`     清理异常: ${e.message}`); }

// ③ 建函数 (inline, base64 code)
const code = Buffer.from("def handler(event, context):\n    return {'statusCode': 200, 'body': 'hdk-d3s6'}\n").toString('base64');
const cf = sh(['FunctionGraph', 'CreateFunction', `--func_name=${fnName}`, '--package=default', '--runtime=Python3.9', '--handler=index.handler', '--memory_size=128', '--timeout=3', '--code_type=inline', `--func_code.file=${code}`, `--cli-region=${REGION}`]);
const created = /"func_urn"/.test(cf) || /success/i.test(cf);
out.push(`[3] CreateFunction(${fnName}, inline Python3.9) -> ${created ? '成功' : cf.slice(0, 200)}`);
const fnUrn = urnOf(fnName);

// ④ 建定时触发器
const ct = sh(['FunctionGraph', 'CreateFunctionTrigger', `--function_urn=${fnUrn}`, '--trigger_type_code=TIMER', '--event_data.name=test-timer', '--event_data.schedule_type=Rate', '--event_data.schedule=1m', `--cli-region=${REGION}`]);
const trigOk = /"trigger_id"|success/i.test(ct);
out.push(`[4] CreateFunctionTrigger(TIMER, Rate 1m) -> ${trigOk ? '成功' : ct.slice(0, 200)}`);

// ⑤ 核对函数 URN + 触发器
const lf = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`]);
const urnOk = lf.includes(fnName) && lf.includes(`function:default:${fnName}`);
const lt = sh(['FunctionGraph', 'ListFunctionTriggers', `--function_urn=${fnUrn}`, `--cli-region=${REGION}`]);
const trigBound = /TIMER/i.test(lt) && !/\\[\\]/.test(lt.trim());
out.push(`[5] ListFunctions 含 ${fnName}=${urnOk}; ListFunctionTriggers 含 TIMER=${trigBound}`);
out.push(`     trigger 详情: ${lt.slice(0, 200)}`);

// ⑥ 删除归零
const df = sh(['FunctionGraph', 'DeleteFunction', `--function_urn=${fnUrn}`, `--cli-region=${REGION}`]);
const dfOk = /success|\\{\\}|null/i.test(df);
const after = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`]);
const gone = !after.includes(fnName);
out.push(`[6] DeleteFunction(${fnName}) -> ${dfOk ? '已删除' : df.slice(0, 120)}; 删除后 ListFunctions 不再含=${gone} (归零)`);

out.push('');
const ok = created && trigOk && urnOk && trigBound && gone;
out.push(`建函数=${created}; 触发器=${trigOk}; URN核对=${urnOk}; 触发器绑定=${trigBound}; 归零=${gone} => ${ok ? 'PASS' : 'FAIL'}`);
out.push(`RESULT: ${ok ? 'PASS' : 'FAIL'}`);

const d = join(EVID, 'D3-S6');
mkdirSync(d, { recursive: true });
writeFileSync(join(d, 'stdout.txt'), out.join('\n'), 'utf8');
console.log(out.join('\n'));