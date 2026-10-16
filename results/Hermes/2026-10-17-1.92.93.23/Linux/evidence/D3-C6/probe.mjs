// D3-C6 沙箱 7 隐式工具具名冒烟（Hermes Linux daily 2026-10-17）
// 断言：check_user/credentials/sign_agreement/connect/exec_one_shot/upload_file/close_session 均返回规范结果，无静默失败。
import { pathToFileURL } from 'node:url';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(HDK).href);

const results = [];
function rec(name, pass, detail) {
  results.push({ name, pass, detail: String(detail).slice(0, 300) });
  console.log(`[${pass ? 'OK' : 'FAIL'}] ${name}${detail ? ' | ' + String(detail).slice(0, 150) : ''}`);
}
async function call(name, args) {
  const r = await callTool(name, args || {}).catch((e) => ({ isError: true, error: e.message }));
  return JSON.stringify(r);
}

const cu = await call('huaweicloud_sandbox_check_user');
rec('check_user', /realnameVerified|agreementSigned/.test(cu), cu.slice(0, 150));

const cr = await call('huaweicloud_sandbox_credentials');
rec('credentials', /ok|passed|token|ak|sk/i.test(cr), cr.slice(0, 150));

const sa = await call('huaweicloud_sandbox_sign_agreement');
rec('sign_agreement', /ok|signed|true|agreement/i.test(sa), sa.slice(0, 150));

const co = await call('huaweicloud_sandbox_connect');
rec('connect', /connected|wsId|ok/i.test(co), co.slice(0, 150));

const ex = await call('huaweicloud_sandbox_exec_one_shot', { command: 'echo hdk-sandbox-ok' });
rec('exec_one_shot', /hdk-sandbox-ok/.test(ex), ex.slice(0, 150));

const up = await call('huaweicloud_sandbox_upload_file', { localPath: '/tmp/d3c6.txt', remotePath: '/workspace/d3c6.txt' });
rec('upload_file', /ok|bytes|md5|success/i.test(up), up.slice(0, 150));

const cl = await call('huaweicloud_sandbox_close_session');
rec('close_session', /ok|"ok"|true/i.test(cl), cl.slice(0, 150));

const passed = results.filter((x) => x.pass).length;
const failed = results.filter((x) => !x.pass).length;
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ case: 'D3-C6', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed, failed, results }, null, 2));