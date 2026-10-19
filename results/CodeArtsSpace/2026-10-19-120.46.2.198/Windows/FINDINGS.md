# FINDINGS - huaweicloud-devkit 每日测试缺陷清单

> **生成时间**: 2026-10-19
> **客户端**: CodeArtsSpace / GLM-5.2 / Windows
> **被测版本**: huaweicloud-devkit@1.1.9
> **执行归档**: results/CodeArtsSpace/2026-10-19-120.46.2.198/Windows/

## #1【P0】D4-16 命令包裹穿透

- **现象**: MCP 路径 hook_check_command 对 shell 包裹的写命令（如 `bash -c "hcloud ECS DeleteServers"`）返回 allow 而非 deny，命令包裹穿透。
- **断言**: classifyTextCommand 对包裹命令 decision === 'deny'
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs:489 classifyTextCommand — MCP 调用路径未走 stripExecutable 解包逻辑，包裹的写命令绕过预检
- **影响**: 攻击者可通过 shell 包裹绕过写操作预检，执行未授权的删除/创建命令
- **证据**: evidence/D4-16/stdout.log

## #2【P1】D4-27 双路径输出脱敏不完整

- **现象**: redactSecrets 对含 ak/sk/token 字段的对象脱敏不完整，明文凭证泄露。
- **断言**: redactSecrets({ak,sk,token}) 所有字段 === '<redacted>'
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs:49 redactSecrets — isSecretKeyName 未识别 ak/sk/token 为敏感键名
- **影响**: 含 ak/sk/token 字段的输出未脱敏，凭证可能泄露到日志/对话
- **证据**: evidence/D4-27/stdout.log

## #3【P2】D8-9 安装 ID 与遥测值脱敏

- **现象**: 遥测模块缺失，且 redactSecrets 对安装 ID 脱敏失败。
- **断言**: telemetry 模块存在 && redactSecrets('AKIDTEST12345678') === '<redacted>'
- **根因**: ①遥测模块未实现 ②plugins/huaweicloud-core/src/safety-policy.mjs:49 redactSecrets 对 AK ID 格式脱敏正则不匹配
- **影响**: 安装 ID 未脱敏，遥测功能缺失
- **证据**: evidence/D8-9/stdout.log

## #4【P1】EXP-E01~E05,E07,E10~E14 serviceCatalog 路由 MISS

- **现象**: serviceCatalog 对 11 条中文评测意图路由未命中（MISS），基线 21.4% MISS。
- **断言**: serviceCatalog(intent) 命中对应 service
- **根因**: plugins/huaweicloud-core/src/tools.mjs:1997 serviceCatalog — routeMap 关键词未覆盖这 11 条中文评测意图
- **影响**: 11/15 中文意图路由未命中，用户意图无法正确路由到对应华为云服务
- **证据**: evidence/EXP-E01/stdout.log ~ evidence/EXP-E14/stdout.log
