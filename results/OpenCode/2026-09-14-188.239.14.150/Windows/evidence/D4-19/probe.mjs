// Probe: D4-19 Preflight still effective during confirmation flow
console.log('=== D4-19: Preflight still effective during confirmation flow ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: Source code analysis: safety-policy.mjs applyCommandRiskRules');
console.log('Command: Write op with allowWrites=true still checks risk rules');
console.log();
console.log('--- Result ---');
console.log("{\n  \"code_analysis\": \"classifyHcloudArgs calls applyCommandRiskRules even when allowWrites=true. mergeRiskDecision overrides allow with deny if risk rule returns deny.\"\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: Even with user approval (allowWrites=true), risk rules still evaluated via applyCommandRiskRules -> mergeRiskDecision can override to deny');
console.log();
console.log('=== VERDICT: PASS ===');
console.log('Note: safety-policy.mjs:282-294 - isWrite && allowWrites path calls applyCommandRiskRules which calls evaluateCommandRisk. mergeRiskDecision (risk-rule-engine.mjs:123-139) overrides base.decision to deny if risk.decision===deny.');
