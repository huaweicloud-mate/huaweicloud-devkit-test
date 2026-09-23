// realcloud-s3-d414.mjs — D3-S3(沙箱预览出URL) + D4-14(操作可审计性 VPC+CTS)
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR || dirname(fileURLToPath(import.meta.url));
const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const { callTool } = await import(`file://${HDK}/src/tools.mjs`);

function ev(cid, content) { const d = join(EVID, cid); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.txt'), content, 'utf8'); }
function sh(args) { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 90000 }); return (r.stdout || '') + (r.stderr || ''); }
function idOf(j) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(j)?.[1]; }

// ============ D3-S3 场景-沙箱预览出URL ============
{
  const out = [];
  out.push('=== D3-S3 场景-沙箱预览出URL ===');
  let wsId = null;
  try {
    const cat = await callTool('huaweicloud_service_catalog', { intent: '把本地静态网页部署成可访问的预览网站' });
    out.push(`[1] serviceCatalog("把本地静态网页部署成可访问的预览网站") -> services=${JSON.stringify(cat?.recommendedServices)}`);
    const cu = await callTool('huaweicloud_sandbox_check_user', {});
    out.push(`[2] check_user -> realname=${cu?.realnameVerified} agreement=${cu?.agreementSigned}`);
    const conn = await callTool('huaweicloud_sandbox_connect', { source: 'CLI' });
    wsId = conn?.devStageId || conn?.sessionId;
    out.push(`[3] sandbox_connect -> status=${conn?.status} session=${conn?.sessionId ? String(conn.sessionId).slice(0, 10) : ''} wsId=${wsId ? String(wsId).slice(0, 10) : '(无)'}`);
    // 预备项目
    const proj = join(tmpdir(), 'd3s3-preview');
    const { mkdirSync: mkd } = await import('node:fs');
    mkd(proj, { recursive: true });
    writeFileSync(join(proj, 'index.html'), '<!DOCTYPE html><html><body><h1>hdk-d3s3-preview</h1></body></html>');
    const up = await callTool('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId });
    out.push(`[4] upload_project -> ok=${up?.ok} md5Verified=${up?.md5Verified}`);
    const dn = await callTool('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'd3s3-preview', output_dir: '.', workspace_id: wsId });
    out.push(`[5] deploy_nginx -> ok=${dn?.ok} type=${dn?.nginxType}`);
    const dc = await callTool('huaweicloud_sandbox_deploy_check', { port: 8080, project: 'd3s3-preview', output_dir: '.', workspace_id: wsId });
    out.push(`[6] deploy_check -> ${JSON.stringify(dc).slice(0, 500)}`);
    const cs = await callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId });
    out.push(`[7] close_session -> ${JSON.stringify(cs).slice(0, 150)}`);
    const nginxOk = dc?.checks?.nginx_serving?.status === 'PASS';
    const tunnelOk = dc?.checks?.tunnel_url_accessible?.status === 'PASS';
    const urlOk = typeof dc?.publicUrl === 'string' && dc.publicUrl.length > 0;
    const ok = dn?.ok === true && nginxOk && tunnelOk && urlOk;
    out.push('');
    out.push(`nginx_serving=${nginxOk} tunnel_url_accessible=${tunnelOk} publicUrl=${dc?.publicUrl}`);
    out.push(`RESULT: ${ok ? 'PASS' : 'FAIL'} (deploy_nginx + deploy_check nginx serving + 公网URL可访问)`);
    console.log(`D3-S3 ${ok ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    out.push(`异常: ${e.message}`);
    out.push(`RESULT: FAIL`);
    if (wsId) { try { await callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId }); out.push('(已尝试 close_session 清理)'); } catch {} }
    console.log('D3-S3 FAIL', e.message);
  }
  ev('D3-S3', out.join('\n'));
}

// ============ D4-14 操作可审计性 (VPC 建删 + CTS) ============
{
  const out = [];
  out.push('=== D4-14 操作可审计性 (真云 VPC 最小规格) ===');
  const name = `hdk1-audit-${TS}`;
  let vpcId = null;
  const cv = sh(['VPC', 'CreateVpc', `--vpc.name=${name}`, '--vpc.cidr=192.168.213.0/24', `--cli-region=${REGION}`]);
  vpcId = idOf(cv);
  out.push(`[1] 创建最小规格 VPC ${name} -> ${vpcId || cv.slice(0, 150)}`);
  const lv = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
  out.push(`[2] ListVpcs 确认包含 ${name} = ${lv.includes(name) || lv.includes(vpcId || '')}`);
  // CTS 审计
  const now = new Date();
  const fromMs = now.getTime() - 30 * 60 * 1000;
  const cts = sh(['CTS', 'ListTraces', `--trace_type=system`, `--service_type=VPC`, `--from=${fromMs}`, `--to=${now.getTime()}`, `--cli-region=${REGION}`]);
  const hasCreate = /CreateVpc|createVpc/.test(cts);
  const hasResource = vpcId ? cts.includes(vpcId) : false;
  out.push(`[3] CTS 审计含 CreateVpc=${hasCreate} 含本次 vpcId=${hasResource}`);
  out.push(`    CTS 摘要: ${cts.slice(0, 300)}`);
  // 删除归零
  const del = sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
  out.push(`[4] DeleteVpc -> ${/success|null|""|\{\}/.test(del) || !vpcId ? '已删除' : del.slice(0, 120)}`);
  const after = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
  const gone = !after.includes(vpcId || '');
  out.push(`[5] 删除后 ListVpcs 不再含本次 VPC=${gone} (归零)`);
  const ok = !!vpcId && hasCreate && gone;
  out.push('');
  out.push(`RESULT: ${ok ? 'PASS' : 'FAIL'}`);
  console.log(`D4-14 ${ok ? 'PASS' : 'FAIL'} vpc=${!!vpcId} ctsCreate=${hasCreate} zero=${gone}`);
  ev('D4-14', out.join('\n'));
}

console.log('REALCLOUD-S3-D414 DONE');