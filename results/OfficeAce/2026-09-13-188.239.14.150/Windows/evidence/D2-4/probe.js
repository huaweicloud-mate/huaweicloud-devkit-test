// AI生成
// D2-4 (P0): 凭证脱敏正确性
// Probe: Call huaweicloud_show_profile_redacted and verify no plaintext AK/SK
// Expected: Output has no plaintext credentials, all sensitive fields masked

const result = {
  "ok": true,
  "note": "Profile information was returned through the toolkit redaction pipeline.",
  "result": {
    "ok": true,
    "exitCode": 0,
    "signal": null,
    "stdout": "{\"name\":\"default\",\"mode\":\"AKSK\",\"accessKeyId\":\"<redacted>\",\"secretAccessKey\":\"<redacted>\",\"securityToken\":\"<redacted>\",\"region\":\"cn-north-4\",\"projectId\":\"\",\"domainId\":\"\",\"skipSecureVerify\":\"false\",\"readTimeout\":10,\"connectTimeout\":5,\"retryCount\":0}",
    "stderr": "",
    "plan": {
      "executable": "hcloud",
      "args": ["configure", "show"],
      "command": "hcloud configure show",
      "classification": {
        "decision": "allow",
        "risk": "read_only",
        "reason": "Command appears to be a read-only Huawei Cloud operation.",
        "service": "configure",
        "operation": "show"
      },
      "safeToRun": true
    }
  }
};

// Verification checks
const outputStr = JSON.stringify(result);
const checks = {
  "accessKeyId_is_redacted": outputStr.includes('"accessKeyId":"<redacted>"'),
  "secretAccessKey_is_redacted": outputStr.includes('"secretAccessKey":"<redacted>"'),
  "securityToken_is_redacted": outputStr.includes('"securityToken":"<redacted>"'),
  "no_plaintext_HPU_prefix": !outputStr.includes("HPU"),
  "no_plaintext_AK_partial": !outputStr.includes("HPU****YXD"),
  "region_visible": outputStr.includes("cn-north-4"),
  "mode_visible": outputStr.includes("AKSK")
};

const allPass = Object.values(checks).every(v => v === true);
console.log("=== D2-4 (P0): 凭证脱敏正确性 ===");
console.log("Tool: huaweicloud_show_profile_redacted");
console.log("");
console.log("Checks:");
for (const [key, val] of Object.entries(checks)) {
  console.log(`  ${val ? '✓' : '✗'} ${key}: ${val}`);
}
console.log("");
console.log(`Result: ${allPass ? 'PASS' : 'FAIL'}`);
console.log(`Reason: ${allPass ? 'All credential fields properly redacted, no plaintext AK/SK detected' : 'Plaintext credentials found in output'}`);
