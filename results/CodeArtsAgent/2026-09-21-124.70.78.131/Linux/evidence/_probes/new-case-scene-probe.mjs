import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2];
const MCP = join(SRC, 'mcp-server.mjs');

{
  const setupCli = readFileSync(join(SRC, 'setup-cli.mjs'), 'utf8');
  const hasMode = setupCli.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE');
  const hasHcloudBin = /HCLOUD_BIN/.test(setupCli);
  const hasSkipDsh = /HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL/.test(setupCli);
  console.log(`D1-67 | ${hasMode && hasHcloudBin && hasSkipDsh ? 'PASS' : 'FAIL'} | AGENT_TOOLKIT_MODE=${hasMode} HCLOUD_BIN=${hasHcloudBin} SKIP_DSH=${hasSkipDsh}`);
}

function makeServer() {
  const child = spawn(process.execPath, [MCP], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
  child.stderr.on('data', () => {});
  function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise((r) => pending.set(o.id, r)); }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1]; if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function call(name, args) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: args || {} } }); }
  return { child, call, send };
}

const srv = makeServer();
await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
function txt(r) { return r?.result?.content?.map(c=>c.text).join('') || JSON.stringify(r?.error || '') || ''; }

{
  const r2 = await srv.call('huaweicloud_service_catalog', { intent: '部署一个网站，需要数据库和对象存储' });
  const t2 = txt(r2);
  const multi = /(DDS|GaussDB|RDS|OBS|ECS|Sandbox|DevStation|CloudDeploy)/i.test(t2);
  console.log(`D3-S5 | ${multi ? 'PASS' : 'FAIL'} | 复合意图命中多服务: ${t2.slice(0,160).replace(/\n/g,' ')}`);
}

{
  const r = await srv.call('huaweicloud_service_catalog', { intent: '查询云服务器列表' });
  const route = txt(r);
  console.log(`D3-S1 路由("查询云服务器列表"): ${route.slice(0,120).replace(/\n/g,' ')}`);
  const write = await srv.call('huaweicloud_plan_cli_command', { args: ['ecs', 'ListServers'] });
  const wt = txt(write);
  const readOnly = /read_only|"safeToRun":true|"decision":"allow"/i.test(wt);
  console.log(`D3-S1 | ${readOnly ? 'PASS' : 'FAIL'} | 只读规划 decision=allow/read_only`);
}

{
  const r = await srv.call('huaweicloud_explain_error', { error: 'User is not authorized to perform this action (code: 403, error_code: IAM.0005)' });
  const t = txt(r);
  const classified = /权限|IAM|authorized|permission|Keystone|project_id|下一步|next/i.test(t);
  console.log(`D3-S8 | ${classified ? 'PASS' : 'FAIL'} | 权限错误给出分类与下一步: ${t.slice(0,160).replace(/\n/g,' ')}`);
}

console.log('=== scene DONE ===');
srv.child.kill();
process.exit(0);
