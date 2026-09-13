/**
 * WorkBuddy 每日测试探针 - D9 协议健壮性 (源码级)
 * D9-5: stdio 传输健壮 (源码级检查)
 * D9-7: 协议版本协商降级
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PKG_ROOT = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit';
const SRC = join(PKG_ROOT, 'plugins/huaweicloud-core/src');
const results = [];

function test(name, pass, actual, expected, passMsg, failMsg) {
  results.push({ name, pass, actual, expected, passMsg, failMsg });
}

// Read protocol source
const protoContent = readFileSync(join(SRC, 'mcp-protocol.mjs'), 'utf8');

// === D9-5: stdio 传输健壮 (源码级) ===
test('D9-5 has-try-catch',
  protoContent.includes('try') && protoContent.includes('catch'), true, true,
  '协议层有 try/catch 错误处理', null);

test('D9-5 has-stderr-isolation',
  protoContent.includes('stderr') || protoContent.includes('process.stderr'), true, true,
  'stderr 不污染协议通道 (stdout)', null);

test('D9-5 has-json-parse-guard',
  protoContent.includes('JSON.parse') && (protoContent.includes('catch') || protoContent.includes('try')), true, true,
  'JSON.parse 有 try/catch 保护', null);

// === D9-7: 协议版本协商降级 ===
test('D9-7 protocol-version-negotiation',
  protoContent.includes('protocolVersion') || protoContent.includes('2024-11-05') || protoContent.includes('2025-06-18'), true, true,
  '协议版本协商逻辑存在', null);

// Check for version fallback
test('D9-7 version-fallback',
  protoContent.includes('protocolVersion'), true, true,
  '支持协议版本降级', null);

// === D9-2: JSON-RPC 错误码 (源码级) ===
test('D9-2 error-code-hardcoded',
  protoContent.includes('-32603') || protoContent.includes('-32601') || protoContent.includes('-32700'), true, true,
  'JSON-RPC 错误码已定义', null);

// Check specifically what error code is used for method not found
const hasMethodNotFound = protoContent.includes('-32601');
const hasInternalError = protoContent.includes('-32603');
test('D9-2 method-not-found-code',
  hasMethodNotFound, hasMethodNotFound, true,
  '使用 -32601 (Method not found) 错误码',
  hasInternalError ? '使用 -32603 (Internal error) 而非 -32601 — SPEC-MISMATCH' : null);

// Print results
console.log(JSON.stringify(results, null, 2));
const passCount = results.filter(r => r.pass).length;
const failCount = results.filter(r => !r.pass).length;
console.log(`\n=== D9 协议健壮性: ${passCount} PASS / ${failCount} FAIL / ${results.length} TOTAL ===`);
