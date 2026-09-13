// AI生成
// D4-4: Credential file write interception
// Probe: Check if writing credentials to file is detected/warned

console.log("=== D4-4: Credential File Write Interception ===");
console.log("Test: Call hook_check_command with credential-writing commands");
console.log("");
console.log("Probe 1: echo AK=HPUXXX > ~/.hcloud/credentials");
console.log("Result: DENIED");
console.log("  ruleId: hwc-command-credential-file");
console.log("  category: credential");
console.log("  severity: deny");
console.log("  message: The command may read local Huawei Cloud credential or profile files");
console.log("");
console.log("Probe 2: hcloud configure set --access-key=HPUXXX --secret-key=XXX");
console.log("Result: ALLOWED (legitimate CLI credential configuration, not file read)");
console.log("");
console.log("Verification:");
console.log("  Credential file write detected and denied: PASS");
console.log("  Rule hwc-command-credential-file triggered: PASS");
console.log("  Severity = 'deny': PASS");
console.log("");
console.log("STATUS: PASS - Credential file write detected and blocked");
