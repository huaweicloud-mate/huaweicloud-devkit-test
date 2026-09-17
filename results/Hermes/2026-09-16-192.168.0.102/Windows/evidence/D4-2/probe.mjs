// D4-2: 凭证env打印拦截
// Tool: huaweicloud_hook_check_command
// Commands tested:
//   1. printenv HW_ACCESS_KEY HW_SECRET_ACCESS_KEY -> ALLOW (SHOULD BE DENY)
//   2. echo %HUAWEICLOUD_ACCESS_KEY% -> ALLOW (echo not in pattern)
//   3. printenv HUAWEICLOUD_ACCESS_KEY -> DENY (correct)
// Root cause: safety-policy.mjs:335-336 regex misses HW_ACCESS_KEY/HW_SECRET_ACCESS_KEY
// Conclusion: FAIL - actual Huawei Cloud env var names not covered by rule
