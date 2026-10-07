// D3-S4 场景-领券闭环 (真云实测: status→claim→status 幂等闭环)
// 断言: voucher_status 返回 claimed 状态; 重复 claim 幂等返回「已领取」; 复核 status 仍 claimed。
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-29-1.94.218.129/Linux/evidence/D3-S4/stdout.log';
const DOMAIN = '842591186fa245929e1b5c186a4cf784';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 160), expected: String(expected) });
}

async function txt(r) {
  const t = r?.result?.content?.[0]?.text ?? r?.content?.[0]?.text ?? JSON.stringify(r);
  return t;
}

let st1, claim, st2;
try { st1 = await txt(await callTool('huaweicloud_voucher_status', { domain_id: DOMAIN })); } catch (e) { st1 = `err:${e.message}`; }
try { claim = await txt(await callTool('huaweicloud_voucher_claim', { domain_id: DOMAIN })); } catch (e) { claim = `err:${e.message}`; }
try { st2 = await txt(await callTool('huaweicloud_voucher_status', { domain_id: DOMAIN })); } catch (e) { st2 = `err:${e.message}`; }

test('D3-S4', 'status-returns-claimed', /claimed/.test(st1) && /true/.test(st1), st1, 'voucher_status 返回 claimed=true');
test('D3-S4', 'claim-idempotent', /已领取|claimed|already/.test(claim), claim, '重复 claim 幂等返回已领取/claimed');
test('D3-S4', 'recheck-still-claimed', /claimed/.test(st2) && /true/.test(st2), st2, '复核 status 仍 claimed=true');

const output = JSON.stringify({ total: results.length, passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);