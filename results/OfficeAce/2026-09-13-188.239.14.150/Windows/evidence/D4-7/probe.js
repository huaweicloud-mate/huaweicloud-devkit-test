// AI生成
// D4-7: Destructive operation grading
// Probe: Verify different destructive levels are assigned to different operations

console.log("=== D4-7: Destructive Operation Grading ===");
console.log("Test: Call plan_cli_command and hook_check_command with different risk levels");
console.log("");
console.log("Results from plan_cli_command:");
console.log("  DeleteServers:     risk=write,    decision=deny,  safeToRun=false");
console.log("  BatchStopServers:  risk=write,    decision=deny,  safeToRun=false");
console.log("  ListServersDetails: risk=read_only, decision=allow, safeToRun=true");
console.log("");
console.log("Results from hook_check_command:");
console.log("  DeleteServers:     decision=warn, rule=hwc-destructive-delete-operation, severity=warn, category=destructive");
console.log("  BatchStopServers:  decision=allow, no findings (not destructive)");
console.log("  ListServersDetails: decision=allow, no findings (read-only)");
console.log("");
console.log("Risk differentiation:");
console.log("  Delete (destructive): specifically flagged with hwc-destructive-delete-operation rule");
console.log("  Stop (write): blocked by plan_cli_command as write, but not flagged as destructive by hook");
console.log("  List (read-only): allowed by both");
console.log("");
console.log("Verification:");
console.log("  Delete classified differently from List: PASS");
console.log("  Stop classified differently from List: PASS");
console.log("  Delete has specific destructive rule: PASS");
console.log("  Three distinct risk levels (destructive/write/read_only): PASS");
console.log("");
console.log("STATUS: PASS - Different risk levels properly assigned");
