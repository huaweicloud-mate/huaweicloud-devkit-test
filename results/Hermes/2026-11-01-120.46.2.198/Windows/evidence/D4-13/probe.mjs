import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// D4-13 最小权限：只读子账号(test001)下 —— 只读命令应成功，写命令应被 IAM 拒绝
// 运行方式: python scripts/run-as-readonly.py node this-probe.mjs
// (run-as-readonly 注入 HW_ACCESS_KEY/HW_SECRET_KEY = 只读子账号，无 token)
let roOk = false, roDetail = '';
try {
  const out = execFileSync('hcloud', ['ECS','ListServersDetails','--cli-region=cn-north-4'], { encoding:'utf8', timeout:60000 }).toString();
  roOk = out.includes('servers') && !out.includes('[USE_ERROR]');
  roDetail = roOk ? '成功返回实例清单' : out.slice(0,120);
} catch (e) { roDetail = (e.stdout||'')+(e.stderr||''); roOk = /servers/i.test(roDetail); }

let wrDenied = false, wrDetail = '';
try {
  const out = execFileSync('hcloud', ['VPC','CreateVpc','--vpc.name=testbot3-ro-deny-test','--vpc.cidr=10.99.0.0/16','--cli-region=cn-north-4'], { encoding:'utf8', timeout:60000 }).toString();
  wrDetail = out.slice(0,150);
  wrDenied = /403|denied|permission|forbidden|insufficient|permission_denied|CAM|EFN|unauthorized/i.test(out);
} catch (e) {
  const t = (e.stdout||'')+(e.stderr||'');
  wrDetail = t.slice(0,200);
  wrDenied = /403|denied|permission|forbidden|insufficient|unauthorized|not.*permission/i.test(t);
}

const status = (roOk && wrDenied) ? 'PASS' : 'FAIL';
const rec = { status, why: `只读子账号: 只读命令成功=${roOk} (${roDetail.slice(0,80)})；写命令被拒=${wrDenied} (${wrDetail.slice(0,100)})`, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D4-13' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);