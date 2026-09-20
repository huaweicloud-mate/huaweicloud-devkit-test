# D3-C14: 沙箱HDKit服务参数与hwlink凭证

**Result: PASS**

## Tool Schema
```json
{
  "connect": {
    "exists": true,
    "hasSource": true,
    "hasEnv": true
  },
  "credentials": {
    "exists": true
  }
}
```

## Connect with source=CLI
```json
{
  "success": true,
  "result": {
    "sessionId": "8d898bc423254635bbe12bb34d7f68c1",
    "devStageId": "8d898bc423254635bbe12bb34d7f68c1",
    "connectionId": "526117",
    "connectionAddress": "wss://fd0-cn-north-4.developer.myhuaweicloud.com:443/v1/forward/openapi/to/8d898bc423254635bbe12bb34d7f68c1?connect_code=C629E0A72486C186742CA3712C5D0C7EF0CFD33A8C2B6D36C3D580021670DF43&ws_type=1&source=-1995602017",
    "status": "connected",
    "expiresAt": "2026-09-21T05:33:21.826000Z"
  }
}
```

## Credentials without session
```json
{
  "success": true,
  "result": {
    "ok": false,
    "error": "Credential validation failed before injection: IAM rejected the credentials (HTTP 401: {\"error_msg\":\"Incorrect IAM authentication information: Unauthorized\",\"error_code\":\"APIGW.0301\",\"request_id\":\"c9e4da44a63dc96ab4c12a3d57025ab4\"}\n). The AK/SK is invalid - check the SK for typos or expired security tokens.",
    "hint": "Credentials were NOT injected into the sandbox. Fix AK/SK first: run \"npx huaweicloud-devkit aut
```

## hwlink API
```json
{
  "hasGetCredentials": true
}
```

## hdkit API
```json
{
  "hasConnect": true,
  "hasCredentials": true
}
```
