// D2-11 probe
// Status: PASS
// Source code confirms R3 STS token rejection. tools.mjs:1206-1215 persistCredentials() checks if securityToken is non-empty and returns error "Temporary STS credentials cannot be persisted (R3). Use action=temporary." AK/SK written with securityToken="" (empty). Token never persisted to S1.
// Tested by source inspection: tools.mjs persistCredentials()
// if (String(securityToken || "")) -> return {error: R3 rejection}
// writeGlobalCredentials({ak, sk, securityToken: "", ...}) -> token always empty
