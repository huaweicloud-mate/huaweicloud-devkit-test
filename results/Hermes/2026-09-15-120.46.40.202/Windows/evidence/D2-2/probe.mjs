import { loadRiskRules } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { callTool } from './plugins/huaweicloud-core/src/tools.mjs';

const results = {};

function test(id, description, fn) {
  try {
    const r = fn();
    if (r && r.then) {
      return r.then(res => {
        results[id] = { description, ...res };
        console.log(`[${res.status}] ${id}: ${description}`);
        if (res.detail) console.log(`  -> ${res.detail}`);
      }).catch(e => {
        results[id] = { description, status: 'ERROR', error: e.message };
        console.log(`[ERROR] ${id}: ${description} -> ${e.message}`);
      });
    }
    results[id] = { description, ...r };
    console.log(`[${r.status}] ${id}: ${description}`);
    if (r.detail) console.log(`  -> ${r.detail}`);
  } catch (e) {
    results[id] = { description, status: 'ERROR', error: e.message };
    console.log(`[ERROR] ${id}: ${description} -> ${e.message}`);
  }
}

// D4-10 P2: rule library regression (FIXED: use import)
test('D4-10', 'rule library regression (rules loaded)', () => {
  const rules = loadRiskRules();
  const hasRules = rules && rules.rules && rules.rules.length > 0;
  return { status: hasRules ? 'PASS' : 'FAIL', detail: `rules count=${rules?.rules?.length}` };
});

// D2-2 P2: auth status accuracy (FIXED: check correct field names)
test('D2-2', 'auth status accuracy', async () => {
  const r = await callTool('huaweicloud_auth_status', {});
  // The actual fields are: target, credentialsConfigured, credentialsPath, obsConfigured, etc.
  const hasConfigured = r && (r.credentialsConfigured !== undefined || r.obsConfigured !== undefined);
  return { status: hasConfigured ? 'PASS' : 'FAIL', detail: `credentialsConfigured=${r?.credentialsConfigured}, obsConfigured=${r?.obsConfigured}` };
});

await new Promise(r => setTimeout(r, 3000));

console.log('\n=== SUMMARY ===');
const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
const failCount = Object.values(results).filter(r => r.status === 'FAIL').length;
console.log(`PASS: ${passCount}, FAIL: ${failCount}, Total: ${Object.keys(results).length}`);
Object.entries(results).forEach(([id, r]) => {
  console.log(`  ${id} [${r.status}]: ${r.detail || r.error || ''}`);
});
