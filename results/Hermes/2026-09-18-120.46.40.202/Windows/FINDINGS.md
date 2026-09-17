# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2）

> **落盘路径**：results/Hermes/2026-09-18-120.46.40.202/Windows/FINDINGS.md
> **生成时间**：2026-09-18 06:09:29（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.5（gitHead e7ed6f66，PR #696 release-1.1.5）

## #1【P0】D4-2 凭证env打印拦截不完整

- **现象**：env | grep HW_ACCESS_KEY 返回 allow（risk: not_huaweicloud），未拦截；echo $HUAWEICLOUD_AK 返回 allow，未拦截；env | grep -i secret 返回 allow，未拦截。
- **断言**：env | grep HW_ACCESS_KEY 应返回 deny（risk: credential）；echo $HUAWEICLOUD_AK 应返回 deny；env | grep -i secret 应返回 deny。
- **根因**：plugins/huaweicloud-core/src/safety-policy.mjs:398-399 — env-dump 正则 /HUAWEICLOUD|HWC_|HCLOUD|OS_/i 未覆盖 HW_ 前缀（HW_ACCESS_KEY 不含 HWC_）；第417-419行的 HW_ 直接引用正则要求后缀为 ACCESS_KEY|SECRET_KEY|SECURITY_TOKEN，但 HUAWEICLOUD_AK 的后缀是 AK 不匹配。
- **影响**：攻击者可通过 env | grep HW_ACCESS_KEY 或 echo $HUAWEICLOUD_AK 获取凭证环境变量值，绕过安全策略。
- **证据**：evidence/D4-2/stdout.log（probe-p0-safety.mjs 实测 allow）
- **状态**：待提单

## #2【P0】D4-16 命令包裹穿透

- **现象**：sh -c "hcloud ECS DeleteServer --server_id=test" 返回 allow（risk: not_huaweicloud），未检测到内层 hcloud 写操作；bash -c 同样 allow；powershell -Command 同样 allow。
- **断言**：shell 包裹命令中的内层 hcloud 写操作应被检测并 deny。
- **根因**：plugins/huaweicloud-core/src/safety-policy.mjs classifyTextCommand() 函数未解析 shell wrapper（sh/bash/powershell/cmd）内的 hcloud 命令，正则 /(^|\s)hcloud(\.exe)?\s+/i 匹配的是裸 hcloud 命令，不检查被包裹的情况。
- **影响**：攻击者可通过 sh -c "hcloud ECS DeleteServer ..." 绕过 hook 拦截，执行未审批的写操作。
- **证据**：evidence/D4-16/stdout.log（probe-p0-safety.mjs 实测 allow）
- **状态**：待提单

## #3【P1】D9-2 JSON-RPC invalid params 未返回 -32602 错误码

- **现象**：调用 dispatch('tools/call', null) 时返回错误 "Cannot read properties of null (reading 'name')"，未返回标准 JSON-RPC -32602 (Invalid params) 错误码。
- **断言**：无效参数应返回 {code: -32602, message: "Invalid params"} 标准错误对象。
- **根因**：plugins/huaweicloud-core/src/mcp-protocol.mjs dispatch() 函数未对 null/undefined params 做前置校验，直接访问 params.name 导致 TypeError。
- **影响**：客户端无法按 JSON-RPC 2.0 标准处理无效参数错误，可能导致客户端崩溃。
- **证据**：evidence/D9-2/stdout.log（protocol-probe.mjs 实测 error.code 缺失）
- **状态**：待提单

## #4【P1】EXP-E01~E14 serviceCatalog 中文意图路由准确率低（21.4% MISS）

- **现象**：15条中文意图评测集中，11条 MISS（78.6%未命中），serviceCatalog 对大部分中文意图返回 "Run hcloud --help to list available services." 而非正确路由到对应服务。
- **断言**：serviceCatalog 应正确路由中文意图到对应华为云服务（如"帮我查云主机"路由到ECS）。
- **根因**：plugins/huaweicloud-core/src/tools.mjs huaweicloud_service_catalog 工具的意图匹配逻辑对中文自然语言支持不足，大部分意图无法匹配到服务关键词。
- **影响**：Agent 无法正确理解中文用户意图，无法路由到正确的华为云服务操作。
- **证据**：evidence/EXP-E01/stdout.log 等（eval/harness/run-eval.mjs 实测 HIT=3 MISS=11 N/A=1）
- **状态**：待提单

## #5【非产品缺陷】D4-23 huawei-agent-rules.md 文件不存在（SPEC-MISMATCH）

- **现象**：测试用例 D4-23 期望存在 huawei-agent-rules.md 全局规则注入文件，但在 v1.1.5 的源码仓库和 npm 安装包中均未找到此文件。
- **说明**：安全机制通过 safety/policy.json + hooks/hooks.json + skills/huaweicloud-safety/SKILL.md 实现，功能等价但文件名与用例预期不符。属于设计契约与实现漂移，非功能缺失。
- **证据**：evidence/D4-23/stdout.log

## #6【非产品缺陷】D10-4 安全干预有效性（BLOCKED）

- **现象**：D10-4 需要真实 Agent 会话行为评测（LLM harness），serviceCatalog 路由层无法代理此层。
- **说明**：BLOCKED 原因：需 LLM harness 验证 Agent 在收到高危意图时是否主动走 plan 审批流。serviceCatalog 路由层是确定性调用，无法模拟真实 Agent 行为。解除条件：搭建 LLM harness 进行真实 Agent 会话评测。
- **证据**：evidence/D10-4/（无 probe，BLOCKED 说明）
