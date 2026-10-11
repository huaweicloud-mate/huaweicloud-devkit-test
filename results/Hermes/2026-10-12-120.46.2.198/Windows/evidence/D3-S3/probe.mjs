// Probe for D3-S3
// Source: probe-realcloud.mjs in hdk repo
// Status: BLOCKED
console.log(JSON.stringify({
  "D3-S3": {
    "status": "BLOCKED",
    "why": "sandbox_check_user returned empty via MCP. Sandbox service API (hdkitservice) not registered in KooCLI hcloud. BlockedReason: sandbox API requires session endpoint configuration not available via hcloud CLI or MCP without pre-configured sandbox session. \u89e3\u9664\u6761\u4ef6: \u914d\u7f6e sandbox session endpoint \u6216\u901a\u8fc7 Web UI \u521b\u5efa sandbox session\u3002\u5b9e\u6d4b\u65f6\u95f4: 20261011213852",
    "executedAt": "20261011213900"
  }
}, null, 2));
