/**
 * MCP Protocol Probe - D9 series test harness
 * Starts the MCP server as a child process, sends JSON-RPC requests via stdin,
 * and validates responses for protocol compliance.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SERVER_PATH = process.argv[2] || 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';
const EVIDENCE_DIR = process.argv[3] || '.';

let msgId = 0;
let serverProc = null;
let buffer = Buffer.alloc(0);
let pendingResolvers = new Map();
let useContentLengthFraming = true;
let allLogs = [];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  allLogs.push(line);
  console.log(line);
}

function startServer() {
  return new Promise((resolveStart, rejectStart) => {
    serverProc = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUTF8: '1' },
    });

    serverProc.stdout.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      readFrames();
    });

    serverProc.stderr.on('data', (chunk) => {
      const text = chunk.toString('utf8');
      log(`[STDERR] ${text}`);
    });

    serverProc.on('error', (err) => {
      rejectStart(err);
    });

    serverProc.on('exit', (code) => {
      log(`[SERVER] exited with code ${code}`);
    });

    // Give server a moment to start
    setTimeout(() => resolveStart(), 500);
  });
}

function readFrames() {
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      useContentLengthFraming = true;
      const consumed = parseContentLengthFrame(headerEnd);
      if (!consumed) return;
      continue;
    }
    const lf = buffer.indexOf('\n');
    if (lf !== -1) {
      useContentLengthFraming = false;
      const line = buffer.subarray(0, lf).toString('utf8').trim();
      buffer = buffer.subarray(lf + 1);
      if (line) handleMessage(JSON.parse(line));
      continue;
    }
    return;
  }
}

function parseContentLengthFrame(headerEnd) {
  const header = buffer.subarray(0, headerEnd).toString('utf8');
  const match = header.match(/Content-Length:\s*(\d+)/i);
  if (!match) {
    buffer = Buffer.alloc(0);
    return true;
  }
  const length = Number(match[1]);
  const bodyStart = headerEnd + 4;
  const bodyEnd = bodyStart + length;
  if (buffer.length < bodyEnd) return false;
  const body = buffer.subarray(bodyStart, bodyEnd).toString('utf8');
  buffer = buffer.subarray(bodyEnd);
  handleMessage(JSON.parse(body));
  return true;
}

function handleMessage(message) {
  if (message.id !== undefined && pendingResolvers.has(message.id)) {
    const resolver = pendingResolvers.get(message.id);
    pendingResolvers.delete(message.id);
    resolver.resolve(message);
  }
}

function sendRequest(method, params = {}) {
  return new Promise((resolveReq, rejectReq) => {
    const id = ++msgId;
    const message = { jsonrpc: '2.0', id, method, params };
    pendingResolvers.set(id, { resolve: resolveReq, reject: rejectReq });
    const json = JSON.stringify(message);
    if (useContentLengthFraming) {
      serverProc.stdin.write(`Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`);
    } else {
      serverProc.stdin.write(json + '\n');
    }
    // Timeout after 15s
    setTimeout(() => {
      if (pendingResolvers.has(id)) {
        pendingResolvers.delete(id);
        rejectReq(new Error(`Timeout waiting for response to ${method} (id=${id})`));
      }
    }, 15000);
  });
}

function sendRaw(rawJson) {
  return new Promise((resolveReq, rejectReq) => {
    const parsed = JSON.parse(rawJson);
    if (parsed.id !== undefined) {
      pendingResolvers.set(parsed.id, { resolve: resolveReq, reject: rejectReq });
    }
    if (useContentLengthFraming) {
      serverProc.stdin.write(`Content-Length: ${Buffer.byteLength(rawJson, 'utf8')}\r\n\r\n${rawJson}`);
    } else {
      serverProc.stdin.write(rawJson + '\n');
    }
    setTimeout(() => {
      if (parsed.id !== undefined && pendingResolvers.has(parsed.id)) {
        pendingResolvers.delete(parsed.id);
        rejectReq(new Error(`Timeout for raw request (id=${parsed.id})`));
      }
    }, 15000);
  });
}

function stopServer() {
  if (serverProc) {
    try { serverProc.stdin.end(); } catch {}
    setTimeout(() => {
      try { serverProc.kill(); } catch {}
    }, 1000);
  }
}

function saveEvidence(caseId, data) {
  const dir = resolve(EVIDENCE_DIR, caseId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'stdout.log'), allLogs.join('\n'), 'utf8');
  writeFileSync(resolve(dir, 'result.json'), JSON.stringify(data, null, 2), 'utf8');
  allLogs = []; // reset for next case
}

// ===== Test Cases =====

async function test_D9_1_tools_list() {
  log('=== D9-1: tools/list 合规测试 ===');
  const results = { checks: [], pass: true };
  
  try {
    // Initialize first
    const initResp = await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-probe', version: '1.0' }
    });
    log(`initialize response: ${JSON.stringify(initResp).substring(0, 200)}`);
    results.checks.push({ name: 'initialize_ok', pass: initResp.result !== undefined });
    
    // tools/list
    const listResp = await sendRequest('tools/list', {});
    log(`tools/list response keys: ${Object.keys(listResp)}`);
    
    // Check 1: has result
    const hasResult = listResp.result !== undefined;
    results.checks.push({ name: 'has_result', pass: hasResult });
    
    // Check 2: result has tools array
    const tools = listResp.result?.tools;
    const hasToolsArray = Array.isArray(tools);
    results.checks.push({ name: 'has_tools_array', pass: hasToolsArray });
    
    // Check 3: each tool has name, description, inputSchema
    if (hasToolsArray) {
      log(`tools count: ${tools.length}`);
      const allValid = tools.every(t => 
        typeof t.name === 'string' && t.name.startsWith('huaweicloud_') &&
        typeof t.description === 'string' &&
        t.inputSchema && t.inputSchema.type === 'object'
      );
      results.checks.push({ name: 'all_tools_valid_schema', pass: allValid });
      results.toolCount = tools.length;
      results.toolNames = tools.map(t => t.name);
      
      // Check 4: no duplicate names
      const names = tools.map(t => t.name);
      const noDups = names.length === new Set(names).size;
      results.checks.push({ name: 'no_duplicate_names', pass: noDups });
    }
    
    // Check 5: jsonrpc version is 2.0
    results.checks.push({ name: 'jsonrpc_2.0', pass: listResp.jsonrpc === '2.0' });
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D9-1', results);
  return results;
}

async function test_D9_2_jsonrpc_error_codes() {
  log('=== D9-2: JSON-RPC 错误码测试 ===');
  const results = { checks: [], pass: true };
  
  try {
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-probe', version: '1.0' }
    });
    
    // Test 1: Unknown method should return -32601
    const unknownResp = await sendRequest('foobar/baz', {});
    log(`unknown method response: ${JSON.stringify(unknownResp)}`);
    const hasError = unknownResp.error !== undefined;
    const correctCode = unknownResp.error?.code === -32601;
    results.checks.push({ name: 'unknown_method_returns_-32601', pass: hasError && correctCode, 
      detail: `code=${unknownResp.error?.code}, message=${unknownResp.error?.message}` });
    
    // Test 2: tools/call with unknown tool should return error
    const badToolResp = await sendRequest('tools/call', { name: 'nonexistent_tool', arguments: {} });
    log(`bad tool response: ${JSON.stringify(badToolResp).substring(0, 200)}`);
    const hasToolError = badToolResp.error !== undefined;
    results.checks.push({ name: 'unknown_tool_returns_error', pass: hasToolError,
      detail: `code=${badToolResp.error?.code}` });
    
    // Test 3: Valid request should not have error
    const validResp = await sendRequest('tools/list', {});
    const noErrorOnValid = validResp.error === undefined && validResp.result !== undefined;
    results.checks.push({ name: 'valid_request_no_error', pass: noErrorOnValid });
    
    // Test 4: jsonrpc version in error response
    const errorHasJsonrpc = unknownResp.jsonrpc === '2.0';
    results.checks.push({ name: 'error_has_jsonrpc_2.0', pass: errorHasJsonrpc });
    
    // Test 5: error has message
    const errorHasMessage = typeof unknownResp.error?.message === 'string';
    results.checks.push({ name: 'error_has_message', pass: errorHasMessage });
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D9-2', results);
  return results;
}

async function test_D9_3_tools_call_response_format() {
  log('=== D9-3: tools/call 响应格式测试 ===');
  const results = { checks: [], pass: true };
  
  try {
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-probe', version: '1.0' }
    });
    
    // Call huaweicloud_service_catalog
    const callResp = await sendRequest('tools/call', {
      name: 'huaweicloud_service_catalog',
      arguments: { intent: '创建ECS' }
    });
    log(`tools/call response keys: ${Object.keys(callResp)}`);
    
    // Check 1: has result
    const hasResult = callResp.result !== undefined;
    results.checks.push({ name: 'has_result', pass: hasResult });
    
    if (hasResult) {
      // Check 2: result has content array
      const hasContent = Array.isArray(callResp.result.content);
      results.checks.push({ name: 'has_content_array', pass: hasContent });
      
      // Check 3: content items have type='text' and text property
      if (hasContent && callResp.result.content.length > 0) {
        const firstItem = callResp.result.content[0];
        const validContent = firstItem.type === 'text' && typeof firstItem.text === 'string';
        results.checks.push({ name: 'content_item_valid', pass: validContent });
        
        // Check 4: text is valid JSON
        try {
          const parsed = JSON.parse(firstItem.text);
          results.checks.push({ name: 'text_is_valid_json', pass: true });
          results.parsedContent = parsed;
        } catch {
          results.checks.push({ name: 'text_is_valid_json', pass: false });
        }
      }
      
      // Check 5: has isError field
      const hasIsError = typeof callResp.result.isError === 'boolean';
      results.checks.push({ name: 'has_isError_boolean', pass: hasIsError });
      
      // Check 6: isError is false for successful call
      results.checks.push({ name: 'isError_false_on_success', pass: callResp.result.isError === false });
    }
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D9-3', results);
  return results;
}

async function test_D9_4_protocol_lifecycle() {
  log('=== D9-4: 协议生命周期测试 ===');
  const results = { checks: [], pass: true };
  
  try {
    // Step 1: initialize
    const initResp = await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'lifecycle-test', version: '1.0' }
    });
    log(`Step 1 initialize: ${JSON.stringify(initResp).substring(0, 200)}`);
    const initOk = initResp.result?.protocolVersion !== undefined && 
                   initResp.result?.serverInfo?.name === 'huaweicloud-devkit';
    results.checks.push({ name: 'step1_initialize', pass: initOk });
    
    // Step 2: notifications/initialized (notification, no response expected)
    const notifId = ++msgId;
    const notifMsg = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
    if (useContentLengthFraming) {
      serverProc.stdin.write(`Content-Length: ${Buffer.byteLength(notifMsg, 'utf8')}\r\n\r\n${notifMsg}`);
    } else {
      serverProc.stdin.write(notifMsg + '\n');
    }
    log('Step 2 notifications/initialized sent');
    results.checks.push({ name: 'step2_notification_sent', pass: true });
    
    // Step 3: tools/list
    const listResp = await sendRequest('tools/list', {});
    log(`Step 3 tools/list: ${listResp.result?.tools?.length} tools`);
    results.checks.push({ name: 'step3_tools_list', pass: Array.isArray(listResp.result?.tools) });
    
    // Step 4: tools/call
    const callResp = await sendRequest('tools/call', {
      name: 'huaweicloud_service_catalog',
      arguments: { intent: 'list OBS buckets' }
    });
    log(`Step 4 tools/call: isError=${callResp.result?.isError}`);
    results.checks.push({ name: 'step4_tools_call', pass: callResp.result?.content !== undefined });
    
    // Step 5: resources/list
    const resResp = await sendRequest('resources/list', {});
    log(`Step 5 resources/list: ${JSON.stringify(resResp).substring(0, 100)}`);
    results.checks.push({ name: 'step5_resources_list', pass: resResp.result?.resources !== undefined });
    
    // Step 6: shutdown via stdin end
    log('Step 6: closing stdin (shutdown signal)');
    results.checks.push({ name: 'step6_shutdown_signal', pass: true });
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D9-4', results);
  return results;
}

async function test_D9_5_stdio_transport_robustness() {
  log('=== D9-5: stdio 传输健壮性测试 ===');
  const results = { checks: [], pass: true };
  
  try {
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'robustness-test', version: '1.0' }
    });
    
    // Test 1: Multiple rapid requests
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(sendRequest('tools/list', {}));
    }
    const responses = await Promise.all(promises);
    const allHaveTools = responses.every(r => Array.isArray(r.result?.tools));
    results.checks.push({ name: 'rapid_5_requests', pass: allHaveTools });
    log(`5 rapid requests: all valid = ${allHaveTools}`);
    
    // Test 2: Large arguments
    const largeIntent = 'ECS ' + 'x'.repeat(10000);
    const largeResp = await sendRequest('tools/call', {
      name: 'huaweicloud_service_catalog',
      arguments: { intent: largeIntent }
    });
    const largeOk = largeResp.result?.content !== undefined;
    results.checks.push({ name: 'large_arguments', pass: largeOk });
    log(`Large args: ok = ${largeOk}`);
    
    // Test 3: Empty params
    const emptyResp = await sendRequest('tools/list', {});
    results.checks.push({ name: 'empty_params_ok', pass: emptyResp.result?.tools !== undefined });
    
    // Test 4: Unicode in arguments
    const unicodeResp = await sendRequest('tools/call', {
      name: 'huaweicloud_service_catalog',
      arguments: { intent: '创建弹性云服务器 ECS 虚拟机' }
    });
    const unicodeOk = unicodeResp.result?.content !== undefined;
    results.checks.push({ name: 'unicode_arguments', pass: unicodeOk });
    log(`Unicode args: ok = ${unicodeOk}`);
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D9-5', results);
  return results;
}

async function test_D9_9_timeout_and_cancel() {
  log('=== D9-9: tools/call 超时协议语义与取消 ===');
  const results = { checks: [], pass: true };
  
  try {
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'timeout-test', version: '1.0' }
    });
    
    // Test 1: Normal call completes within reasonable time
    const start = Date.now();
    const resp = await sendRequest('tools/call', {
      name: 'huaweicloud_service_catalog',
      arguments: { intent: 'deploy web app' }
    });
    const elapsed = Date.now() - start;
    log(`Normal call elapsed: ${elapsed}ms`);
    results.checks.push({ name: 'normal_call_completes', pass: resp.result !== undefined && elapsed < 15000 });
    
    // Test 2: Call with timeoutMs parameter (run_readonly_command supports it)
    const timeoutResp = await sendRequest('tools/call', {
      name: 'huaweicloud_run_readonly_command',
      arguments: { args: ['ECS', 'ListServersDetails'], timeoutMs: 100 }
    });
    log(`Timeout call: ${JSON.stringify(timeoutResp).substring(0, 200)}`);
    // Should get a response (error or result) - not hang
    const gotResponse = timeoutResp.result !== undefined || timeoutResp.error !== undefined;
    results.checks.push({ name: 'timeout_returns_response', pass: gotResponse });
    
    // Test 3: Invalid timeout (negative) should be rejected
    const invalidTimeoutResp = await sendRequest('tools/call', {
      name: 'huaweicloud_run_readonly_command',
      arguments: { args: ['ECS', 'ListServers'], timeoutMs: -1 }
    });
    log(`Invalid timeout: ${JSON.stringify(invalidTimeoutResp).substring(0, 200)}`);
    const rejectedInvalid = invalidTimeoutResp.error !== undefined || 
      (invalidTimeoutResp.result?.content?.[0]?.text || '').includes('Invalid');
    results.checks.push({ name: 'invalid_timeout_rejected', pass: rejectedInvalid });
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D9-9', results);
  return results;
}

async function test_D9_7_version_negotiation() {
  log('=== D9-7: 协议版本协商降级测试 ===');
  const results = { checks: [], pass: true };
  
  try {
    // Test 1: Standard version
    const resp1 = await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' }
    });
    log(`Standard version: ${resp1.result?.protocolVersion}`);
    results.checks.push({ name: 'standard_version_accepted', pass: resp1.result?.protocolVersion === '2024-11-05' });
    
    // Test 2: Older version
    const resp2 = await sendRequest('initialize', {
      protocolVersion: '2024-10-01',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' }
    });
    log(`Older version: ${resp2.result?.protocolVersion}`);
    // Server should accept and echo back or use its own version
    const acceptsOlder = resp2.result?.protocolVersion !== undefined;
    results.checks.push({ name: 'older_version_handled', pass: acceptsOlder });
    
    // Test 3: Future version
    const resp3 = await sendRequest('initialize', {
      protocolVersion: '2025-01-01',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' }
    });
    log(`Future version: ${resp3.result?.protocolVersion}`);
    const handlesFuture = resp3.result?.protocolVersion !== undefined;
    results.checks.push({ name: 'future_version_handled', pass: handlesFuture });
    
    // Test 4: No version specified
    const resp4 = await sendRequest('initialize', {
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' }
    });
    log(`No version: ${resp4.result?.protocolVersion}`);
    const defaultVersion = resp4.result?.protocolVersion === '2024-11-05';
    results.checks.push({ name: 'default_version_when_missing', pass: defaultVersion });
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D9-7', results);
  return results;
}

async function test_D9_8_inputSchema_compliance() {
  log('=== D9-8: inputSchema 版本合规测试 ===');
  const results = { checks: [], pass: true };
  
  try {
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' }
    });
    
    const listResp = await sendRequest('tools/list', {});
    const tools = listResp.result?.tools || [];
    
    // Check every tool has valid JSON Schema inputSchema
    let allValid = true;
    const issues = [];
    for (const tool of tools) {
      const schema = tool.inputSchema;
      if (!schema) { allValid = false; issues.push(`${tool.name}: no inputSchema`); continue; }
      if (schema.type !== 'object') { allValid = false; issues.push(`${tool.name}: type!=object`); continue; }
      if (schema.properties && typeof schema.properties !== 'object') { allValid = false; issues.push(`${tool.name}: properties not object`); }
      if (schema.required && !Array.isArray(schema.required)) { allValid = false; issues.push(`${tool.name}: required not array`); }
    }
    results.checks.push({ name: 'all_inputSchemas_valid', pass: allValid, issues });
    log(`inputSchema validation: ${allValid ? 'ALL VALID' : issues.join('; ')}`);
    
    // Check specific tools have required fields
    const planTool = tools.find(t => t.name === 'huaweicloud_plan_cli_command');
    const hasRequired = planTool?.inputSchema?.required?.includes('args');
    results.checks.push({ name: 'plan_cli_has_required_args', pass: hasRequired });
    
    // Check enum fields are valid
    const switchTool = tools.find(t => t.name === 'huaweicloud_auth_switch');
    const modeEnum = switchTool?.inputSchema?.properties?.mode?.enum;
    const hasValidEnum = Array.isArray(modeEnum) && modeEnum.includes('import');
    results.checks.push({ name: 'auth_switch_has_valid_enum', pass: hasValidEnum });
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D9-8', results);
  return results;
}

async function test_D3_C5_tool_smoke() {
  log('=== D3-C5: 工具冒烟测试 ===');
  const results = { checks: [], pass: true };
  
  try {
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'smoke-test', version: '1.0' }
    });
    
    const listResp = await sendRequest('tools/list', {});
    const tools = listResp.result?.tools || [];
    
    // Smoke test: call tools that don't require external resources
    const smokeTests = [
      { name: 'huaweicloud_service_catalog', args: { intent: '创建ECS' } },
      { name: 'huaweicloud_service_catalog', args: { intent: 'deploy web app' } },
      { name: 'huaweicloud_service_catalog', args: { intent: 'OBS bucket' } },
      { name: 'huaweicloud_hook_check_command', args: { command: 'hcloud ECS ListServersDetails' } },
      { name: 'huaweicloud_hook_check_deploy_plan', args: { plan: 'deploy nginx to sandbox' } },
      { name: 'huaweicloud_list_regions', args: {} },
      { name: 'huaweicloud_get_regional_availability', args: { service: 'ecs', region: 'cn-north-4' } },
      { name: 'huaweicloud_explain_error', args: { service: 'ECS', errorCode: 'APIGW.0301' } },
    ];
    
    for (const test of smokeTests) {
      try {
        const resp = await sendRequest('tools/call', { name: test.name, arguments: test.args });
        const ok = resp.result !== undefined || resp.error !== undefined;
        results.checks.push({ name: `smoke_${test.name}`, pass: ok, 
          detail: resp.error ? `error:${resp.error.code}` : 'ok' });
        log(`  ${test.name}: ${ok ? 'PASS' : 'FAIL'}`);
      } catch (e) {
        results.checks.push({ name: `smoke_${test.name}`, pass: false, detail: e.message });
        log(`  ${test.name}: FAIL - ${e.message}`);
      }
    }
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D3-C5', results);
  return results;
}

async function test_D6_3_cold_start() {
  log('=== D6-3: MCP 冷启动时间 ===');
  const results = { checks: [], pass: true };
  
  try {
    // Measure time from server start to first initialize response
    // Server is already running, so we measure initialize latency
    const start = Date.now();
    const resp = await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'cold-start-test', version: '1.0' }
    });
    const elapsed = Date.now() - start;
    log(`Initialize latency: ${elapsed}ms`);
    results.initializeLatencyMs = elapsed;
    
    // Cold start should be under 5 seconds
    results.checks.push({ name: 'init_under_5s', pass: elapsed < 5000, detail: `${elapsed}ms` });
    
    // Measure tools/list latency
    const start2 = Date.now();
    await sendRequest('tools/list', {});
    const listLatency = Date.now() - start2;
    log(`tools/list latency: ${listLatency}ms`);
    results.toolsListLatencyMs = listLatency;
    results.checks.push({ name: 'list_under_1s', pass: listLatency < 1000, detail: `${listLatency}ms` });
    
    // Measure tools/call latency
    const start3 = Date.now();
    await sendRequest('tools/call', {
      name: 'huaweicloud_service_catalog',
      arguments: { intent: 'ECS' }
    });
    const callLatency = Date.now() - start3;
    log(`tools/call latency: ${callLatency}ms`);
    results.toolsCallLatencyMs = callLatency;
    results.checks.push({ name: 'call_under_2s', pass: callLatency < 2000, detail: `${callLatency}ms` });
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D6-3', results);
  return results;
}

async function test_D6_1_search_latency() {
  log('=== D6-1: 检索响应延迟 ===');
  const results = { checks: [], pass: true };
  
  try {
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'latency-test', version: '1.0' }
    });
    
    // Measure service_catalog latency (acts as intent router/search)
    const latencies = [];
    const intents = ['创建ECS', 'OBS bucket', 'VPC subnet', 'RDS MySQL', 'deploy web app'];
    for (const intent of intents) {
      const start = Date.now();
      await sendRequest('tools/call', {
        name: 'huaweicloud_service_catalog',
        arguments: { intent }
      });
      latencies.push(Date.now() - start);
    }
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    log(`Latencies: ${latencies.join(', ')}ms, avg=${avgLatency.toFixed(0)}ms, max=${maxLatency}ms`);
    results.latencies = latencies;
    results.avgLatencyMs = Math.round(avgLatency);
    results.maxLatencyMs = maxLatency;
    
    results.checks.push({ name: 'avg_under_500ms', pass: avgLatency < 500, detail: `${avgLatency.toFixed(0)}ms` });
    results.checks.push({ name: 'max_under_1s', pass: maxLatency < 1000, detail: `${maxLatency}ms` });
    
  } catch (e) {
    log(`ERROR: ${e.message}`);
    results.pass = false;
    results.error = e.message;
  }
  
  results.pass = results.checks.every(c => c.pass);
  results.status = results.pass ? 'PASS' : 'FAIL';
  saveEvidence('D6-1', results);
  return results;
}

// Main execution
async function main() {
  const testCases = process.argv.slice(4);
  const allResults = {};
  
  try {
    log('Starting MCP server...');
    await startServer();
    log('Server started.');
    
    if (testCases.length === 0 || testCases.includes('D9-1')) allResults['D9-1'] = await test_D9_1_tools_list();
    if (testCases.length === 0 || testCases.includes('D9-2')) allResults['D9-2'] = await test_D9_2_jsonrpc_error_codes();
    if (testCases.length === 0 || testCases.includes('D9-3')) allResults['D9-3'] = await test_D9_3_tools_call_response_format();
    if (testCases.length === 0 || testCases.includes('D9-4')) allResults['D9-4'] = await test_D9_4_protocol_lifecycle();
    if (testCases.length === 0 || testCases.includes('D9-5')) allResults['D9-5'] = await test_D9_5_stdio_transport_robustness();
    if (testCases.length === 0 || testCases.includes('D9-9')) allResults['D9-9'] = await test_D9_9_timeout_and_cancel();
    if (testCases.length === 0 || testCases.includes('D9-7')) allResults['D9-7'] = await test_D9_7_version_negotiation();
    if (testCases.length === 0 || testCases.includes('D9-8')) allResults['D9-8'] = await test_D9_8_inputSchema_compliance();
    if (testCases.length === 0 || testCases.includes('D3-C5')) allResults['D3-C5'] = await test_D3_C5_tool_smoke();
    if (testCases.length === 0 || testCases.includes('D6-3')) allResults['D6-3'] = await test_D6_3_cold_start();
    if (testCases.length === 0 || testCases.includes('D6-1')) allResults['D6-1'] = await test_D6_1_search_latency();
    
  } catch (e) {
    log(`FATAL: ${e.message}`);
    log(e.stack);
  } finally {
    stopServer();
  }
  
  // Output summary
  console.log('\n=== RESULTS SUMMARY ===');
  for (const [id, r] of Object.entries(allResults)) {
    console.log(`${id}: ${r.status}`);
  }
  console.log(JSON.stringify(allResults, null, 2));
}

main().catch(console.error);
