# FINDINGS - Codex Windows daily test

> Generated: 2026-09-29
> SUT: huaweicloud-devkit@1.1.7 (hdk 557dcdc6)

## #1【P0】D4-16 shell wrapper bypasses safety classification

- **现象**: `classifyTextCommand` returned `allow` for `sh -c "..."`/`eval "hcloud ..."` wrapped destructive or credential commands.
- **断言**: Shell wrappers around blocked commands must return `deny`.
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:384-419` - `classifyTextCommand` only matches wrapper-sensitive tokens at whitespace or command start and does not consistently unwrap `sh`/`bash`/`eval` text before classification.
- **影响**: A wrapped sensitive command can bypass the command safety policy.
- **证据**: `evidence/D4-16/stdout.log`
- **状态**: Historical association; do not duplicate an existing issue.

## #2【P1】D4-27 lowercase credential keys are not redacted on the dual path

- **现象**: The dual-path redaction probe returned JSON containing `ak`, `sk`, and token values.
- **断言**: Both direct and MCP output paths must remove or redact lowercase credential fields.
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:45` - the string redaction expression is case-sensitive for `AK`/`SK`, while object redaction handles lowercase key names.
- **影响**: Credential values can be exposed when credentials arrive as a JSON string.
- **证据**: `evidence/D4-27/stdout.log`
- **状态**: Historical association with the D2-4 redaction defect; do not duplicate an existing issue.

## #3【P0】D9-12 initialize handshake does not reject pre-initialize tools/list

- **现象**: The strict protocol probe reported `illegalSeqRejected: false`; `tools/list` before initialization was not rejected with JSON-RPC `-32600`.
- **断言**: Any `tools/list` request before `initialize` must return JSON-RPC error `-32600`.
- **根因**: `plugins/huaweicloud-core/src/mcp-protocol.mjs:32-63` - the request path handles `initialize` and `tools/list` but does not enforce initialized-session state before accepting `tools/list`.
- **影响**: Clients can enter an invalid MCP protocol state without the required error response.
- **证据**: `evidence/D9-12/stdout.log`
- **状态**: Historical association; do not duplicate an existing issue.

## #4【P0】D10-4 destructive delete risk is only warned

- **现象**: `evaluateCommandRisk` returned `warn` for an ECS `DeleteServers` command.
- **断言**: The destructive delete case must return `deny` or `confirm`, not `warn`.
- **根因**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:225-249` - `hwc-destructive-delete-operation` is configured with warning severity for the tested delete operation.
- **影响**: A destructive cloud operation is not hard-blocked at the static risk layer.
- **证据**: `evidence/D10-4/stdout.log`
- **状态**: Historical association; do not duplicate an existing issue.

## #5【P1】EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14 serviceCatalog routing misses

- **现象**: The deterministic routing harness returned `MISS` for 11 of 15 evaluation intents: `EXP-E01`, `EXP-E02`, `EXP-E03`, `EXP-E04`, `EXP-E05`, `EXP-E07`, `EXP-E10`, `EXP-E11`, `EXP-E12`, `EXP-E13`, and `EXP-E14`.
- **断言**: Every applicable evaluation intent must route to its expected Huawei Cloud service.
- **根因**: `plugins/huaweicloud-core/src/hcloud-cli.mjs` service catalog routing table does not cover the tested Chinese intent variants.
- **影响**: Natural-language service selection fails for part of the evaluation set.
- **证据**: `evidence/EXP-E01/stdout.log` through `evidence/EXP-E14/stdout.log`; grouped source `evidence/c4-service-matrix/stdout.log`.
- **状态**: Historical baseline association; do not duplicate an existing issue.
