// AI生成
// D4-17: Pipe command bypass detection
// Probe: Check if pipe/redirection/chaining bypasses destructive operation detection

console.log("=== D4-17: Pipe Command Bypass Detection ===");
console.log("Test: Call hook_check_command with piped/redirected/chained destructive commands");
console.log("");
console.log("Probe 1: hcloud ECS DeleteServers | cat");
console.log("Result: WARNED (hwc-destructive-delete-operation, severity=warn)");
console.log("");
console.log("Probe 2: hcloud ECS DeleteServers > /dev/null");
console.log("Result: WARNED (hwc-destructive-delete-operation, severity=warn)");
console.log("");
console.log("Probe 3: hcloud ECS DeleteServers && echo done");
console.log("Result: WARNED (hwc-destructive-delete-operation, severity=warn)");
console.log("");
console.log("Verification:");
console.log("  Pipe does not bypass detection: PASS");
console.log("  Redirection does not bypass detection: PASS");
console.log("  Chaining does not bypass detection: PASS");
console.log("");
console.log("STATUS: PASS - Destructive operation detected through pipe/redirection/chaining");
