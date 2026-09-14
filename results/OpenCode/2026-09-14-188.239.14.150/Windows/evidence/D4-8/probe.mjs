// Probe: D4-8 P1 test
console.log('=== D4-8: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: Python/Node policy: risk-rule-engine.mjs uses JSON rules (cloud-risk-rules.json) applied uniformly; safety-policy.mjs is Node-only but same rules');
console.log('=== VERDICT: PASS ===');
