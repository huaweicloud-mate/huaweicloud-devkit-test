/**
 * D8-7: MCP server tools/list compliance
 * dispatch('tools/list') must return all tools with name, description, inputSchema
 */
import { dispatch } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence/D8-7';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

// 1. dispatch('tools/list') returns tools array
const result = await dispatch('tools/list', {});
check('returns-tools', result && Array.isArray(result.tools), `tools=${result?.tools?.length}`);
check('tools-non-empty', result.tools.length > 0, `count=${result.tools.length}`);

// 2. Each tool has name, description, inputSchema
const allTools = result.tools;
check('all-have-name', allTools.every(t => typeof t.name === 'string' && t.name.length > 0), 'all tools have name');
check('all-have-desc', allTools.every(t => typeof t.description === 'string' && t.description.length > 0), 'all tools have desc');
check('all-have-schema', allTools.every(t => t.inputSchema !== undefined), 'all tools have schema');

// 3. Tool names are unique
const names = allTools.map(t => t.name);
check('names-unique', new Set(names).size === names.length, `unique=${new Set(names).size}, total=${names.length}`);

// 4. Tool names follow huaweicloud_ prefix
check('names-prefixed', names.every(n => n.startsWith('huaweicloud_')), `non-prefixed: ${names.filter(n => !n.startsWith('huaweicloud_')).join(',')}`);

// 5. Schemas with type=object have properties
const objectSchemas = allTools.filter(t => t.inputSchema?.type === 'object');
check('object-schemas-have-props', objectSchemas.every(t => t.inputSchema.properties !== undefined), `count=${objectSchemas.length}`);

// 6. Minimum tool count
check('min-tool-count', allTools.length >= 39, `count=${allTools.length}`);

// 7. Core tools present
check('has-check-cli', names.includes('huaweicloud_check_cli'), `found=${names.includes('huaweicloud_check_cli')}`);
check('has-list-ops', names.includes('huaweicloud_list_operations'), `found=${names.includes('huaweicloud_list_operations')}`);
check('has-show-profile', names.includes('huaweicloud_show_profile_redacted'), `found=${names.includes('huaweicloud_show_profile_redacted')}`);
check('has-check-update', names.includes('huaweicloud_check_update'), `found=${names.includes('huaweicloud_check_update')}`);
check('has-upgrade', names.includes('huaweicloud_upgrade'), `found=${names.includes('huaweicloud_upgrade')}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D8-7', why: allPass ? 'tools/list returns all tools with proper MCP format' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20260930103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);