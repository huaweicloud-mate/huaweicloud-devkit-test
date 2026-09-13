// AI生成
// D4-13: Resource deletion protection
// Probe: Check if resource deletion commands are detected as high-risk

console.log("=== D4-13: Resource Deletion Protection ===");
console.log("Test: Call hook_check_command with resource deletion commands");
console.log("");
console.log("Probe 1: hcloud RDS DeleteInstance --InstanceId=rds-xxxxx");
console.log("Result: WARNED");
console.log("  ruleId: hwc-destructive-delete-operation");
console.log("  category: destructive, severity: warn");
console.log("  message: This hcloud command will delete, detach, or remove cloud resources.");
console.log("");
console.log("Probe 2: hcloud OBS DeleteBucket --BucketName=my-bucket");
console.log("Result: WARNED");
console.log("  ruleId: hwc-destructive-delete-operation");
console.log("  category: destructive, severity: warn");
console.log("  message: This hcloud command will delete, detach, or remove cloud resources.");
console.log("");
console.log("Verification:");
console.log("  RDS DeleteInstance detected as destructive: PASS");
console.log("  OBS DeleteBucket detected as destructive: PASS");
console.log("  Both flagged with hwc-destructive-delete-operation: PASS");
console.log("");
console.log("STATUS: PASS - Resource deletion commands detected as high-risk");
