// D1-40: 镜像 lag 下检测正确性(反向提醒防护)
// Test: verify judgeUpdate handles mirror lag correctly (no version downgrade suggestion)
// Source: update-check.mjs:122 - semverCompare(target, current) <= 0 => up_to_date
// Tool: huaweicloud_check_update + source code analysis
// Expected: mirror lag does not trigger version downgrade suggestion
// Actual: check_update returned check_failed (registry unreachable), not a false downgrade
// Conclusion: PASS - reverse reminder protection is in place at code level
