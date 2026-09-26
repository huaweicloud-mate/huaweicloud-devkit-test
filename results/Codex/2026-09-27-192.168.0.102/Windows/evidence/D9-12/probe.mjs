import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const src = 'file:///C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/src';
const { dispatch, _decorateResult } = await import(`${src}/mcp-protocol.mjs`);
const { listSkillDirs, findSkillsRoot } = await import(`${src}/tools.mjs`);
const now = new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
const results=[]; const rec=(name,pass,actual,expected)=>results.push({name,pass,actual,expected});
const init = await dispatch('initialize', { protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'Codex',version:'daily'} }, {sessionId:'d9-12'});
rec('initialize-protocolVersion', !!init.protocolVersion, init.protocolVersion, 'present');
rec('initialize-capabilities-tools', !!init.capabilities?.tools, init.capabilities, 'tools capability');
rec('initialize-serverInfo', init.serverInfo?.name === 'huaweicloud-devkit', init.serverInfo, 'huaweicloud-devkit');
const list = await dispatch('tools/list', {}, {sessionId:'d9-12'});
rec('tools-list-nonempty', Array.isArray(list.tools) && list.tools.length >= 40, list.tools?.length, '>=40');
const firstTool = list.tools.find(t => t.name === 'huaweicloud_service_catalog');
rec('callTool-route-tool-present', !!firstTool?.inputSchema, firstTool?.name, 'huaweicloud_service_catalog registered');
const decorated = _decorateResult('d9-12','huaweicloud_service_catalog',{ok:true});
rec('decorate-result-object', decorated && typeof decorated === 'object' && decorated.ok === true, decorated, 'object');
const root = findSkillsRoot(['C:/Users/Administrator/.agents/skills','C:/Users/Administrator/devkit-test/Codex/hdk/skills']);
const dirs = root ? listSkillDirs(root) : [];
rec('skills-root-valid', !!root && dirs.length > 0, {root, count: dirs.length}, 'root with skills');
let unknownCode; try { await dispatch('unknown/method', {}, {sessionId:'d9-12'}); } catch(e) { unknownCode=e.code; }
rec('unknown-method-code', unknownCode === -32601, unknownCode, '-32601');
let invalidCode; try { await dispatch('tools/call', { name:'no_such_tool', arguments:{} }, {sessionId:'d9-12'}); } catch(e) { invalidCode=e.code; }
rec('invalid-tools-call-code', invalidCode === -32602, invalidCode, '-32602');
const failed=results.filter(r=>!r.pass); const out={status:failed.length?'FAIL':'PASS', why: failed.map(f=>`${f.name}: actual=${JSON.stringify(f.actual)} expected=${f.expected}`).join('; ') || 'MCP protocol baseline passed', executedAt:now, results};
writeFileSync(join(__dirname,'stdout.log'), JSON.stringify(out,null,2),'utf8'); console.log(JSON.stringify(out,null,2)); process.exit(failed.length?1:0);
