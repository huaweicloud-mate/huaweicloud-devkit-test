// D4 hook 工具 + 写操作分类探针（Hermes Linux 每日回归）
// spawn mcp-server.mjs 驱动 JSON-RPC，核对：
//   D4-5  plan_cli_command 写操作不误判只读
//   D4-7  hook 三工具(hook_check_command/artifacts/deploy_plan)有效性
//   D4-9  公开暴露/破坏性预检
//   D4-21 hook_check_artifacts 宽泛 IAM 制品拦截
//   D4-22 hook_check_deploy_plan 公网暴露 FunctionGraph/缺 TTL 告警
import { spawn } from 'node:child_process';

const serverPath = process.argv[2];
const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
});
let buf = Buffer.alloc(0);
const pending = new Map();
let _id = 1;
function send(o) {
  const b = JSON.stringify(o);
  child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
  return new Promise((r) => pending.set(o.id, r));
}
child.stderr.on('data', (d) => process.stderr.write(d));
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const h = buf.indexOf('\r\n\r\n');
    if (h < 0) break;
    const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
    if (!m) { buf = buf.slice(h + 4); continue; }
    const n = +m[1];
    if (buf.length < h + 4 + n) break;
    const body = buf.slice(h + 4, h + 4 + n).toString();
    buf = buf.slice(h + 4 + n);
    try {
      const msg = JSON.parse(body);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    } catch {}
  }
});
async function call(name, args) {
  const r = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: args } });
  return r?.result?.content?.[0]?.text || JSON.stringify(r?.error || '');
}
function section(id, run) {
  console.log(`=====CASE ${id}=====`);
  return Promise.resolve(run()).catch((e) => console.log('EXCEPTION:', e.message)).then(() => console.log(`=====END ${id}=====`));
}

(async () => {
  await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  await section('D4-5', async () => {
    for (const args of [
      ['ecs', 'DeleteServer', '--server_id', 'x'],   // 写：删除
      ['ecs', 'ListServers'],                         // 读：枚举
      ['ecs', 'BatchDeleteServers', '--force'],       // 写：批量删除
      ['vpc', 'DeleteSecurityGroup', '--force'],      // 写：破坏性
    ]) {
      const txt = await call('huaweicloud_plan_cli_command', { args });
      let o = {};
      try { o = JSON.parse(txt); } catch {}
      const c = o.classification || {};
      console.log(`hcloud ${args.join(' ')}`);
      console.log(`   decision=${c.decision || o.decision} risk=${c.risk || o.risk} safeToRun=${o.safeToRun}`);
    }
  });

  await section('D4-7', async () => {
    for (const [name, args] of [
      ['huaweicloud_hook_check_command', { command: 'rm -rf /tmp/foo && dd if=/dev/zero of=/tmp/x count=1' }],
      ['huaweicloud_hook_check_command', { command: 'hcloud ecs DeleteServer --force' }],
      ['huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'main.tf', content: 'resource "huaweicloud_ecs_instance" "x" { admin_pass = "secret123" }' }] }],
      ['huaweicloud_hook_check_deploy_plan', { plan: { service: 'ECS', action: 'Create', exposure: 'private', ttl: '24h' } }],
    ]) {
      const txt = await call(name, args);
      let o = {}; try { o = JSON.parse(txt); } catch {}
      console.log(`--- ${name} ok=${o.ok} decision=${o.decision} findings=${(o.findings || []).map((f) => f.ruleId).join(',')}`);
    }
  });

  await section('D4-9', async () => {
    for (const [name, args] of [
      ['huaweicloud_hook_check_command', { command: 'hcloud vpc CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 22' }],
      ['huaweicloud_hook_check_command', { command: 'hcloud rds DeleteInstance --force' }],
      ['huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'obs.tf', content: 'resource "huaweicloud_obs_bucket_policy" "p" { acl = "public-read-write" }' }] }],
    ]) {
      const txt = await call(name, args);
      let o = {}; try { o = JSON.parse(txt); } catch {}
      console.log(`--- ${name} ok=${o.ok} decision=${o.decision} findings=${(o.findings || []).map((f) => f.ruleId).join(',')}`);
    }
  });

  await section('D4-21', async () => {
    const broadIam = JSON.stringify({ Version: '1.1', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] });
    for (const [tag, args] of [
      ['broad-iam', { artifacts: [{ path: 'policy.json', content: broadIam }] }],
      ['admin-full', { artifacts: [{ path: 'role.tf', content: 'arn:aws:iam::aws:policy/AdministratorAccess FullAccess' }] }],
      ['scoped-iam', { artifacts: [{ path: 'policy.json', content: '{"Statement":[{"Effect":"Allow","Action":"ecs:ListServers","Resource":"arn"}]}' }] }],
    ]) {
      const txt = await call('huaweicloud_hook_check_artifacts', args);
      let o = {}; try { o = JSON.parse(txt); } catch {}
      console.log(`--- [${tag}] ok=${o.ok} decision=${o.decision}`);
      for (const f of o.findings || []) console.log(`    ${f.severity} ${f.ruleId}: ${f.message}`);
    }
  });

  await section('D4-22', async () => {
    for (const [tag, plan] of [
      ['fg-public', { service: 'FunctionGraph', action: 'CreateTrigger', exposure: 'public', triggerAuth: 'NONE' }],
      ['fg-private', { service: 'FunctionGraph', action: 'CreateTrigger', exposure: 'private', triggerAuth: 'IAM' }],
      ['sandbox-no-ttl', { sandbox: true, service: 'ECS', action: 'Create', resource: 'ecs.small' }],
      ['sandbox-ttl', { sandbox: true, service: 'ECS', action: 'Create', ttl: '24h', owner: 'me' }],
    ]) {
      const txt = await call('huaweicloud_hook_check_deploy_plan', { plan });
      let o = {}; try { o = JSON.parse(txt); } catch {}
      console.log(`--- [${tag}] ok=${o.ok} decision=${o.decision}`);
      for (const f of o.findings || []) console.log(`    ${f.severity} ${f.ruleId}: ${f.message}`);
    }
  });

  console.log('=== DONE ===');
  child.kill();
  process.exit(0);
})().catch((e) => { console.log('ERR', e.message); child.kill(); process.exit(1); });
setTimeout(() => { console.log('TIMEOUT'); child.kill(); process.exit(1); }, 45000);