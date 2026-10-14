## P0-1: JSON credential keys are not redacted

- 用例: `D2-4`
- 现象: `redactSecrets` 返回结果仍包含 `ak` 与 `sk` 明文。
- 唯一断言: JSON credential fields must be replaced with `<redacted>`.
- 根因: `hdk/plugins/huaweicloud-core/src/safety-policy.mjs:49-58` only applies `isSecretKeyName` to the configured key set and does not cover the lowercase `ak`/`sk` aliases exercised by the probe.
- 证据: `evidence/D2-4/stdout.log`

## P0-2: MCP wrapped write command is allowed

- 用例: `D4-16`
- 现象: MCP hook returns `{"ok":true,"decision":"allow"}` for a wrapped write command; expected `deny`.
- 唯一断言: shell-wrapped destructive/write commands must not be allowed.
- 根因: `hdk/plugins/huaweicloud-core/src/safety-policy.mjs:489-560` classifies the MCP text-wrapper path differently from the direct `classifyHcloudArgs` path, leaving the tested wrapper segment as `allow`.
- 证据: `evidence/D4-16/stdout.log`

## P1-1: Dual-path output redaction misses credential aliases

- 用例: `D4-27`
- 现象: dual-path result still contains `ak`, `sk`, and token values.
- 唯一断言: both direct and MCP output paths must redact credential aliases.
- 根因: `hdk/plugins/huaweicloud-core/src/safety-policy.mjs:49-58` leaves the exercised aliases unchanged.
- 证据: `evidence/D4-27/stdout.log`

## P1-2: Service catalog evaluation routes miss expected services

- 用例: `EXP-E01`~`EXP-E05`, `EXP-E07`, `EXP-E10`~`EXP-E14`
- 现象: route harness returns `MISS` where the expected result is `HIT`.
- 唯一断言: each evaluation intent must resolve to the expected Huawei Cloud service.
- 根因: `hdk/plugins/huaweicloud-core/src/tools.mjs:1984` service catalog routing does not match the affected intent phrases.
- 证据: `evidence/EXP-E01/stdout.log`, `evidence/EXP-E02/stdout.log`, `evidence/EXP-E03/stdout.log`, `evidence/EXP-E04/stdout.log`, `evidence/EXP-E05/stdout.log`, `evidence/EXP-E07/stdout.log`, `evidence/EXP-E10/stdout.log`, `evidence/EXP-E11/stdout.log`, `evidence/EXP-E12/stdout.log`, `evidence/EXP-E13/stdout.log`, `evidence/EXP-E14/stdout.log`

### Scope and follow-up

No GitHub issue was created or modified in this run, per the autopilot instruction. The 35 BLOCKED cases are recorded in the CSVs with explicit harness/session prerequisites and should be rerun when those prerequisites are available.