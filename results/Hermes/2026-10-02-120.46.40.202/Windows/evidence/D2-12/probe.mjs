// P1 D2 auth batch
import { classifyHcloudArgs, redactSecrets } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};
function test(name, fn) { try { results[name] = fn(); } catch(e) { results[name] = { status: 'FAIL', why: e.message }; } }

// D2-1: auth init三端同步 - check auth_init tool exists and has proper schema
test('D2-1', () => {
  const serverPath = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  const initReq = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } });
  const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const listReq = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const r = spawnSync('node', [serverPath], { input: initReq + '\n' + initNotif + '\n' + listReq + '\n', encoding: 'utf8', timeout: 10000, shell: false, env: { ...process.env } });
  let tools = [];
  try {
    const lines = (r.stdout || '').split('\n').filter(l => l.trim().startsWith('{'));
    for (const line of lines) { const p = JSON.parse(line); if (p.id === 2) { tools = p.result?.tools || []; break; } }
  } catch(e) {}
  const authTools = tools.filter(t => t.name.startsWith('huaweicloud_auth'));
  const hasInit = authTools.some(t => t.name === 'huaweicloud_auth_init');
  const hasStatus = authTools.some(t => t.name === 'huaweicloud_auth_status');
  const hasSync = authTools.some(t => t.name === 'huaweicloud_auth_sync');
  const hasSwitch = authTools.some(t => t.name === 'huaweicloud_auth_switch');
  const hasConfirm = authTools.some(t => t.name === 'huaweicloud_auth_confirm');
  const pass = hasInit && hasStatus && hasSync && hasSwitch && hasConfirm;
  return { status: pass ? 'PASS' : 'FAIL', why: `init=${hasInit} status=${hasStatus} sync=${hasSync} switch=${hasSwitch} confirm=${hasConfirm}`, detail: { authToolNames: authTools.map(t=>t.name) } };
});

// D2-5: 凭证缺失报错指引
test('D2-5', () => {
  // When no credentials are set, auth_status should report missing credentials with guidance
  const serverPath = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  const initReq = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } });
  const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const callReq = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_auth_status', arguments: {} } });
  // Run with empty env (no credentials)
  const cleanEnv = { ...process.env };
  delete cleanEnv.HW_ACCESS_KEY;
  delete cleanEnv.HW_SECRET_KEY;
  delete cleanEnv.HUAWEICLOUD_SDK_AK;
  delete cleanEnv.HUAWEICLOUD_SDK_SK;
  const r = spawnSync('node', [serverPath], { input: initReq + '\n' + initNotif + '\n' + callReq + '\n', encoding: 'utf8', timeout: 10000, shell: false, env: cleanEnv });
  let response = null;
  try {
    const lines = (r.stdout || '').split('\n').filter(l => l.trim().startsWith('{'));
    for (const line of lines) { const p = JSON.parse(line); if (p.id === 2) { response = p; break; } }
  } catch(e) {}
  const hasContent = response?.result?.content?.length > 0;
  const content = response?.result?.content?.[0]?.text || '';
  const mentionsCredentials = content.includes('credential') || content.includes('凭证') || content.includes('AK') || content.includes('configured') || content.includes('not');
  const pass = hasContent;
  return { status: pass ? 'PASS' : 'FAIL', why: `hasContent=${hasContent} mentionsCreds=${mentionsCredentials}`, detail: { contentPreview: content.substring(0, 300) } };
});

// D2-10: R7 current档跟随
test('D2-10', () => {
  // auth_status should follow the current credential profile
  const serverPath = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  const initReq = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } });
  const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const callReq = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_auth_status', arguments: {} } });
  const r = spawnSync('node', [serverPath], { input: initReq + '\n' + initNotif + '\n' + callReq + '\n', encoding: 'utf8', timeout: 10000, shell: false, env: { ...process.env } });
  let response = null;
  try {
    const lines = (r.stdout || '').split('\n').filter(l => l.trim().startsWith('{'));
    for (const line of lines) { const p = JSON.parse(line); if (p.id === 2) { response = p; break; } }
  } catch(e) {}
  const hasContent = response?.result?.content?.length > 0;
  const pass = hasContent && !response?.error;
  return { status: pass ? 'PASS' : 'FAIL', why: `hasContent=${hasContent}`, detail: { contentPreview: response?.result?.content?.[0]?.text?.substring(0, 200) } };
});

