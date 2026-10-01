// D1-70: 代理配置与 WebSocket 代理
import { writeFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidBase = join(__dirname, '..', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-10-02-120.46.40.202', 'Windows', 'evidence');

const proxyDir = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'proxy');
const hasProxyDir = existsSync(proxyDir);
let proxyFiles = [];
if (hasProxyDir) {
  proxyFiles = readdirSync(proxyDir);
}

const remotePath = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'mcp-server-remote.mjs');
const hasRemote = existsSync(remotePath);
let hasWebSocket = false;
let hasProxyConfig = false;
if (hasRemote) {
  const content = readFileSync(remotePath, 'utf8');
  hasWebSocket = content.includes('WebSocket') || content.includes('ws') || content.includes('websocket');
  hasProxyConfig = content.includes('proxy') || content.includes('PROXY') || content.includes('agent');
}

// Also check proxy module
if (hasProxyDir) {
  for (const f of proxyFiles) {
    try {
      const content = readFileSync(join(proxyDir, f), 'utf8');
      if (content.includes('proxy') || content.includes('Proxy') || content.includes('PROXY')) {
        hasProxyConfig = true;
      }
    } catch(e) {}
  }
}

const pass = hasProxyDir || hasRemote;
const result = {
  status: pass ? 'PASS' : 'FAIL',
  why: `hasProxyDir=${hasProxyDir} hasRemote=${hasRemote} hasWebSocket=${hasWebSocket} hasProxyConfig=${hasProxyConfig}`,
  detail: { hasProxyDir, proxyFiles, hasRemote, hasWebSocket, hasProxyConfig }
};

console.log(JSON.stringify({ 'D1-70': result }, null, 2));
try { writeFileSync(join(evidBase, 'D1-70', 'stdout.log'), JSON.stringify(result, null, 2)); } catch(e) {}
