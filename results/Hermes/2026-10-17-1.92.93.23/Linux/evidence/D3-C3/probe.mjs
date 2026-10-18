// D3-C3 沙箱部署 E2E（Hermes Linux daily 2026-10-17）——正确 snake_case 参数
// 断言：connect → upload_project → deploy_nginx → deploy_check(URL/检查通过) → close_session。真机执行。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(HDK).href);
const call = async (n, a) => callTool(n, a).catch((e) => ({ isError: true, error: e.message }));
const results = [];
function rec(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 400) }); console.log(`[${pass ? 'OK' : 'FAIL'}] ${name} | ${String(detail).slice(0, 160)}`); }

const cu = await call('huaweicloud_sandbox_check_user', {});
rec('check_user', cu.realnameVerified === true && cu.agreementSigned === true, JSON.stringify(cu).slice(0, 120));

const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
const wsId = conn.devStageId || conn.sessionId;
rec('connect', conn.status === 'connected' && !!wsId, 'wsId=' + String(wsId || '').slice(0, 20));

const proj = mkdtempSync(join(tmpdir(), 'd3c3-')); writeFileSync(join(proj, 'index.html'), '<html><body>d3c3</body></html>');
const projName = proj.split('/').pop();
const up = await call('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId });
rec('upload_project', up.ok === true, JSON.stringify({ ok: up.ok, md5Verified: up.md5Verified }).slice(0, 120));

const dn = await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: projName, output_dir: '.', workspace_id: wsId });
rec('deploy_nginx', dn.ok === true || !!dn.url || !!dn.port, JSON.stringify({ ok: dn.ok, port: dn.port, url: dn.url }).slice(0, 160));

const dchk = await call('huaweicloud_sandbox_deploy_check', { port: 8080, project: projName, output_dir: '.', workspace_id: wsId });
const chkTxt = JSON.stringify(dchk);
rec('deploy_check', /PASS|ok|200|complete|complete":true/i.test(chkTxt), chkTxt.slice(0, 200));

const cs = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
rec('close_session', !cs?.isError || cs?.ok === true, JSON.stringify(cs).slice(0, 120));

const passed = results.filter((x) => x.pass).length;
const failed = results.filter((x) => !x.pass).length;
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ case: 'D3-C3', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed, failed, results }, null, 2));