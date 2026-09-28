# FINDINGS — 2026-09-28 OfficeAce/Windows/glm-5.2

## #1【P0】凭证env打印未拦截(D4-2)
- **现象**: hook_check_command 对 `echo %HW_SECRET_ACCESS_KEY%` 和 `printenv HW_SECRET_ACCESS_KEY` 返回 allow，凭证环境变量打印未被拦截
- **断言**: hook_check_command("printenv HW_SECRET_ACCESS_KEY") 应返回 decision=deny，实际返回 decision=allow
- **根因**: safety/rules/cloud-risk-rules.json 缺少 echo/printenv 凭证环境变量打印检测规则
- **影响**: 攻击者可通过 echo/printenv 命令读取并泄露凭证环境变量，绕过安全策略
- **证据**: evidence/D4-2/stdout.log

## #2【P0】Node版安全hook链路凭证echo未拦截(D4-28)
- **现象**: hook_check_command 对 `echo AKID1234567890abcdef && echo SK1234567890...` 返回 allow，凭证值模式未被检测
- **断言**: hook_check_command("echo AKID... && echo SK...") 应返回 decision=deny，实际返回 decision=allow
- **根因**: safety/rules/cloud-risk-rules.json 缺少凭证值模式(AKID/SK前缀)检测规则；classifyTextCommand 未匹配凭证值模式
- **影响**: 凭证值可通过 echo 命令打印泄露，Node hook 链路存在安全缺口
- **证据**: evidence/D4-28/stdout.log

## #3【P0】非法时序未返回-32600(D9-12)
- **现象**: MCP 服务器允许 initialize 前的 tools/list 请求，未按 JSON-RPC 2.0 规范返回 -32600
- **断言**: 未 initialize 先 tools/list 应返回 error.code=-32600，实际返回正常 tools/list 结果
- **根因**: mcp-protocol.mjs 未强制执行 initialize-first 协议要求，未初始化状态下直接处理了工具请求
- **影响**: 违反 MCP 协议安全基线，可能导致未授权的工具调用
- **证据**: evidence/D9-12/stdout.log

## #4【P1】评测集路由准确率低(EXP-E01~E14)
- **现象**: huaweicloud_service_catalog 对 11 条中文意图路由未命中期望服务，返回通用帮助消息或误路由
- **断言**: 评测集 15 条意图路由准确率应 >=90%，实际 21.4%（3/15 命中，11 MISS，1 N/A）
- **根因**: serviceCatalog routeMap 关键词匹配覆盖不足；hcloud CLI 未安装/未认证时返回兜底提示；EXP-E03 误路由到 Sandbox 而非 OBS
- **影响**: 用户中文意图无法正确路由到对应华为云服务，影响用户体验
- **证据**: evidence/EXP-E01~E15/stdout.log, eval-run-20260928012153.csv