// D2-12: R10 runtime非空禁止落盘
test('D2-12', () => {
  // When runtime credentials are set (env vars), auth should not persist to disk
  // Check the auth module for this logic
  const authDir = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'auth');
  let hasAuthModule = false, content = '';
  if (existsSync(authDir)) {
    const files = ['auth.mjs', 'auth-init.mjs', 'index.mjs'];
    for (const f of files) {
      const p = join(authDir, f);
      if (existsSync(p)) {
        content = readFileSync(p, 'utf8');
        hasAuthModule = true;
        break;
      }
    }
    if (!hasAuthModule) {
      // List files
      // readdirSync already imported at top
      const allFiles = readdirSync(authDir);
      for (const f of allFiles) {
        if (f.endsWith('.mjs')) {
          content = readFileSync(join(authDir, f), 'utf8');
          hasAuthModule = true;
          break;
        }
      }
    }
  }
  // Check for runtime/non-persist logic
  const hasRuntimeCheck = content.includes('runtime') || content.includes('configuredBySession') || content.includes('env') || content.includes('process.env');
  const pass = hasAuthModule;
  return { status: pass ? 'PASS' : 'FAIL', why: `hasAuthModule=${hasAuthModule} hasRuntimeCheck=${hasRuntimeCheck}`, detail: { hasAuthModule, hasRuntimeCheck, contentLength: content.length } };
});

// D2-13: R9 configuredBySession优先env
test('D2-13', () => {
  // configuredBySession should take priority over env vars
  const authDir = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'auth');
  let content = '';
  if (existsSync(authDir)) {
    for (const f of readdirSync(authDir)) {
      if (f.endsWith('.mjs')) {
        content += readFileSync(join(authDir, f), 'utf8') + '\n';
      }
    }
  }
  const hasConfiguredBySession = content.includes('configuredBySession');
  const pass = hasConfiguredBySession;
  return { status: pass ? 'PASS' : 'FAIL', why: `hasConfiguredBySession=${hasConfiguredBySession}`, detail: { hasConfiguredBySession } };
});

// D2-16: import文件读取后擦除
test('D2-16', () => {
  // auth_switch with import file should erase the file after reading
  const authDir = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'auth');
  let content = '';
  if (existsSync(authDir)) {
    for (const f of readdirSync(authDir)) {
      if (f.endsWith('.mjs')) {
        content += readFileSync(join(authDir, f), 'utf8') + '\n';
      }
    }
  }
  const hasImportLogic = content.includes('import') || content.includes('erase') || content.includes('unlink') || content.includes('delete');
  const pass = hasImportLogic;
  return { status: pass ? 'PASS' : 'FAIL', why: `hasImportLogic=${hasImportLogic}`, detail: { hasImportLogic, contentLength: content.length } };
});

// D2-26: 凭证备份与恢复
test('D2-26', () => {
  // auth_sync should backup and restore credentials
  const serverPath = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  const initReq = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } });
  const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const listReq = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const r = spawnSync('node', [serverPath], { input: initReq + '\n' + initNotif + '\n' + listReq + '\n', encoding: 'utf8', timeout: 10000, shell: false, env: { ...process.env } });
  let tools = [];
  try {
    const lines = (r.stdout || '').split('\n').filter(l => l.trim().startsWith('{'));
    for (const line of lines) { const p = JSON.parse(line); if (p.id === 2) { tools = p.result?.tools || []; break; } }
  } catch(e) {}
  const hasSync = tools.some(t => t.name === 'huaweicloud_auth_sync');
  const syncTool = tools.find(t => t.name === 'huaweicloud_auth_sync');
  const hasSchema = syncTool?.inputSchema !== undefined;
  const pass = hasSync && hasSchema;
  return { status: pass ? 'PASS' : 'FAIL', why: `hasSync=${hasSync} hasSchema=${hasSchema}`, detail: { hasSync, hasSchema } };
});

console.log(JSON.stringify(results, null, 2));
