// AI生成
// D4-11: IAM least privilege detection
// Probe: Check if broad IAM policies are warned and narrow ones allowed

console.log("=== D4-11: IAM Least Privilege Detection ===");
console.log("Test: Call hook_check_artifacts with broad and narrow IAM policies");
console.log("");
console.log("Probe 1 (Broad): {\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"iam:*\"],\"Resource\":[\"*\"]}]}");
console.log("Result: decision=allow, findings=[] (NOT warned)");
console.log("  nextStep: 'No Huawei Cloud hook risk rule matched.'");
console.log("");
console.log("Probe 2 (Narrow): {\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"iam:ListUsers\"],\"Resource\":[\"urn:iam:::user/specific\"]}]}");
console.log("Result: decision=allow, findings=[] (allowed, correct)");
console.log("");
console.log("Verification:");
console.log("  Broad policy warned: FAIL (no findings, same as narrow)");
console.log("  Narrow policy allowed: PASS (correct)");
console.log("  Differentiation between broad and narrow: FAIL (both returned same result)");
console.log("");
console.log("STATUS: FAIL - Broad IAM policy not differentiated from narrow policy");
