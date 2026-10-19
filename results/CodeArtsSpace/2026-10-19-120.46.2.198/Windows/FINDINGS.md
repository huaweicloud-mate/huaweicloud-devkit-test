# FINDINGS - huaweicloud-devkit 每日测试缺陷清单

> **生成时间**: 2026-10-19
> **客户端**: CodeArtsSpace / GLM-5.2 / Windows
> **被测版本**: huaweicloud-devkit@1.1.9
> **执行归档**: results/CodeArtsSpace/2026-10-19-120.46.2.198/Windows/

## 缺陷 1: D4-16 命令包裹穿透 (P0)

- **级别**: P0
- **用例ID**: D4-16
- **维度**: D4安全
- **描述**: MCP 路径 hook_check_command 对 shell 包裹的写命令（如 `bash -c "hcloud ECS DeleteServers"`）返回 allow 而非 deny，命令包裹穿透。
- **断言**: classifyTextCommand 对包裹命令 decision === 'deny'
- **实际**: decision === 'allow', findings === []
- **预期**: decision === 'deny'
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs:489 classifyTextCommand — MCP 调用路径未走 stripExecutable 解包逻辑，包裹的写命令绕过预检
- **证据**: evidence/D4-16/stdout.log

## 缺陷 2: D4-27 双路径输出脱敏不完整 (P1)

- **级别**: P1
- **用例ID**: D4-27
- **维度**: D4安全
- **描述**: redactSecrets 对含 ak/sk/token 字段的对象脱敏不完整，明文凭证泄露。
- **断言**: redactSecrets({ak,sk,token}) 所有字段 === '<redacted>'
- **实际**: {"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1..."} 明文未脱敏
- **预期**: 所有敏感字段 === '<redacted>'
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs:49 redactSecrets — isSecretKeyName 未识别 ak/sk/token 为敏感键名
- **证据**: evidence/D4-27/stdout.log

## 缺陷 3: D8-9 安装 ID 与遥测值脱敏 (P2)

- **级别**: P2
- **用例ID**: D8-9
- **维度**: D8质量
- **描述**: 遥测模块缺失，且 redactSecrets 对安装 ID 脱敏失败。
- **断言**: telemetry 模块存在 && redactSecrets('AKIDTEST12345678') === '<redacted>'
- **实际**: telemetry-exists=false, sanitize-via-redact='AKIDTEST12345678' (未脱敏)
- **预期**: telemetry-exists=true, sanitize-via-redact='<redacted>'
- **根因**: ①遥测模块未实现 ②plugins/huaweicloud-core/src/safety-policy.mjs:49 redactSecrets 对 AK ID 格式脱敏正则不匹配
- **证据**: evidence/D8-9/stdout.log

## 缺陷 4: EXP-E01~E05,E07,E10~E14 serviceCatalog 路由 MISS (P1)

- **级别**: P1
- **用例ID**: EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
- **维度**: D10评测
- **描述**: serviceCatalog 对 11 条中文评测意图路由未命中（MISS），基线 21.4% MISS。
- **断言**: serviceCatalog(intent) 命中对应 service
- **实际**: MISS (11/15 未命中)
- **预期**: HIT
- **根因**: plugins/huaweicloud-core/src/tools.mjs:1997 serviceCatalog — routeMap 关键词未覆盖这 11 条中文评测意图
- **证据**: evidence/EXP-E01/stdout.log ~ evidence/EXP-E14/stdout.log
