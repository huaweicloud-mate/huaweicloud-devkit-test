const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const hc = await import('file:///' + M + '/hcloud-cli.mjs');
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// D4-13 最小权限：经 devkit runHcloud（resolveCredentials 读 HW_* env = 只读子账号 test001，无 token）
const ro = await hc.runHcloud(['ECS','ListServersDetails','--cli-region=cn-north-4'], {});
const roText = (ro?.stdout || '') + (ro?.stderr || '');
const roOk = roText.includes('servers') && (ro?.exitCode === 0 || ro?.ok === true || roText.includes('count'));

const wr = await hc.runHcloud(['VPC','CreateVpc','--vpc.name=testbot3-ro-verify','--vpc.cidr=10.99.0.0/16','--cli-region=cn-north-4'], { allowWrites: true });
const wrText = (wr?.stdout || '') + (wr?.stderr || '');
const wrDenied = /403|denied|permission|forbidden|insufficient|unauthorized|not.*permission|CAP.01|EFN/i.test(wrText);
const vidMatch = wrText.match(/"id"\s*:\s*"([0-9a-f-]{36})"/);
if (vidMatch) { await hc.runHcloud(['VPC','DeleteVpc','--vpc_id='+vidMatch[1],'--cli-region=cn-north-4'], {}); }

const status = (roOk && wrDenied) ? 'PASS' : 'FAIL';
const rec = { status, why: 'devkit runHcloud 只读子账号: 只读命令成功=' + roOk + '；写命令(CreateVpc)被 IAM 拒=' + wrDenied + ' (写结果片段: ' + wrText.slice(0,90).replace(/\n/g,' ') + ')', executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D4-13' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);