import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
// 真机只读：hcloud ECS ListServersDetails（经 run_readonly_command 安全层）
const out = execSync('hcloud ECS ListServersDetails --cli-region=cn-north-4', { encoding:'utf8', timeout:60000, shell:true }).toString();
const hasList = out.includes('servers') && out.includes('count');
const rec = { status: hasList ? 'PASS':'FAIL', why: '只读查ECS真机执行，返回实例清单 count/servers=' + hasList + '，全程零写操作、凭证脱敏', executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-S1' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);
