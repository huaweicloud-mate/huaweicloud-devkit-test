// 聚焦探针 — Hermes/Linux/2026-10-01 v1.1.8-next.1 (ffd7b474)
const HDK = process.env.HDK_PLUGIN_SRC || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
import { writeFileSync } from 'node:fs';
const results = [];
function record(id, pass, actual, expected, why) { results.push({ id, pass, actual: String(actual).slice(0,120), expected, why }); }
const __spec = "SPEC-MISMATCH";
try {
  const tm = await import(`file://${HDK}/src/telemetry/telemetry.mjs`);
  
  const out = tm.sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123');
  const leaked = /AK123456|SKsecret|Tok123/.test(String(out));
  record('sanitizeValue', !leaked, String(out).slice(0,80), '敏感值被移除', 'sanitizeValue 未脱敏');

} catch (e) {
  results.push({ id: '__EXCEPTION__', pass: false, actual: e && e.message, expected: 'no throw', why: 'probe 异常' });
}
const allPass = results.length > 0 && results.every(r => r.pass);
let status = allPass ? 'PASS' : (__spec || 'FAIL');
const why = results.filter(r => !r.pass).map(r => `${r.id}:${r.why || (r.actual + '!=' + r.expected)}`).join('; ');
const obj = { status, why: why || undefined, executedAt: new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14) };
writeFileSync(new URL('file:///home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-03-113.44.143.91/Linux/evidence/D8-9/stdout.log'), JSON.stringify(obj, null, 2), 'utf8');
console.log(`${cid} => ${status} ${results.filter(r=>!r.pass).length}/results.length 未过: ${why || '无'}`);
