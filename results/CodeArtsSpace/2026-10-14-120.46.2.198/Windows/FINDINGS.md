# FINDINGS

## Finding 1: D4-16 命令包裹穿透 (P0)

- **级别**: P0
- **用例ID**: D4-16
- **维度**: D4安全
- **标题**: 命令包裹穿透
- **描述**: hook_check_command 对 MCP 工具包裹的破坏性命令未检测穿透，破坏性操作可绕过预检
- **断言**: hook_check_command 应对 MCP 包裹命令拆解并检测破坏性子命令
- **根因**: safety-policy.mjs hook_check_command 函数未覆盖包裹命令拆解
- **证据**: evidence/D4-16/stdout.log

## Finding 2: D4-27 双路径输出脱敏 (P1)

- **级别**: P1
- **用例ID**: D4-27
- **维度**: D4安全
- **标题**: 双路径输出脱敏
- **描述**: redact 逻辑未覆盖双路径输出，AK/SK/token 明文泄露
- **断言**: redactString 应对所有输出路径（含双路径）脱敏
- **根因**: redactString 函数未处理双路径格式
- **证据**: evidence/D4-27/stdout.log

## Finding 3: D8-4 引导步骤可机械执行 (P1)

- **级别**: P1
- **用例ID**: D8-4
- **维度**: D8质量
- **标题**: 引导步骤可机械执行
- **描述**: 文档引导步骤与实际 CLI 行为不一致
- **断言**: 文档每个步骤应可机械执行且与 CLI 实际行为一致
- **根因**: 文档与 CLI 行为不同步
- **证据**: evidence/D8-4/stdout.log

## Finding 4: EXP-E01~E14 eval-route MISS (P1)

- **级别**: P1
- **用例ID**: EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
- **维度**: D10评测
- **标题**: serviceCatalog 路由对中文意图未命中 (11条)
- **描述**: serviceCatalog 路由层对 11 条中文意图未命中（21.4% MISS 基线）
- **断言**: serviceCatalog 应命中所有评测集中的中文意图
- **根因**: serviceCatalog 路由层中文意图匹配逻辑不足
- **证据**: evidence/EXP-E01~E14/stdout.log
