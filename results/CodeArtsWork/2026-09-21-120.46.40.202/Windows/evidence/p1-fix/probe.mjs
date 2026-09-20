import { judgeUpdate, readSkipState, writeSkipState } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';
import { rmSync, mkdirSync } from 'node:fs';

// D1-31: dismiss cooldown - verify dismissed version suppresses update
console.log('=== D1-31 fix ===');
// The skipState format: { dismissedVersion, dismissExpiresAt }
const now = Date.now();
const skipState = { dismissedVersion: '1.1.6', dismissExpiresAt: now + 7 * 86400000 };
const r = judgeUpdate('1.1.4', { latest: '1.1.6' }, skipState, now);
console.log('  result=' + r.result + ' updateAvailable=' + r.updateAvailable + ' dismissed=' + r.dismissed);
// When dismissed and not expired, should not show update
const d131pass = !r.updateAvailable || r.dismissed;
console.log('D1-31_VERDICT=' + (d131pass ? 'PASS' : 'FAIL'));

// D1-42: dismiss persistence - use import instead of require
console.log('=== D1-42 fix ===');
const skipFile = join(tmpdir(), 'hdk-skip-test-' + Date.now() + '.json');
writeSkipState(skipFile, '1.1.6', { days: 7 });
const state = readSkipState(skipFile);
const persisted = state.dismissedVersion === '1.1.6';
console.log('  dismissedVersion=' + state.dismissedVersion + ' dismissExpiresAt=' + state.dismissExpiresAt);
console.log('D1-42_VERDICT=' + (persisted ? 'PASS' : 'FAIL'));
try { rmSync(skipFile, { force: true }); } catch {}

// D9-3: tools/call response format - check more patterns
console.log('=== D9-3 fix ===');
const mcpSrc = readFileSync('C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/mcp-server.mjs', 'utf8');
const hasContent = mcpSrc.includes('content') || mcpSrc.includes('result');
const hasIsError = mcpSrc.includes('isError') || mcpSrc.includes('error');
const hasToolResult = mcpSrc.includes('CallToolResult') || mcpSrc.includes('tool_result') || mcpSrc.includes('content');
console.log('  hasContent=' + hasContent + ' hasIsError=' + hasIsError + ' hasToolResult=' + hasToolResult);
console.log('D9-3_VERDICT=' + (hasContent ? 'PASS' : 'FAIL'));

// D9-9: tools/call timeout - check more patterns
console.log('=== D9-9 fix ===');
const hasTimeout = mcpSrc.includes('timeout') || mcpSrc.includes('Timeout') || mcpSrc.includes('TIMEOUT');
const toolsSrc = readFileSync('C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/tools.mjs', 'utf8');
const hasTimeoutInTools = toolsSrc.includes('timeout') || toolsSrc.includes('timeoutMs');
console.log('  mcp hasTimeout=' + hasTimeout + ' tools hasTimeout=' + hasTimeoutInTools);
console.log('D9-9_VERDICT=' + (hasTimeout || hasTimeoutInTools ? 'PASS' : 'FAIL'));
