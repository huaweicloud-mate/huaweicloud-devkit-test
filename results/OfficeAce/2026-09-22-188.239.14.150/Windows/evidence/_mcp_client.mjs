// AI生成
/**
 * MCP Client Probe - Reusable JSON-RPC stdio client for huaweicloud-devkit MCP server
 * Uses newline-delimited JSON (the server auto-detects this framing)
 */
import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const NODE_PATH = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node.exe';
const MCP_SERVER = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';

let msgId = 0;
let buffer = '';
let pendingResolvers = new Map();

function startMcpServer() {
  const child = spawn(NODE_PATH, [MCP_SERVER], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PATH: 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node;' + (process.env.PATH || ''),
      PYTHONUTF8: '1',
      HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local'
    }
  });

  child.stdout.on('data', (data) => {
    buffer += data.toString();
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      // Handle both Content-Length framing and line-delimited JSON
      if (line.startsWith('Content-Length:')) {
        // Skip header lines, find the JSON body
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const header = line + '\r\n' + buffer.slice(0, headerEnd);
          const match = header.match(/Content-Length:\s*(\d+)/i);
          if (match) {
            const bodyLen = parseInt(match[1]);
            const bodyStart = headerEnd + 4;
            if (buffer.length >= bodyStart + bodyLen) {
              const body = buffer.slice(bodyStart, bodyStart + bodyLen);
              buffer = buffer.slice(bodyStart + bodyLen);
              try {
                const msg = JSON.parse(body);
                resolveMessage(msg);
              } catch (e) {}
            }
          }
        }
        continue;
      }
      try {
        const msg = JSON.parse(line);
        resolveMessage(msg);
      } catch (e) {}
    }
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  return child;
}

function resolveMessage(msg) {
  if (msg.id !== undefined && pendingResolvers.has(msg.id)) {
    pendingResolvers.get(msg.id)(msg);
    pendingResolvers.delete(msg.id);
  }
}

function sendRequest(child, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    // Use newline-delimited JSON
    child.stdin.write(msg + '\n');
    pendingResolvers.set(id, resolve);
    setTimeout(() => {
      if (pendingResolvers.has(id)) {
        pendingResolvers.delete(id);
        reject(new Error(`Timeout waiting for response to ${method} (id=${id})`));
      }
    }, 60000);
  });
}

function sendNotification(child, method, params = {}) {
  const msg = JSON.stringify({ jsonrpc: '2.0', method, params });
  child.stdin.write(msg + '\n');
}

async function main() {
  const command = process.argv[2];
  const child = startMcpServer();

  try {
    const initResp = await sendRequest(child, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-probe', version: '1.0.0' }
    });
    sendNotification(child, 'notifications/initialized');

    if (command === 'init') {
      console.log(JSON.stringify(initResp, null, 2));
    } else if (command === 'list-tools') {
      const resp = await sendRequest(child, 'tools/list', {});
      console.log(JSON.stringify(resp, null, 2));
    } else if (command === 'call-tool') {
      const toolName = process.argv[3];
      const toolArgs = JSON.parse(process.argv[4] || '{}');
      const resp = await sendRequest(child, 'tools/call', {
        name: toolName,
        arguments: toolArgs
      });
      console.log(JSON.stringify(resp, null, 2));
    } else if (command === 'batch') {
      const input = readFileSync(0, 'utf-8');
      const ops = JSON.parse(input);
      const results = [];
      for (const op of ops) {
        if (op.type === 'list-tools') {
          const resp = await sendRequest(child, 'tools/list', {});
          results.push({ op: 'list-tools', result: resp });
        } else if (op.type === 'call-tool') {
          const resp = await sendRequest(child, 'tools/call', {
            name: op.name,
            arguments: op.arguments || {}
          });
          results.push({ op: 'call-tool', name: op.name, result: resp });
        }
      }
      console.log(JSON.stringify(results, null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exitCode = 1;
  } finally {
    child.kill();
    setTimeout(() => process.exit(), 500);
  }
}

main();
