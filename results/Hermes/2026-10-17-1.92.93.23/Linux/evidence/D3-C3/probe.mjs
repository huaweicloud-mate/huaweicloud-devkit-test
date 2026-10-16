// D3-C3 沙箱部署 E2E（Hermes Linux daily 2026-10-17）
// 断言：connect → upload_project → deploy_nginx → deploy_check(URL/检查通过) → close_session。真机执行。
import { pathToFileURL } from 'node:url';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(HDK).href);

const results = [];
function rec(name, pass, detail) {
  results.push({ name, pass, detail: String(detail).slice(0, 400) });
  console.log(`[${pass ? 'OK' : 'FAIL'}] ${name}${detail ? ' | ' + String(detail).slice(0, 180) : ''}`);
}

let ok = true;
const c = await callTool('huaweicloud_sandbox_check_user', {}).catch((e) => ({ isError: true, error: e.message }));
rec('check_user', !!c?.realnameVerified, JSON.stringify(c).slice(0, 180));

const conn = await callTool('huaweicloud_sandbox_connect', {}).catch((e) => ({ isError: true, error: e.message }));
rec('connect', !!conn?.connected || !!conn?.wsId, JSON.stringify(conn).slice(0, 120));

const up = await callTool('huaweicloud_sandbox_upload_project', { localDir: '/tmp/d3c3-proj', remotePath: '/workspace/d3c3-proj' })
  .catch((e) => ({ isError: true, error: e.message }));
rec('upload_project', !!up?.ok || !!up?.bytes, JSON.stringify(up).slice(0, 160));

const dep = await callTool('huaweicloud_sandbox_deploy_nginx', {}).catch((e) => ({ isError: true, error: e.message }));
rec('deploy_nginx', !!dep?.url || !!dep?.port || /static|http/i.test(JSON.stringify(dep)), JSON.stringify(dep).slice(0, 160));

const chk = await callTool('huaweicloud_sandbox_deploy_check', {}).catch((e) => ({ isError: true, error: e.message }));
const chkTxt = JSON.stringify(chk);
rec('deploy_check', /PASS|ok|200|complete/.test(chkTxt), chkTxt.slice(0, 200));

const cls = await callTool('huaweicloud_sandbox_close_session', {}).catch((e) => ({ isError: true, error: e.message }));
rec('close_session', !cls?.isError || cls?.ok === true || cls === 'ok', JSON.stringify(cls).slice(0, 120));

const passed = results.filter((x) => x.pass).length;
const failed = results.filter((x) => !x.pass).length;
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ case: 'D3-C3', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed, failed, results }, null, 2));