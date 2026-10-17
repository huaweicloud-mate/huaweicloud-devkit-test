// Probe for D4-26: findings 证据脱敏
// Bug: redactString regex (AK|SK) lacks 'i' flag, lowercase ak=/sk= not redacted
// Root cause: safety-policy.mjs redactString function
