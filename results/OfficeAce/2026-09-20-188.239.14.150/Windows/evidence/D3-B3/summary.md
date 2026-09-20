# D3-B3: run_readonly脱敏执行

**Result: PASS**

## Test Results

| Check | Result |
|-------|--------|
| readonly_command_executed | ✓ |
| output_has_no_ak | ✓ |
| output_has_no_sk | ✓ |
| redactSecrets_ak_redacted | ✓ |
| redactSecrets_sk_redacted | ✓ |
| redactSecrets_non_secret_preserved | ✓ |

## Classification Details

### Readonly command (NovaListServers)
```json
{
  "decision": "allow",
  "risk": "read_only",
  "reason": "Command appears to be a read-only Huawei Cloud operation.",
  "service": "ECS",
  "operation": "NovaListServers",
  "args": [
    "ECS",
    "NovaListServers",
    "--cli-region=cn-north-4"
  ]
}
```

### Write command (NovaDeleteServers)
```json
{
  "decision": "deny",
  "risk": "write",
  "reason": "Huawei Cloud write operation blocked until the agent presents a plan and receives explicit user approval."
}
```

### Redacted object
```json
{
  "ak": "<redacted>",
  "sk": "<redacted>",
  "serverName": "test-server",
  "flavorRef": "s6.small.1"
}
```
