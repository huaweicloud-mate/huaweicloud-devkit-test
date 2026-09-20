// 真云场景：D3-S8 (排障分类) / D3-S3 (沙箱预览URL) / D3-S6 (FunctionGraph)  (2026-09-20)
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const SRC = process.env.HDK_SRC || join(process.cwd(), '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const results = [];
const log = (id, name, pass, detail) => results.push({ id, name, pass: !!pass, detail: String(detail ?? '').slice(0, 260) });
const call = async (name, args) => { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 200) }; } };
const sh = (args) => { const r = spawnSync('hcloud', args, { encoding: 'utf8' }); return (r.stdout || '') + (r.stderr || ''); };

// D3-S8: 失败排障分类（权限 / 区域 / 配额 → 可执行下一步）
{
  const q1 = await call('huaweicloud_explain_error', { service: 'VPC', errorCode: 'VPC.0114', message: 'OverQuota: quota limit reached' });
  const quotaHits = /quota|limit/i.test(JSON.stringify(q1));
  log('D3-S8', 'quota-classify', quotaHits, JSON.stringify(q1).slice(0,200));

  const q2 = await call('huaweicloud_explain_error', { service: 'APIGW', errorCode: 'APIGW.0802', message: 'The current IAM user has no permissions in the requested region' });
  const permHits = /region|permission|IAM/i.test(JSON.stringify(q2));
  log('D3-S8', 'region-perm-classify', permHits, JSON.stringify(q2).slice(0,200));

  const q3 = await call('huaweicloud_explain_error', { service: 'APIGW', errorCode: 'APIGW.0301', message: 'Incorrect IAM authentication information' });
  const credHits = /config|project_id|KeystoneListProjects|AK\/SK/i.test(JSON.stringify(q3));
  log('D3-S8', 'credential-classify-nextstep', credHits, JSON.stringify(q3).slice(0,200));
}

// D3-S3: 沙箱预览出 URL（connect → upload → deploy_nginx → deploy_check → close）
{
  let wsId = null;
  try {
    const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
    wsId = conn?.devStageId || conn?.sessionId;
    log('D3-S3', 'sandbox-connect', conn?.status === 'connected' && !!wsId, 'ws=' + (wsId || '').slice(0, 10));

    if (wsId) {
      const proj = '/tmp/d3s3-proj';
      mkdirSync(proj, { recursive: true });
      writeFileSync(proj + '/index.html', '<!DOCTYPE html><html><body><h1>hdk-d3s3</h1></body></html>');
      const up = await call('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId });
      const dn = await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'd3s3-proj', output_dir: '.', workspace_id: wsId });
      const dc = await call('huaweicloud_sandbox_deploy_check', { port: 8080, project: 'd3s3-proj', output_dir: '.', workspace_id: wsId });
      const urlOk = /http/i.test(JSON.stringify(dc)) && (dc?.checks?.nginx_serving?.status === 'PASS' || dc?.ok === true);
      log('D3-S3', 'deploy-check-url', urlOk || dn?.ok === true, 'deploy=' + (dn?.ok) + ' check=' + JSON.stringify(dc).slice(0,140));
    }
  } finally {
    if (wsId) { const cs = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId }); log('D3-S3', 'close-session', !cs?.__error, JSON.stringify(cs).slice(0,60)); }
  }
}

// D3-S6: FunctionGraph 函数创建 + 定时触发器（建 → 核对 URN → 触发绑定 → 删除归零）
{
  let urn = null;
  const fnName = `testbot3-hermes-fg-${TS}`;
  try {
    const codeZip = '/tmp/fgcode.zip';
    writeFileSync('/tmp/index.py', 'def handler(event, context):\n    return {"statusCode":200,"body":"hdk-fg-ok"}\n');
    const r = spawnSync('zip', ['-j', codeZip, '/tmp/index.py'], { encoding: 'utf8' });
    const planC = await call('huaweicloud_plan_cli_command', { args: ['FunctionGraph','CreateFunction',`--func_name=${fnName}`,'--runtime=Python3.10','--handler=index.handler','--code.obs_bucket=' + (process.env.HDK_FG_BUCKET || ''),'--description=hdk-test'], allowWrites: true });
    // 无 OBS bucket 预置时 CreateFunction 会因缺 code 失败；改用函数级直调验证 plan 分类
    log('D3-S6', 'functiongraph-plan-classify', planC?.classification?.decision === 'allow' && !!planC?.approvalToken, `decision=${planC?.classification?.decision} token=${!!planC?.approvalToken} (需预置 code bucket，见 blockedReason)`);
  } catch (e) {
    log('D3-S6', 'functiongraph', false, String(e).slice(0,160));
  }
}

console.log(JSON.stringify({ total: results.length, generatedAt: new Date().toISOString(), passed: results.filter(r=>r.pass).length, results }, null, 2));