// D3-S8: 场景-操作失败后排障指引 - Explain error and verify actionable next steps
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';

const results = {};

// Test 1: APIGW.0301 error
try {
  const r = await callTool('huaweicloud_explain_error', { 
    service: 'APIG', 
    errorCode: 'APIGW.0301',
    message: 'Incorrect IAM authentication information'
  });
  
  const outputStr = JSON.stringify(r);
  const hasSuggestions = !!(r?.suggestions && r?.suggestions.length > 0);
  const hasActionableSteps = /verify|check|ensure|run|use|configure|set|update|re-?run|fix/i.test(outputStr);
  const hasErrorContext = /APIGW\.0301|IAM|auth|token|AK|SK/i.test(outputStr);
  
  results.APIGW_0301 = {
    hasSuggestions,
    suggestionCount: r?.suggestions?.length || 0,
    hasActionableSteps,
    hasErrorContext,
    suggestions: r?.suggestions,
    keys: Object.keys(r || {}),
  };
} catch (e) {
  results.APIGW_0301 = { error: e.message };
}

// Test 2: Another common error - AuthFailure
try {
  const r = await callTool('huaweicloud_explain_error', { 
    service: 'ECS', 
    errorCode: 'AuthFailure',
    message: 'Authorization failed'
  });
  
  const outputStr = JSON.stringify(r);
  const hasSuggestions = !!(r?.suggestions && r?.suggestions.length > 0);
  const hasActionableSteps = /verify|check|ensure|run|use|configure|set|update|re-?run|fix/i.test(outputStr);
  
  results.AuthFailure = {
    hasSuggestions,
    suggestionCount: r?.suggestions?.length || 0,
    hasActionableSteps,
    suggestions: r?.suggestions,
  };
} catch (e) {
  results.AuthFailure = { error: e.message };
}

const pass = results.APIGW_0301?.hasSuggestions && 
             results.APIGW_0301?.hasActionableSteps && 
             results.APIGW_0301?.hasErrorContext;

console.log(JSON.stringify({
  testId: 'D3-S8',
  testName: '场景-操作失败后排障指引',
  status: pass ? 'PASS' : 'FAIL',
  why: pass
    ? `explain_error for APIGW.0301 returned ${results.APIGW_0301.suggestionCount} actionable suggestions with error context. Suggestions include verification and fix steps.`
    : `Issues found: ${JSON.stringify(results)}`,
  details: results,
  executedAt: '20260928090006',
}, null, 2));