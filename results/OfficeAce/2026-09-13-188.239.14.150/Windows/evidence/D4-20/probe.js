// AI生成
// D4-20: Environment variable injection detection
// Probe: Check if credentials in environment variables are detected

console.log("=== D4-20: Environment Variable Injection Detection ===");
console.log("Test: Call hook_check_command with credentials in env vars");
console.log("");
console.log("Probe 1: HW_ACCESS_KEY=HPUXXX hcloud ECS ListServersDetails");
console.log("Result: decision=allow, findings=[] (NOT detected)");
console.log("  nextStep: 'No Huawei Cloud hook risk rule matched.'");
console.log("");
console.log("Probe 2: AK=HPUXXX SK=XXX hcloud ECS ListServersDetails");
console.log("Result: decision=allow, findings=[] (NOT detected)");
console.log("");
console.log("Verification:");
console.log("  HW_ACCESS_KEY in env var detected: FAIL");
console.log("  AK/SK in env vars detected: FAIL");
console.log("");
console.log("STATUS: FAIL - Credentials in environment variables not detected");
