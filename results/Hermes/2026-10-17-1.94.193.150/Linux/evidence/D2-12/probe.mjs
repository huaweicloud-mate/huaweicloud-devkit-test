// D2 认证域探针（Hermes Linux 每日回归）：spawn mcp-server.mjs 驱动 JSON-RPC
//   D2-4  凭证脱敏正确性（show_profile_redacted / auth_status 无明文 AK/SK）
//   D2-11 R3 STS token 拒绝落盘（auth_switch persist + securityToken，隔离 S1）
//   D2-12 R10 runtime 非空禁止落盘（auth_switch temporary → auth_sync suppressed）
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const serverPath = process.argv[2];

function server(envExtra = {}) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local', ...envExtra },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
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
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  return { child, send, nextId: () => _id++ };
}

async function callText(srv, name, args) {
  const r = await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'tools/call', params: { name, arguments: args } });
  return r?.result?.content?.[0]?.text || JSON.stringify(r?.error || '');
}

function section(id, run) {
  console.log(`=====CASE ${id}=====`);
  return Promise.resolve(run()).catch((e) => console.log('EXCEPTION:', e.message)).then(() => console.log(`=====END ${id}=====`));
}

(async () => {
  // ---- D2-4: 脱敏 ----
  {
    const srv = server();
    await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
    srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    await section('D2-4', async () => {
      for (const name of ['huaweicloud_show_profile_redacted', 'huaweicloud_auth_status']) {
        const txt = await callText(srv, name, {});
        console.log(`===== ${name} =====`);
        console.log(txt.slice(0, 1500));
        const leak = /(AKIA[0-9A-Z]{16}|[A-Z0-9]{20,})|"(accessKeyId|secretAccessKey|securityToken)"\s*:\s*"[A-Za-z0-9/+=]{20,}"/.test(txt);
        console.log(`>>> 疑似密钥泄露? ${leak}`);
      }
    });
    srv.child.kill();
  }

  // ---- D2-11: R3 STS ----
  {
    const isoHome = mkdtempSync(join(tmpdir(), 'hdk-r3-'));
    const srv = server({ HUAWEICLOUD_HOME: isoHome });
    await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
    srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    await section('D2-11', async () => {
      const txt = await callText(srv, 'huaweicloud_auth_switch', { action: 'persist', mode: 'memory', ak: 'FAKEAK', sk: 'FAKESK', securityToken: 'FAKE-STS-TOKEN', region: 'cn-north-4' });
      console.log(txt.slice(0, 800));
      const r3 = /R3|cannot be persisted|Temporary STS|scope.*rejected|rejected/i.test(txt);
      console.log(`>>> R3 拒绝判定: ${r3}`);
      const credFile = join(isoHome, '.config', 'huaweicloud', 'credentials.json');
      console.log(`>>> 隔离S1凭证文件是否被写入: ${existsSync(credFile)}`);
      console.log(`>>> ISOLATED_HOME=${isoHome}`);
    });
    srv.child.kill();
  }

  // ---- D2-12: R10 runtime ----
  {
    const srv = server();
    await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
    srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    await section('D2-12', async () => {
      const a = await callText(srv, 'huaweicloud_auth_switch', { action: 'temporary', mode: 'memory', ak: 'FAKEAK', sk: 'FAKESK' });
      console.log('auth_switch temporary =>', a.slice(0, 400));
      const b = await callText(srv, 'huaweicloud_auth_sync', {});
      console.log('\nauth_sync =>', b.slice(0, 700));
      const r10 = /R10|suppressed|Runtime credentials are active/i.test(b);
      console.log(`>>> R10 拒绝判定: ${r10}`);
    });
    srv.child.kill();
  }

  console.log('=== DONE ===');
  process.exit(0);
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 45000);