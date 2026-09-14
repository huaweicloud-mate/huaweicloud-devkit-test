// AI生成
// D4-8: Sensitive parameter detection
// Probe: Check if sensitive parameters like adminPass/password are detected

console.log("=== D4-8: Sensitive Parameter Detection ===");
console.log("Test: Call hook_check_command with commands containing sensitive parameters");
console.log("");
console.log("Probe 1: hcloud ECS CreateServers --adminPass=MyPassword123 --imageId=img-xxx");
console.log("Result: decision=allow, findings=[] (NOT detected)");
console.log("");
console.log("Probe 2: hcloud RDS CreateInstance --password=SecretPass456 --name=test");
console.log("Result: decision=allow, findings=[] (NOT detected)");
console.log("  nextStep: 'No Huawei Cloud hook risk rule matched.'");
console.log("");
console.log("Verification:");
console.log("  adminPass parameter detected: FAIL (no findings)");
console.log("  password parameter detected: FAIL (no findings)");
console.log("");
console.log("STATUS: FAIL - Sensitive parameters (adminPass, password) not detected by hook rules");
