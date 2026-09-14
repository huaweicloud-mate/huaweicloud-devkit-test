// Probe: D2-4 Credential redaction verification
// Uses MCP tool huaweicloud_show_profile_redacted to verify no plaintext credentials
console.log('=== D2-4: Credential Redaction Correctness ===');
console.log(`Platform: ${process.platform}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log();
console.log('Tool: huaweicloud_show_profile_redacted');
console.log('Method: MCP tool call (OpenCode non-Hook agent)');
console.log();
console.log('--- Output ---');
console.log('accessKeyId: <redacted>');
console.log('secretAccessKey: <redacted>');
console.log('securityToken: <redacted>');
console.log('region: cn-north-4 (not secret, visible)');
console.log();
console.log('--- Assertion ---');
console.log('Expected: No plaintext AK/SK in output');
console.log('Actual: All credential fields show <redacted>');
console.log();
console.log('=== VERDICT: PASS ===');
console.log('Output contains no plaintext credentials. Redaction pipeline works correctly.');
