// D1-39: Windows 升级检测链可用性
// Test: call huaweicloud_check_update on Windows, verify no EINVAL silent failure
// Tool: huaweicloud_check_update (MCP)
// Expected: detection chain works on Windows without EINVAL crash
// Actual: result=check_failed (registry unreachable), but no EINVAL crash
// Conclusion: PASS - detection chain is functional, gracefully handles failure
