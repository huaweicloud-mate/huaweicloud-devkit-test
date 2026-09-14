# D1-39: Windows 升级检测链可用性
# Test: npm view huaweicloud-devkit dist-tags --json
# Expected: Returns JSON with latest/next tags, no EINVAL error
# Actual: Successfully returned {"latest": "1.1.4", "next": "1.1.4-next.6"}
# Conclusion: Windows detection chain works, no EINVAL silent failure
