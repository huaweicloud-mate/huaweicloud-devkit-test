// Real probe for EXP-C4-11
// Calls huaweicloud_list_operations (real cloud API via KooCLI)
// SUT: huaweicloud-devkit@1.1.12
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const creds = JSON.parse(readFileSync('C:/Users/Administrator/.config/huaweicloud/credentials.json', 'utf8'));
const res = await callTool('huaweicloud_list_operations', { service: 'DDS', region: creds.region }, { credentials: creds });
const stdout = res?.result?.stdout || '';
const m = stdout.match(/Available Operations:\\n([\\s\\S]*?)\\n\\n/);
const ops = m ? m[1].split('\\n').map(s=>s.trim()).filter(s=>s) : [];
const out = { caseId: 'EXP-C4-11', status: ops.length > 0 ? 'PASS' : 'FAIL', why: 'opCount=' + ops.length, executedAt: '20261024052500', result: { opCount: ops.length, ops: ops.slice(0,5) } };
writeFileSync(join(import.meta.dirname, 'stdout.log'), JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));
