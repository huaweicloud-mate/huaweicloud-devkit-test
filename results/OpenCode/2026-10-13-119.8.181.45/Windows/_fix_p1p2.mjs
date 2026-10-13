// Fix probes for D4-6, D6-4, D8-9
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const now = () => { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds()); };

const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk';

const safety = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/safety-policy.mjs');
const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');
const tel = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/telemetry/telemetry.mjs');

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// Fix probe for ${id}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}
const TS = now();

// D4-6: adminPass回显警告 — redactSecrets masks adminPass
try {
  const r = safety.redactSecrets('adminPass=MySecret123');
  const redacted = /<redacted>/.test(r) && !/MySecret123/.test(r);
  // Also test classifyTextCommand denies write with adminPass
  const cmd = 'hcloud ECS create-servers --adminPass MySecret123';
  const d = safety.classifyTextCommand(cmd);
  const denied = /deny/i.test(JSON.stringify(d));
  writeCase('D4-6', (redacted && denied)
    ? { caseId:'D4-6', status:'PASS', why:'adminPass 被 redactSecrets 脱敏为 <redacted>，写操作被 deny', sample: JSON.stringify({redacted: r, classify: d}).slice(0,300), executedAt:TS }
    : { caseId:'D4-6', status:'FAIL', why:'脱敏/拦截异常: redacted='+redacted+' denied='+denied, executedAt:TS });
} catch (e) { writeCase('D4-6', { caseId:'D4-6', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

// D6-4: 并发调度正确性 — 5 concurrent list_operations calls
try {
  const svcs = ['ECS', 'VPC', 'RDS', 'OBS', 'IAM'];
  const promises = svcs.map(s => tools.callTool('huaweicloud_list_operations', { service: s }));
  const results = await Promise.all(promises);
  let ok = 0;
  const details = [];
  for (let i = 0; i < results.length; i++) {
    const body = JSON.stringify(results[i]);
    const hasOps = /service.*command.*hcloud/i.test(body);
    if (hasOps) ok++;
    details.push({svc: svcs[i], hasOps});
  }
  const noDeadlock = ok === 5;
  writeCase('D6-4', noDeadlock
    ? { caseId:'D6-4', status:'PASS', why:'5 并发 list_operations 全部成功返回，无死锁', sample: JSON.stringify(details).slice(0,200), executedAt:TS }
    : { caseId:'D6-4', status:'FAIL', why:'并发异常: ok='+ok+'/5', sample: JSON.stringify(details), executedAt:TS });
} catch (e) { writeCase('D6-4', { caseId:'D6-4', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

// D8-9: 安装 ID 与遥测值脱敏
// sanitizeValue only truncates length/whitespace, doesn't redact AK/SK → SPEC-MISMATCH
try {
  const id1 = tel.generateOrRecoverInstallId();
  const id2 = tel.generateOrRecoverInstallId();
  const stable = id1 === id2 && id1.length > 0;
  // sanitizeValue: check what it actually does
  const sanitizedAK = tel.sanitizeValue('AKABCDEFGHIJKLMNOP');
  const sanitizedNormal = tel.sanitizeValue('cn-north-4');
  const sanitizedLong = tel.sanitizeValue('A'.repeat(300));
  const truncates = sanitizedLong.length < 300;
  const preservesNormal = sanitizedNormal === 'cn-north-4';
  // sanitizeValue does NOT redact AK/SK (only truncates/whitespace) → SPEC-MISMATCH
  const redactsAK = /<redacted>|\*/.test(sanitizedAK) && !/AKABCDEFG/.test(sanitizedAK);
  writeCase('D8-9', (stable && truncates && preservesNormal && !redactsAK)
    ? { caseId:'D8-9', status:'SPEC-MISMATCH', why:'installId 生成/恢复稳定持久(sstable='+stable+')；但 sanitizeValue 仅截断长度/去空白，不脱敏 AK/SK。设计预期"移除 AK/SK/token 等敏感值"', detail: JSON.stringify({sanitizedAK, sanitizedNormal, truncates, redactsAK}), rootCause: 'telemetry/telemetry.mjs:sanitizeValue - 仅 replace(/[\\r\\n\\t]+/g," ").trim()+slice，无敏感字段脱敏', executedAt:TS }
    : { caseId:'D8-9', status:'FAIL', why:'installId 或 sanitizeValue 异常: stable='+stable+' truncate='+truncates+' preserve='+preservesNormal, executedAt:TS });
} catch (e) { writeCase('D8-9', { caseId:'D8-9', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

console.log('fix D4-6/D6-4/D8-9 done.');
