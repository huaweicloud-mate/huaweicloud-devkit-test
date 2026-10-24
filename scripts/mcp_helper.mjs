#!/usr/bin/env node
/**
 * Helper: spawn MCP server with stdio framing and send/receive JSON-RPC.
 * Uses async spawn because mcp-server.mjs exits on stdin close.
 */
import { spawn } from 'node:child_process';

const MCP_PATH = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';

function frame(obj) {
  const json = JSON.stringify(obj);
  return `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`;
}

function parseResponses(stdout) {
  // Split by Content-Length header marker
  const parts = stdout.split(/Content-Length:\s*\d+\s*\r\n\r\n/);
  const results = [];
  for (let i = 1; i < parts.length; i++) {
    try { results.push(JSON.parse(parts[i])); } catch(e) {}
  }
  return results;
}

export function mcpCall(messages, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const p = spawn('node', [MCP_PATH], { stdio: ['pipe','pipe','pipe'] });
    let out = '';
    let resolved = false;
    p.stdout.on('data', d => { out += d.toString(); });
    p.stderr.on('data', () => {});
    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolve(parseResponses(out));
    };
    p.on('exit', finish);

    let delay = 300;
    for (const msg of messages) {
      setTimeout(() => {
        try { p.stdin.write(frame(msg)); } catch(e) {}
      }, delay);
      delay += 800;
    }
    // Wait for either the tool response to arrive (id=2) or a generous timeout
    // before closing stdin. Closing stdin too early kills slow services (IAM/DMS/DEW
    // whose hcloud --help output is large and takes >1s to stream).
    const pollForResponse = () => {
      const responses = parseResponses(out);
      const hasToolResponse = responses.some(r => r.id === 2);
      if (hasToolResponse) {
        // Give a short grace period for stdout to fully flush, then end.
        setTimeout(() => { try { p.stdin.end(); } catch(e) {} }, 200);
        return true;
      }
      return false;
    };
    const pollInterval = setInterval(() => {
      if (pollForResponse()) clearInterval(pollInterval);
    }, 200);
    setTimeout(() => { clearInterval(pollInterval); try { p.stdin.end(); } catch(e) {} }, Math.max(delay + 1000, timeoutMs - 2000));
    setTimeout(() => {
      try { clearInterval(pollInterval); p.kill(); } catch(e) {}
      finish();
    }, timeoutMs);
  });
}

export async function mcpInitialize() {
  return mcpCall([{
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } }
  }], 6000);
}

export async function mcpToolsList() {
  return mcpCall([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }
  ], 10000);
}

export async function mcpToolCall(name, args = {}, timeoutMs = 30000) {
  return mcpCall([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } }
  ], timeoutMs);
}
