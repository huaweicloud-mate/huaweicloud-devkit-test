// MCP tool: huaweicloud_check_update + source probe update-check.mjs
// Test: mirror lag detection
// Expected: no version倒退 when dist-tags unavailable
// Actual: check_failed (no false downgrade suggestion)
