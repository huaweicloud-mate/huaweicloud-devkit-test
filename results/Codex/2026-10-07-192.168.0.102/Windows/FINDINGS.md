## #1【P1】# #1闁跨喐鏋婚幏绋?闁跨喐鏋婚幏绋猄ON credential redaction is incomplete
- Cases: `D2-4`, `D4-27`
- Expected: JSON values for `ak`, `sk`, and security token are redacted before output.
- Actual: The probe returned the supplied AK/SK/token values unchanged (`d2-auth/stdout.log`).
- Root cause: `hdk/plugins/huaweicloud-core/src/safety-policy.mjs:49-62` only redacts object keys recognized by `isSecretKeyName`; the lowercase short-key fixture path is not covered by the effective key policy.
- Evidence: `evidence/D2-4/stdout.log`, `evidence/D4-27/stdout.log`.

## #2【P1】# #2闁跨喐鏋婚幏绋?闁跨喐鏋婚幏绋磆ell wrapper detection misses an MCP path
- Case: `D4-16`
- Expected: wrapped destructive commands are denied.
- Actual: MCP wrapper assertion returned `decision=allow` for the tested wrapper (`mcp-tools/stdout.log`).
- Root cause: the wrapper extraction and classification path in `hdk/plugins/huaweicloud-core/src/safety-policy.mjs:401-495` does not classify the tested MCP wrapper form before the allow fallback.
- Evidence: `evidence/D4-16/stdout.log`.

## #3【P1】# #3闁跨喐鏋婚幏绋?闁跨喐鏋婚幏绋磂rvice catalog evaluation has routing misses
- Cases: `EXP-E01` through `EXP-E15` (excluding E06, E08, E09, E15)
- Expected: each evaluation prompt routes to the expected Huawei Cloud service.
- Actual: 11 prompts returned `MISS` (`c4-service-matrix/stdout.log`).
- Root cause: `hdk/plugins/huaweicloud-core/src/tools.mjs:1966-2197` relies on the static keyword route map and token matching; the missed intents do not match a route entry.
- Evidence: `evidence/EXP-E01/stdout.log` and corresponding EXP-E* evidence logs.
