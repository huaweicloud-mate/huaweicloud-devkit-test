# Deployment State File Specification

Session-scoped tracking for the orchestration flow. This is a manual, session-scoped analog of Terraform state - lightweight by design, not a long-term deployment ledger.

## Location

System temp directory (session dies with the file):

```
Linux/macOS:  /tmp/huaweicloud-iac-state.json
Windows:      %TEMP%\huaweicloud-iac-state.json
```

## Lifecycle

- Created at the start of Stage 6 (provisioning) with the first `deploying` deployment
- Updated after EVERY successful resource creation (never batch-write at the end)
- Marked `partial` immediately on any failure
- Marked `destroyed` after a successful teardown
- Expires with the session - never promise cross-session deploy management

## Schema

```json
{
  "version": "1.0",
  "deployments": {
    "d-002": {
      "created_at": "2026-09-05T14:00:00Z",
      "arch": "personal-serverless",
      "region": "cn-east-3",
      "frontend": "obs-cdn",
      "domain": "www.example.com",
      "resources": [
        {
          "id": "obs_bucket",
          "type": "OBS_Bucket",
          "resource_id": "www.example.com",
          "params": { "acl": "public-read", "website": true }
        },
        {
          "id": "cdn",
          "type": "CDN_Domain",
          "resource_id": "cdn-xxx",
          "params": { "cname": "xxx.cdn.myhuaweicloud.com" },
          "depends_on": ["obs_bucket"]
        },
        {
          "id": "dns",
          "type": "DNS_RecordSet",
          "resource_id": "rs-xxx",
          "params": { "type": "CNAME", "value": "xxx.cdn.myhuaweicloud.com" },
          "depends_on": ["cdn"]
        },
        {
          "id": "fg",
          "type": "FunctionGraph",
          "resource_id": "urn:fss:xxx",
          "params": { "runtime": "Node.js" }
        }
      ],
      "status": "deployed"
    }
  }
}
```

Field rules:

- `id`: stable resource role within the deployment (`vpc`, `subnet`, `sg`, `ecs`, `eip`, `rds`, `obs_bucket`, `cdn`, `dns`, `fg`, ...) - later resources reference these names in `depends_on`
- `resource_id`: the real cloud ID extracted from the creation command output - never reconstructed from memory
- `depends_on`: array of `id`s this resource was created after; determines reverse destroy order
- `params`: only what teardown or diagnostics needs (name, flags like ACL) - no secrets

## Status Machine

```
deploying ──all created + verified──▶ deployed
    │
    └──any failure──▶ partial (keep created-resource records; destroy to clean up)

deployed/partial ──destroy──▶ destroyed (terminal; queries only)
```

| Status      | Meaning                             | Allowed operations               |
| ----------- | ----------------------------------- | -------------------------------- |
| `deploying` | Provisioning in progress            | Wait / observe                   |
| `deployed`  | All resources created and verified  | Query, destroy                   |
| `partial`   | Interrupted; orphan resources exist | **Destroy (clean up leftovers)** |
| `destroyed` | Torn down                           | Query only                       |

## Write Rules

1. Write state after every single successful create - extract `resource_id` from the actual command output
2. `resource_id` extraction is deterministic: parse the JSON the command returned; if the output shape is unexpected, stop and inspect instead of guessing
3. A failed create is recorded only via the `partial` status - do not fabricate IDs for failed resources
4. Destroy order = exact reverse of the recorded `resources` array order (creation order is already topological)
5. "Resource not found" during destroy = already gone; keep going and still record it as processed
6. **UTF-8 WITHOUT BOM**: PowerShell 5.1 `Set-Content -Encoding utf8` writes a BOM that makes strict JSON parsers fail (`Unexpected token '﻿'`). Write state with Node `fs.writeFileSync` or another BOM-less writer; if parsing fails on a `\uFEFF` prefix, strip it and rewrite the file clean
7. Empty command stdout is a valid success signal for VPC v3 deletes (async 202/204) - confirm teardown via list APIs, not stdout

## Known Weakness

State correctness rests entirely on the agent writing each `resource_id` right after creation. A wrong or missing ID causes leaks (missed deletes) or wrong deletes at teardown. Mitigations: write immediately after each step, parse output programmatically, show the full to-be-deleted list for final confirmation before destroying.
