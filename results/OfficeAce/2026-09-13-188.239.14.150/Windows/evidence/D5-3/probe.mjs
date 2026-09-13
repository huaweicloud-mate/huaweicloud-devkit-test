// AI生成
// D5-3 (P1): 工具全量枚举
// Probe: Spawn MCP server, send initialize → tools/list, enumerate all tools and compare with expected 39

import { spawn } from 'child_process';
import { resolve } from 'path';

const SERVER_PATH = resolve('C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src\\mcp-server.mjs');
const EXPECTED_TOOL_COUNT = 39;

// Known expected tool list (from D9-1 results)
const EXPECTED_TOOLS = [
  'huaweicloud_auth_confirm', 'huaweicloud_auth_init', 'huaweicloud_auth_status',
  'huaweicloud_auth_switch', 'huaweicloud_auth_sync', 'huaweicloud_check_cli',
  'huaweicloud_check_update', 'huaweicloud_detect_framework', 'huaweicloud_explain_error',
  'huaweicloud_get_regional_availability', 'huaweicloud_get_service_icon',
  'huaweicloud_hook_check_artifacts', 'huaweicloud_hook_check_command',
  'huaweicloud_hook_check_deploy_plan', 'huaweicloud_list_operations',
  'huaweicloud_list_regions', 'huaweicloud_plan_cli_command', 'huaweicloud_retrieve_skill',
  'huaweicloud_run_approved_command', 'huaweicloud_run_readonly_command',
  'huaweicloud_sandbox_check_user', 'huaweicloud_sandbox_close_session',
  'huaweicloud_sandbox_connect', 'huaweicloud_sandbox_credentials',
  'huaweicloud_sandbox_deploy_check', 'huaweicloud_sandbox_deploy_nginx',
  'huaweicloud_sandbox_exec_one_shot', 'huaweicloud_sandbox_exec_with_session',
  'huaweicloud_sandbox_sign_agreement', 'huaweicloud_sandbox_upload_file',
  'huaweicloud_sandbox_upload_project', 'huaweicloud_search_docs',
  'huaweicloud_search_marketplace', 'huaweicloud_service_catalog',
  'huaweicloud_setup_obs_config', 'huaweicloud_show_profile_redacted',
  'huaweicloud_upgrade', 'huaweicloud_voucher_claim', 'huaweicloud_voucher_status'
];

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
            if (msg.id !== undefined) results[msg.id] = msg;
          } catch (e) {}
        }
      }
    });

    let stderrData = '';
    proc.stderr.on('data', (chunk) => { stderrData += chunk.toString(); });
    proc.on('error', (err) => reject(new Error(`Spawn failed: ${err.message}`)));

    sendJsonRpc(proc, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'd5-3-probe', version: '1.0.0' }
    }, 1);

    const checkInterval = setInterval(() => {
      if (results[1] && !results[2]) {
        const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
        proc.stdin.write(initNotif + '\n');
        sendJsonRpc(proc, 'tools/list', {}, 2);
      }

      if (results[2]) {
        clearInterval(checkInterval);
        clearTimeout(timeout);

        const tools = results[2].result?.tools || [];
        const actualNames = tools.map(t => t.name).sort();
        const expectedSorted = [...EXPECTED_TOOLS].sort();

        // Compare sets
        const actualSet = new Set(actualNames);
        const expectedSet = new Set(expectedSorted);
        const missing = expectedSorted.filter(n => !actualSet.has(n));
        const extra = actualNames.filter(n => !expectedSet.has(n));
        const exactMatch = missing.length === 0 && extra.length === 0;

        console.log('=== D5-3 (P1): 工具全量枚举 ===');
        console.log('Method: Spawn MCP server, enumerate all tools via tools/list');
        console.log('');
        console.log(`Total tools enumerated: ${tools.length}`);
        console.log(`Expected tool count: ${EXPECTED_TOOL_COUNT}`);
        console.log(`Count match: ${tools.length === EXPECTED_TOOL_COUNT ? '✓' : '✗'}`);
        console.log('');
        console.log('Full enumeration (name | hasDescription | hasSchema):');
        for (const tool of tools.sort((a, b) => a.name.localeCompare(b.name))) {
          const hasDesc = typeof tool.description === 'string' && tool.description.length > 0;
          const hasSchema = tool.inputSchema && tool.inputSchema.type === 'object';
          console.log(`  ${tool.name} | desc=${hasDesc} | schema=${hasSchema}`);
        }
        console.log('');
        console.log(`Missing from actual (in expected but not returned): ${missing.length === 0 ? 'none' : missing.join(', ')}`);
        console.log(`Extra in actual (returned but not in expected): ${extra.length === 0 ? 'none' : extra.join(', ')}`);
        console.log(`Exact set match: ${exactMatch ? '✓' : '✗'}`);
        console.log('');
        const allPass = tools.length === EXPECTED_TOOL_COUNT && exactMatch;
        console.log(`Result: ${allPass ? 'PASS' : 'FAIL'}`);
        console.log(`Reason: ${allPass ? `All ${EXPECTED_TOOL_COUNT} tools enumerated, exact match with known list` : 'Mismatch detected'}`);

        proc.kill();
        resolvePromise({ allPass });
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      proc.kill();
      console.log('=== D5-3 (P1): 工具全量枚举 ===');
      console.log('Result: BLOCKED');
      console.log('Reason: Timeout');
      if (stderrData) console.log(`Stderr: ${stderrData.slice(0, 500)}`);
      reject(new Error('Timeout'));
    }, 30000);
  });
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
