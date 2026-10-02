# FINDINGS

## #1【P0】D4-16 命令包裹穿透
- **现象**：仓库通用回填规则仍将 D4-16 标为 FAIL，表示 shell 包裹写命令的 hook 内层检测存在未闭合风险。
- **断言**：sh -c/bash -c/eval/$() 包裹写命令必须被识别并拦截。
- **根因**：plugins/huaweicloud-core/src/safety-policy.mjs:440 当前规则仅补充部分 hcloud 包裹识别，仍需完整覆盖 shell 包裹展开语义。
- **影响**：P0 安全红线风险，包裹写命令可能绕过审批/预检。
- **证据**：evidence/D4-16/stdout.log

## #2【P1】D8-4 引导步骤可机械执行
- **现象**：仓库通用回填规则仍将 D8-4 标为 FAIL，表示技能/引导步骤仍存在不可机械执行项。
- **断言**：AGENTS.md 与 skills/*.md 的执行步骤必须能由 agent 逐步执行，无含糊/矛盾/歧义步骤。
- **根因**：skills/test-execution/SKILL.md:86 真云、真实 agent 会话、CDP 自动化与 EXP-C4 harness 的执行条件未在脚本层闭环，导致日测仍需人工判定。
- **影响**：日测执行需要人工补判，跨 agent 结果一致性下降。
- **证据**：evidence/D8-4/stdout.log

## #3【P1】D9-2 JSON-RPC 错误码
- **现象**：protocol-probe 对 tools/list 传入非法 params 字符串时，服务端未返回 -32602 Invalid params。
- **断言**：tools/list params 非 object 时必须返回 JSON-RPC error.code = -32602。
- **根因**：plugins/huaweicloud-core/src/mcp-server.mjs:187 将 message.params || {} 直接交给 dispatch，mcp-protocol.mjs:57 的 tools/list 分支未校验 params 类型。
- **影响**：MCP 客户端无法稳定区分协议参数错误与正常空参数调用。
- **证据**：evidence/D9-2/stdout.log

## #4【P1】EXP-E01 ECS 查询意图路由 MISS
- **现象**：D10 route harness 对“帮我查一下我账号在华北北京四有哪些云主机”返回兜底文本，未推荐 ECS。
- **断言**：该中文只读查询意图必须命中 recommendedServices 包含 ECS。
- **根因**：plugins/huaweicloud-core/src/tools.mjs:1966 serviceCatalog 规则集未覆盖“云主机”只读查询表达。
- **影响**：自然语言只读查询无法稳定激活 ECS skill，影响 D10 路由准确率。
- **证据**：evidence/EXP-E01/stdout.log
