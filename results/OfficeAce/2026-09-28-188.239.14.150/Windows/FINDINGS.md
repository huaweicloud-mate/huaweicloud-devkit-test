# FINDINGS — 2026-09-28 OfficeAce/Windows/glm-5.2

## FINDING-1: P0 D4-2 凭证env打印未拦截

- **级别**: P0
- **用例**: D4-2
- **描述**: hook_check_command 对凭证环境变量打印命令（echo/printenv）返回 allow，未拦截
- **断言**: `hook_check_command("printenv HW_SECRET_ACCESS_KEY")` 应返回 decision=deny，实际返回 decision=allow
- **根因**: safety/rules/cloud-risk-rules.json 缺少 echo/printenv 凭证环境变量打印检测规则
- **证据**: evidence/D4-2/stdout.log

## FINDING-2: P0 D4-28 Node版安全hook链路凭证echo未拦截

- **级别**: P0
- **用例**: D4-28
- **描述**: hook_check_command 对包含凭证模式的 echo 命令返回 allow，Node hook 链路未检测凭证值模式
- **断言**: `hook_check_command("echo AKID1234567890abcdef && echo SK1234567890...")` 应返回 decision=deny，实际返回 decision=allow
- **根因**: safety/rules/cloud-risk-rules.json 缺少凭证值模式（AKID/SK 前缀）检测规则；hooks/huaweicloud-safety.mjs commandText 提取后 classifyTextCommand 未匹配凭证值模式
- **证据**: evidence/D4-28/stdout.log

## FINDING-3: P0 D9-12 非法时序未返回-32600

- **级别**: P0
- **用例**: D9-12
- **描述**: MCP 服务器允许 initialize 前的 tools/list 请求，未按 JSON-RPC 2.0 规范返回 -32600 (Invalid Request)
- **断言**: 未 initialize 先 tools/list 应返回 error.code=-32600，实际返回正常 tools/list 结果
- **根因**: mcp-protocol.mjs 未强制执行 initialize-first 协议要求，未初始化状态下直接处理了工具请求
- **证据**: evidence/D9-12/stdout.log

## FINDING-4: P1 EXP-E01~E05,E07,E10~E14 评测集路由准确率低

- **级别**: P1
- **用例**: EXP-E01,EXP-E02,EXP-E03,EXP-E04,EXP-E05,EXP-E07,EXP-E10,EXP-E11,EXP-E12,EXP-E13,EXP-E14
- **描述**: huaweicloud_service_catalog 对 11 条中文意图路由未命中期望服务，返回通用帮助消息或误路由
- **断言**: 评测集 15 条意图路由准确率应 ≥90%，实际 21.4%（3/15 命中，11 MISS，1 N/A）
- **根因**: serviceCatalog routeMap 关键词匹配覆盖不足；hcloud CLI 未安装/未认证时返回兜底提示 "Run hcloud --help to list available services."；EXP-E03 误路由到 Sandbox 而非 OBS
- **证据**: evidence/EXP-E01~E15/stdout.log, eval-run-20260928012153.csv