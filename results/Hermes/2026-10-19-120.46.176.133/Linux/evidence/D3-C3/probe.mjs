// probe_d3c3.mjs — D3-C3 沙箱部署 E2E（复跑）
// 与 scripts/realcloud_e2e.mjs caseD3C3 相同断言（connect→upload_project→deploy_nginx→
// deploy_check(nginx_serving=PASS)→close_session），但在开跑前清理沙箱内**测试残留**的
// nginx 监听（上一轮 D3-S3/D3-C3 遗留，占满 8080-8093 导致 deploy_nginx 无可用端口而报错）。
// 清残留属测试收尾动作，不改变 SUT 路径。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

const HDK = process.env.HDK_SRC;
const EVID = process.env.EVID_DIR;
const { callTool } = await import(pathToFileURL(join(HDK, 'tools.mjs')).href);
const call = async (n, a) => { try { return await callTool(n, a); } catch (e) { return { __error: String(e) }; } };
const results = [];
const log = (name, pass, detail) => { results.push({ name, pass, detail: String(detail).slice(0, 300) }); console.log(`${pass ? 'PASS' : 'FAIL'}\t${name}\t${String(detail).slice(0, 200)}`); };

const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
const wsId = conn?.devStageId || conn?.sessionId;
log('connect', conn?.status === 'connected' && !!wsId, 'ws=' + String(wsId).slice(0, 10));

// 测试收尾：清理历史遗留 nginx 监听，释放 8080-8099
const cleanup = await call('huaweicloud_sandbox_exec_one_shot', {
  workspace_id: wsId,
  command: 'nginx -s stop 2>/dev/null; pkill -f nginx 2>/dev/null; sleep 1; (ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | grep -cE ":80(8|9)[0-9]" || echo 0',
});
console.log('residue-cleanup exit=%s out=%s', cleanup?.exitCode, JSON.stringify(cleanup?.stdout));

const up = await call('huaweicloud_sandbox_upload_project', { local_dir: '/tmp/d3c3-proj', workspace_id: wsId });
log('upload_project', up?.ok === true && up?.md5Verified === true, JSON.stringify(up).slice(0, 120));

const dn = await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'd3c3-proj', output_dir: '.', workspace_id: wsId });
log('deploy_nginx', dn?.ok === true, `${dn?.nginxType}:${dn?.port}`);
const port = dn?.port || 8080;

const dc = await call('huaweicloud_sandbox_deploy_check', { port, project: 'd3c3-proj', output_dir: '.', workspace_id: wsId });
log('deploy_check', dc?.checks?.nginx_serving?.status === 'PASS', dc?.checks?.nginx_serving?.status);

const cs = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
log('close_session', !cs.__error, JSON.stringify(cs).slice(0, 60));

const failed = results.filter(x => !x.pass).length;
const out = JSON.stringify({ status: failed === 0 ? 'PASS' : 'FAIL', caseId: 'D3-C3', total: results.length, passed: results.length - failed, failed, title: '沙箱部署E2E', expected: 'URL可访问+会话关闭（deploy_nginx ok + deploy_check nginx_serving=PASS + close_session）', results }, null, 2);
if (EVID) { const d = join(EVID, 'D3-C3'); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.log'), out, 'utf8'); }
console.log(out);
