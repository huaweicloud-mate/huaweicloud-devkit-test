# D3-S8: 场景-操作失败排障指引

**Result: PASS**

## Error Scenario
```
[USE_ERROR]不正确的参数:ak

运行`hcloud ECS ListServersDetails --help`获取有关此API的详细信息

```

## Explain Error (Auth)
```json
{
  "success": true,
  "result": {
    "service": "ECS",
    "errorCode": "APIGW.0301",
    "requestId": "test-request-id",
    "suggestions": [
      "Check KooCLI profile, region, project_id, and IAM permissions without printing secrets.",
      "APIGW.0301: API Gateway layer error. Incorrect IAM authentication information \u2014 verify AK/SK (SK typos are the usual cause), security token expiry, and that project_id is configured (auth init auto-sets it).",
      "Provide the Request ID (test-request-id) when contacting Huawei Cloud support."
    ]
  }
}
```

## Explain Error (Permission)
```json
{
  "success": true,
  "result": {
    "service": "VPC",
    "errorCode": "Vpc.0301",
    "requestId": "test-req-2",
    "suggestions": [
      "Check KooCLI profile, region, project_id, and IAM permissions without printing secrets.",
      "Check quota and resource limits before retrying a create or scale operation. Consider switching accounts or requesting a quota increase.",
      "Provide the Request ID (test-req-2) when contacting Huawei Cloud support."
    ]
  }
}
```

## Checks
- Error classified: ✓
- Has actionable guidance: ✓
