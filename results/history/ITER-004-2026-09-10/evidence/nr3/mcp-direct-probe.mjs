// MCP stdio JSON-RPC probe: check_update + retrieve_skill direct against sandbox mcp-server.mjs
import { spawn } from 'node:child_process';

const serverPath = 'C:/Users/Administrator/devkit-test/huaweicloud-devkit-test/results/ITER-004-2026-09-10/evidence/nr3/.sandbox/app-fix-s/plugins/huaweicloud-core/src/mcp-server.mjs';
const pluginHome = 'C:/Users/Administrator/devkit-test/huaweicloud-devkit-test/results/ITER-004-2026-09-10/evidence/nr3/hermes-profile-runtime/plugin-home';

const child = spawn('node', [serverPath], {
  env: {
    ...process.env,
    HUAWEICLOUD_HOME: 'C:/Users/Administrator/devkit-test/huaweicloud-devkit-test/results/ITER-004-2026-09-10/evidence/nr3/hermes-profile-runtime/hc-home',
    HUAWEICLOUD_DEVKIT_HOME: pluginHome,
    USERPROFILE: pluginHome,
    HOME: pluginHome,
    APPDATA: pluginHome + '/AppData/Roaming',
    LOCALAPPDATA: pluginHome + '/AppData/Local',
    npm_config_registry: 'http://127.0.0.1:45998',
    npm_config_cache: 'C:/Users/Administrator/devkit-test/huaweicloud-devkit-test/results/ITER-004-2026-09-10/evidence/nr3/hermes-profile-runtime/npm-cache',
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buf = '';
let stderrBuf = '';
const pending = new Map();
let nextId = 1;

function send(method, params) {
  const id = nextId++;
  const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  child.stdin.write(msg + '\n');
  return new Promise((resolve) => pending.set(id, resolve));
}

child.stdout.on('data', (d) => {
  buf += d.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { console.log('[RAW-NONJSON]', line.slice(0, 500)); continue; }
    if (obj.id && pending.has(obj.id)) {
      pending.get(obj.id)(obj);
      pending.delete(obj.id);
    } else if (obj.method === 'notifications/message' || obj.method?.startsWith('notifications')) {
      console.log('[SRV-NOTIF]', JSON.stringify(obj));
    }
  }
});

child.stderr.on('data', (d) => { stderrBuf += d.toString(); });

async function main() {
  const init = await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'probe', version: '1.0.0' },
  });
  console.log('=== INITIALIZE ===');
  console.log(JSON.stringify(init, null, 2));
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  // wait a tick for server readiness
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n=== TOOLS/CALL huaweicloud_check_update ===');
  const cu = await send('tools/call', { name: 'huaweicloud_check_update', arguments: {} });
  console.log(JSON.stringify(cu, null, 2));

  console.log('\n=== TOOLS/CALL huaweicloud_retrieve_skill (huaweicloud-core) ===');
  const rs = await send('tools/call', { name: 'huaweicloud_retrieve_skill', arguments: { name: 'huaweicloud-core' } });
  const rsStr = JSON.stringify(rs);
  console.log(rsStr.length > 800 ? rsStr.slice(0, 800) + '...[TRUNCATED len=' + rsStr.length + ']' : rsStr);

  console.log('\n=== STDERR (first 2000 chars) ===');
  console.log(stderrBuf.slice(0, 2000));

  child.kill();
  process.exit(0);
}

child.on('error', (e) => { console.error('SPAWN ERROR', e); process.exit(1); });
setTimeout(() => { console.error('TIMEOUT'); console.error('STDERR:', stderrBuf.slice(0, 3000)); child.kill(); process.exit(1); }, 45000).unref();
main();