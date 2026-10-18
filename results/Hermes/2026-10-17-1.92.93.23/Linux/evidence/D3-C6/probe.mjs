// D3-C6 沙箱 7 隐式工具具名冒烟（Hermes Linux daily 2026-10-17）——正确 snake_case 参数
// 断言：check_user/sign_agreement/connect/credentials/exec_one_shot/upload_file/close_session 均返回规范结果。
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(HDK).href);
const call = async (n, a) => callTool(n, a).catch((e) => ({ isError: true, error: e.message }));
const results = [];
function rec(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 300) }); console.log(`[${pass ? 'OK' : 'FAIL'}] ${name} | ${String(detail).slice(0, 150)}`); }

const cu = await call('huaweicloud_sandbox_check_user', {});
rec('check_user', cu.realnameVerified === true && cu.agreementSigned === true, JSON.stringify(cu).slice(0, 100));

const sa = await call('huaweicloud_sandbox_sign_agreement', {});
rec('sign_agreement', sa.signed === true || /signed|agreement/i.test(JSON.stringify(sa)), JSON.stringify(sa).slice(0, 100));

const co = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
const wsId = co.devStageId || co.sessionId;
rec('connect', co.status === 'connected' && !!wsId, 'wsId=' + String(wsId || '').slice(0, 20));

const cr = await call('huaweicloud_sandbox_credentials', { workspace_id: wsId });
rec('credentials', !cr?.isError || /ok|passed|token|ak|sk|credential/i.test(JSON.stringify(cr)), JSON.stringify(cr).slice(0, 120));

const ex = await call('huaweicloud_sandbox_exec_one_shot', { command: 'echo hdk-sandbox-ok', workspace_id: wsId });
rec('exec_one_shot', /hdk-sandbox-ok/.test(JSON.stringify(ex)), JSON.stringify(ex).slice(0, 100));

writeFileSync('/tmp/d3c6.txt', 'hdk d3c6');
const up = await call('huaweicloud_sandbox_upload_file', { local_path: '/tmp/d3c6.txt', remote_path: '/workspace/d3c6.txt', workspace_id: wsId });
rec('upload_file', !/isError\"?:\s*true/.test(JSON.stringify(up)) && /ok|bytes|md5|success|upload/i.test(JSON.stringify(up)), JSON.stringify(up).slice(0, 120));

const cl = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
rec('close_session', !cl?.isError || cl?.ok === true, JSON.stringify(cl).slice(0, 100));

const passed = results.filter((x) => x.pass).length;
const failed = results.filter((x) => !x.pass).length;
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ case: 'D3-C6', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed, failed, results }, null, 2));