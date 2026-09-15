// D2-11: R3 STS token拒绝落盘
// Tool: huaweicloud_auth_switch (action=persist, mode=import, securityToken)
// Expected: {status:error, scope:rejected}, token never persisted
// Actual: {status:"error", error:"Temporary STS credentials cannot be persisted (R3)...", scope:"rejected"}
// Conclusion: PASS - STS token rejected, import file wiped
