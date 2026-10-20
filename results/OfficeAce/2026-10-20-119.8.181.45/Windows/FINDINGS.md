# FINDINGS — 2026-10-20 OfficeAce Windows 每日测试

## 1. [P0] D4-16 命令包裹穿透

- **级别**: P0
- **描述**: MCP 层 sh wrap 命令包裹未被安全策略阻止
- **断言**: `hook_check_command("hcloud ECS ListServers; rm -rf /")` 应返回 deny，实际返回 allow
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs` — MCP 层命令分类未检测 sh wrap 绕过
- **证据**: `evidence/D4-16/stdout.log` (mcp-tools 探针)
- **历史 issue**: #896, #677

## 2. [P1] D4-27 双路径输出脱敏

- **级别**: P1
- **描述**: stdout + stderr 双路径输出中 AK/SK/token 未完全脱敏
- **断言**: `redactString()` 应覆盖 stdout 和 stderr 两个路径，实际 stderr 路径未覆盖
- **根因**: `plugins/huaweicloud-core/src/redact.js` — redactString 仅处理 stdout，未覆盖 stderr
- **证据**: `evidence/D4-27/stdout.log` (d2-auth 探针)
- **历史 issue**: #896, #809

## 3. [P2] D8-9 安装 ID 与遥测值脱敏

- **级别**: P2
- **描述**: 安装 ID 与遥测值未完全脱敏
- **断言**: `sanitizeValue()` 应覆盖 AKID 前缀格式，实际未覆盖
- **根因**: `plugins/huaweicloud-core/src/telemetry.js` — sanitizeValue 未覆盖 AKID 前缀
- **证据**: `evidence/D8-9/stdout.log`
- **历史 issue**: #852

## 4. [P1] EXP-E01~E05, E07, E10~E14 serviceCatalog 路由 MISS

- **级别**: P1
- **描述**: serviceCatalog 中文意图路由 11/15 未命中
- **断言**: `huaweicloud_service_catalog(中文意图)` 应返回正确服务，实际返回 MISS
- **根因**: `plugins/huaweicloud-core/src/service-catalog.mjs` — 中文意图匹配规则不完整
- **证据**: `evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E14/stdout.log` (c4-service-matrix 探针)
- **历史 issue**: #852, #705
- **基线**: 21.4% MISS (已知基线，非回归)
