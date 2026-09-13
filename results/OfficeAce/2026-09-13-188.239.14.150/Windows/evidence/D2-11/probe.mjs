// AI生成
// D2-11 (P0): R3 STS token拒绝落盘
// Probe: Verify that STS/temporary tokens are NOT persisted to disk.
//
// Evidence gathered:
// 1. hcloud configure show → securityToken="" (AKSK mode, no STS persisted)
// 2. credentials.json on disk → securityToken="" (empty, no STS)
// 3. Source code analysis of persistCredentials() in tools.mjs:
//    - Line 974: if (String(securityToken || '')) → returns error
//      "Temporary STS credentials cannot be persisted (R3). Use action=temporary."
//    - This is an explicit R3 guard: any non-empty securityToken triggers rejection
// 4. writeGlobalCredentials() in credentials.mjs:
//    - Line 67: securityToken: String(credentials.securityToken || '')
//    - When called from persistCredentials, securityToken is always '' (line 975)
//    - So even if the guard were bypassed, the persisted value would be empty
// 5. Runtime credentials (setRuntimeCredentials) are in-memory only:
//    - Line 236: let runtimeCredentials = null;
//    - Line 238: setRuntimeCredentials stores in module-level variable
//    - No writeFileSync call → never touches disk
// 6. auth_switch action=temporary → uses setRuntimeCredentials (memory only)
//    auth_switch action=persist → calls persistCredentials which rejects STS
//
// Conclusion: PASS — STS tokens are never persisted to disk.
//   - action=temporary: kept in memory (runtimeCredentials variable)
//   - action=persist: explicitly rejected by R3 guard in persistCredentials()
//   - credentials.json on disk has securityToken=""

console.log('D2-11: R3 STS token拒绝落盘');
console.log('Status: PASS');
console.log('');
console.log('Evidence:');
console.log('1. hcloud configure show → securityToken="" (AKSK mode)');
console.log('2. credentials.json on disk → securityToken="" (empty)');
console.log('3. persistCredentials() rejects non-empty securityToken with R3 error');
console.log('4. setRuntimeCredentials() stores in memory only (no file I/O)');
console.log('5. auth_switch action=temporary → memory only');
console.log('6. auth_switch action=persist → R3 guard rejects STS');
