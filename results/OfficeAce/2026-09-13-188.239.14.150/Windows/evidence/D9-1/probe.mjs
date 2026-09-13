// AI生成
// D9-1 (P1): tools/list合规
// Probe: Spawn MCP server, send initialize → tools/list, verify 39 tools with valid JSON schemas

import { spawn } from 'child_process';
import { resolve } from 'path';

const SERVER_PATH = resolve('C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src\\mcp-server.mjs');
const EXPECTED_TOOL_COUNT = 39;

function sendJsonRpc(proc, method, params, id) {
  const msg = JSON.stringify({ jsonrpc: '2.0', method, params: params || {}, id });
  proc.stdin.write(msg + '\n');
}

function main() {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
      cwd: 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk'
    });

    let buffer = '';
    const messages = [];
    const results = {};

    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (line) {
          try {
            const msg = JSON.parse(line);
            messages.push(msg);
            if (msg.id !== undefined) {
              results[msg.id] = msg;
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
      }
    });

    let stderrData = '';
    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn MCP server: ${err.message}`));
    });

    // Send initialize
    sendJsonRpc(proc, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'd9-1-probe', version: '1.0.0' }
    }, 1);

    // Wait for initialize response, then send initialized notification + tools/list
    const checkInterval = setInterval(() => {
      if (results[1] && !results[2]) {
        // Send initialized notification
        const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
        proc.stdin.write(initNotif + '\n');

        // Send tools/list
        sendJsonRpc(proc, 'tools/list', {}, 2);
      }

      if (results[2]) {
        clearInterval(checkInterval);
        clearTimeout(timeout);

        const toolsResp = results[2];
        const tools = toolsResp.result?.tools || [];

        // Verification
        const checks = {
          tool_count: tools.length,
          expected_count: EXPECTED_TOOL_COUNT,
          count_match: tools.length === EXPECTED_TOOL_COUNT,
        };

        // Check each tool has valid schema
        let validSchemas = 0;
        let invalidSchemas = [];
        const toolNames = [];
        for (const tool of tools) {
          toolNames.push(tool.name);
          const hasName = typeof tool.name === 'string' && tool.name.length > 0;
          const hasSchema = tool.inputSchema && typeof tool.inputSchema === 'object';
          const schemaHasType = hasSchema && tool.inputSchema.type === 'object';
          const schemaHasProps = hasSchema && typeof tool.inputSchema.properties === 'object';
          if (hasName && hasSchema && schemaHasType && schemaHasProps) {
            validSchemas++;
          } else {
            invalidSchemas.push({ name: tool.name, hasName, hasSchema, schemaHasType, schemaHasProps });
          }
        }

        // Check for duplicates
        const nameCounts = {};
        for (const n of toolNames) { nameCounts[n] = (nameCounts[n] || 0) + 1; }
        const duplicates = Object.entries(nameCounts).filter(([_, c]) => c > 1).map(([n, c]) => `${n} (${c}x)`);

        checks.valid_schemas = validSchemas;
        checks.invalid_schemas_count = invalidSchemas.length;
        checks.all_schemas_valid = invalidSchemas.length === 0;
        checks.duplicate_names = duplicates;
        checks.no_duplicates = duplicates.length === 0;

        const allPass = checks.count_match && checks.all_schemas_valid && checks.no_duplicates;

        // Output
        console.log('=== D9-1 (P1): tools/list合规 ===');
        console.log('Method: Spawn MCP server via stdio, send initialize → tools/list');
        console.log('');
        console.log(`Server: ${SERVER_PATH}`);
        console.log(`Initialize response: ok=${results[1]?.result ? true : false}`);
        console.log('');
        console.log(`Tool count: ${checks.tool_count} (expected ${checks.expected_count})`);
        console.log(`Count match: ${checks.count_match ? '✓' : '✗'}`);
        console.log(`Valid schemas: ${checks.valid_schemas}/${checks.tool_count}`);
        console.log(`All schemas valid: ${checks.all_schemas_valid ? '✓' : '✗'}`);
        if (invalidSchemas.length > 0) {
          console.log(`Invalid schemas: ${JSON.stringify(invalidSchemas)}`);
        }
        console.log(`Duplicate names: ${duplicates.length === 0 ? 'none' : duplicates.join(', ')}`);
        console.log(`No duplicates: ${checks.no_duplicates ? '✓' : '✗'}`);
        console.log('');
        console.log('Tool names:');
        for (const name of toolNames.sort()) {
          console.log(`  - ${name}`);
        }
        console.log('');
        console.log(`Result: ${allPass ? 'PASS' : 'FAIL'}`);
        console.log(`Reason: ${allPass ? `Exactly ${EXPECTED_TOOL_COUNT} tools returned, all with valid JSON schemas, no duplicates` : 'See checks above'}`);

        proc.kill();
        resolvePromise({ allPass, checks, toolNames });
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      proc.kill();
      console.log('=== D9-1 (P1): tools/list合规 ===');
      console.log('Result: BLOCKED');
      console.log('Reason: Timeout waiting for MCP server response');
      if (stderrData) console.log(`Stderr: ${stderrData.slice(0, 500)}`);
      reject(new Error('Timeout'));
    }, 30000);
  });
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
