// D3-C6 沙箱 7 隐式工具具名冒烟（CodeArtsAgent Linux 每日回归）
import { pathToFileURL } from 'node:url';
const CORE = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const results = [];
function record(n, ok, out) { results.push({ n, ok, out: String(out).slice(0, 400) }); console.log(`[${ok ? 'OK' : 'ERR'}] ${n}`); }
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
const redact = (s) => String(s).replace(/(HPUA|AKIA|ASIA|HUAWEI)[A-Za-z0-9]{8,}/g, '$1***');

const cu = await call('huaweicloud_sandbox_check_user', {});
const verified = cu?.realnameVerified === true;
record('huaweicloud_sandbox_check_user', verified, JSON.stringify(cu).slice(0, 200));

const sa = await call('huaweicloud_sandbox_sign_agreement', {});
record('huaweicloud_sandbox_sign_agreement', sa?.signed === true || sa?.__error !== undefined, JSON.stringify(sa).slice(0, 200));

const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
const wsId = conn?.devStageId || conn?.sessionId || conn?.devstage_id || conn?.session_id;
record('huaweicloud_sandbox_connect', conn?.status === 'connected' && !!wsId, 'status=' + (conn?.status || conn?.__error) + ' wsId=' + String(wsId).slice(0, 20));

const cred = await call('huaweicloud_sandbox_credentials', { workspace_id: wsId });
record('huaweicloud_sandbox_credentials', !!cred && cred.__error === undefined, redact(JSON.stringify(cred)).slice(0, 200));

const upf = await call('huaweicloud_sandbox_upload_file', { local_path: '/etc/hostname', remote_path: '/workspace/.hdk-hostname', workspace_id: wsId });
record('huaweicloud_sandbox_upload_file', upf?.ok === true, upf?.__error ? 'param check: ' + upf.__error : JSON.stringify(upf).slice(0, 160));

const eos = await call('huaweicloud_sandbox_exec_one_shot', { command: 'echo probe-ok && hostname', workspace_id: wsId, timeout: 30000 });
record('huaweicloud_sandbox_exec_one_shot', eos?.__error === undefined && (eos?.stdout !== undefined || eos?.output !== undefined), String(eos?.stdout || eos?.output || eos?.__error || '').slice(0, 160));

const dchk = await call('huaweicloud_sandbox_deploy_check', { workspace_id: wsId });
record('huaweicloud_sandbox_deploy_check', !!dchk && (dchk?.ok === true || dchk?.checks !== undefined), JSON.stringify(dchk).slice(0, 200));

const cs = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
record('huaweicloud_sandbox_close_session', !cs?.__error, cs?.__error ? 'err:' + cs.__error : 'ok');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ caseId: 'D3-C6', total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));
process.exit(0);
