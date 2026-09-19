const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const mg = await import(SRC+'/mcp-config-merge.mjs');
const bk = await import(SRC+'/mcp-config-backup.mjs');
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
let PASS=0,FAIL=0;const A=(id,l,c,d='')=>{const ok=!!c;ok?PASS++:FAIL++;console.log(`[${ok?'PASS':'FAIL'}] ${id} ${l}${d?' | '+d:''}`);};
// mergeCommandStyle
const r1 = mg.mergeCommandStyle({}, { mcpPath:'/x/mcp-server.mjs' });
console.log('mergeCommandStyle =>', JSON.stringify(r1));
A('D8-10','mergeCommandStyle 注入 command', r1 && r1.entry && /mcp-server\.mjs/.test(JSON.stringify(r1.entry)));
// mergeArgsStyle
const r2 = mg.mergeArgsStyle({}, { mcpPath:'/x/mcp-server.mjs', env:{HCLOUD_BIN:'/b/hcloud'} });
console.log('mergeArgsStyle =>', JSON.stringify(r2));
A('D8-10','mergeArgsStyle 注入 args', r2 && /mcp-server\.mjs/.test(JSON.stringify(r2)));
// mergeMcpServersFile
const r3 = mg.mergeMcpServersFile({}, { mcpPath:'/x/mcp-server.mjs' });
console.log('mergeMcpServersFile =>', JSON.stringify(r3));
A('D8-10','mergeMcpServersFile 注入 server 配置', r3 && /mcp-server\.mjs/.test(JSON.stringify(r3)));
// extractUserDelta + applyUserDelta 幂等
const entry = { command:'node', args:['/x/mcp-server.mjs'], env:{A:'1'} };
const delta = mg.extractUserDelta(entry, 'args');
console.log('extractUserDelta =>', JSON.stringify(delta));
const applied = mg.applyUserDelta({ command:'oldcmd' }, delta, 'args');
console.log('applyUserDelta =>', JSON.stringify(applied));
const applied2 = mg.applyUserDelta(applied, delta, 'args');
const idempotent = JSON.stringify(applied)===JSON.stringify(applied2);
A('D8-10','extractUserDelta→applyUserDelta 幂等', idempotent, JSON.stringify(applied).slice(0,60));
// backup: saveAgentDelta/takeAgentDelta/purgeBackup
const dir = mkdtempSync(join(tmpdir(),'hdk-backup-'));
const file = join(dir,'mcp-backup.json');
const saved = bk.saveAgentDelta('dsh', { mcpPath:'/x/mcp-server.mjs' }, file);
console.log('saveAgentDelta =>', JSON.stringify(saved));
const read = bk.readAgentDelta('dsh', file);
console.log('readAgentDelta =>', JSON.stringify(read));
A('D8-10','saveAgentDelta→readAgentDelta 持久化', saved && read && read.mcpPath==='/x/mcp-server.mjs');
const taken = bk.takeAgentDelta('dsh', file);
console.log('takeAgentDelta =>', JSON.stringify(taken));
A('D8-10','takeAgentDelta 取出', taken && taken.mcpPath==='/x/mcp-server.mjs');
bk.purgeBackup(file);
const after = bk.readAgentDelta('dsh', file);
console.log('purgeBackup 后 readAgentDelta =>', JSON.stringify(after));
A('D8-10','purgeBackup 清空', !after || Object.keys(after||{}).length===0);
rmSync(dir, {recursive:true, force:true});
console.log(`\n=== 汇总: PASS=${PASS} FAIL=${FAIL} ===`);
process.exit(FAIL?1:0);
