import { spawn } from 'node:child_process';
import { join } from 'node:path';

const results = {};
const mcpServerPath = join('plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');

function sendMCPMessage(proc, msg) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(msg) + '\n';
    let buffer = '';
    const timeout = setTimeout(() => reject(new Error('timeout')), 10000);
    
    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        try {
          const parsed = JSON.parse(lines[i]);
          if (parsed.id === msg.id) {
            clearTimeout(timeout);
            resolve(parsed);
            return;
          }
        } catch {}
      }
    });
    
    proc.stdin.write(data);
  });
}

async function runMCPTests() {
  const proc = spawn('node', [mcpServerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  try {
    const initResult = await sendMCPMessage(proc, {
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {},
                clientInfo: { name: 'test-probe', version: '1.0.0' } }
    });
    
    results['init'] = {
      has_result: !!initResult.result,
      server_name: initResult.result?.serverInfo?.name,
      pass: !!initResult.result?.serverInfo
    };

    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

    const toolsResult = await sendMCPMessage(proc, {
      jsonrpc: '2.0', id: 2, method: 'tools/list', params: {}
    });

    const tools = toolsResult.result?.tools || [];
    const toolNames = tools.map(t => t.name);
    
    results['D1-26'] = {
      check_update_registered: toolNames.includes('huaweicloud_check_update'),
      upgrade_registered: toolNames.includes('huaweicloud_upgrade'),
      check_update_has_schema: !!tools.find(t => t.name === 'huaweicloud_check_update')?.inputSchema,
      pass: toolNames.includes('huaweicloud_check_update') && toolNames.includes('huaweicloud_upgrade')
    };
    
    results['D9-1'] = {
      total_tools: tools.length,
      all_have_names: tools.every(t => t.name),
      all_have_descriptions: tools.every(t => t.description),
      pass: tools.length >= 10 && tools.every(t => t.name && t.description)
    };
    
    results['D5-3'] = {
      total_tools: tools.length,
      has_plan: toolNames.includes('huaweicloud_plan_cli_command'),
      has_run_approved: toolNames.includes('huaweicloud_run_approved_command'),
      has_auth_switch: toolNames.includes('huaweicloud_auth_switch'),
      has_service_catalog: toolNames.includes('huaweicloud_service_catalog'),
      pass: tools.length >= 15
    };

    results['D5-1'] = {
      total_tools: tools.length,
      pass: tools.length >= 10
    };

    results['D3-C5'] = {
      has_plan: toolNames.includes('huaweicloud_plan_cli_command'),
      has_list_ops: toolNames.includes('huaweicloud_list_operations'),
      has_check_cli: toolNames.includes('huaweicloud_check_cli'),
      pass: toolNames.includes('huaweicloud_plan_cli_command')
    };

    // D9-2: error code
    const errorResult = await sendMCPMessage(proc, {
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'nonexistent_tool', arguments: {} }
    });
    results['D9-2'] = {
      has_error: !!errorResult.error,
      error_code: errorResult.error?.code,
      pass: !!errorResult.error
    };

    // D9-3: tools/call response format
    const callResult = await sendMCPMessage(proc, {
      jsonrpc: '2.0', id: 4, method: 'tools/call',
      params: { name: 'huaweicloud_check_update', arguments: {} }
    });
    results['D9-3'] = {
      has_result: !!callResult.result,
      has_content: !!callResult.result?.content,
      is_array: Array.isArray(callResult.result?.content),
      pass: !!callResult.result?.content
    };

    // D1-41: check_update MCP return
    if (callResult.result?.content?.[0]?.text) {
      try {
        const ui = JSON.parse(callResult.result.content[0].text);
        results['D1-41'] = {
          has_currentVersion: 'currentVersion' in ui,
          has_updateAvailable: 'updateAvailable' in ui,
          currentVersion: ui.currentVersion,
          result: ui.result,
          pass: 'currentVersion' in ui && 'updateAvailable' in ui
        };
      } catch(e) {
        results['D1-41'] = { error: e.message, pass: false };
      }
    }

    results['D9-4'] = {
      init_ok: results['init'].pass,
      list_ok: results['D9-1'].pass,
      call_ok: results['D9-3'].pass,
      pass: results['init'].pass && results['D9-1'].pass && results['D9-3'].pass
    };

    results['D9-5'] = { transport: 'stdio', pass: true };

  } finally {
    proc.kill();
  }
  return results;
}

runMCPTests().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
