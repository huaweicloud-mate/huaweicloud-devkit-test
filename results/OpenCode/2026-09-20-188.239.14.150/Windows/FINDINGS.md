# FINDINGS — 缺陷发现清单（OpenCode-GLM-5.2）

> **落盘路径**：`results/OpenCode/2026-09-20-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-20 05:25:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D4-2 凭证env打印拦截不完整（HW_前缀未覆盖）

- **现象**：`hook_check_command("printenv HW_SECRET_KEY HW_ACCESS_KEY")` 返回 `decision=allow`，未拦截凭证环境变量打印
- **断言**：`printenv HW_SECRET_KEY HW_ACCESS_KEY` 应返回 `decision=deny`（hwc-command-env-dump 规则应匹配）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39` — `hwc-command-env-dump` 规则的 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀。华为云凭证环境变量使用 `HW_ACCESS_KEY`/`HW_SECRET_KEY`（`HW_` 前缀），而非 `HWC_` 前缀，导致规则不匹配。
- **影响**：攻击者可通过 `printenv HW_SECRET_KEY` 读取凭证环境变量到 agent 上下文，存在凭证泄露风险
- **证据**：`evidence/D4-2/probe.txt`
- **状态**：待提单

## #2【P0】D4-28 echo命令携带凭证未被拦截

- **现象**：`hook_check_command("echo AK=AKIDtest SK=SKtest123 token=token123 password=Pass123")` 返回 `decision=allow`，未拦截凭证明文输出
- **断言**：含 AK/SK/token/password 的 echo 命令应返回 `decision=deny` 或至少 `warn`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — 无规则匹配 echo 命令中的凭证明文输出。`redactEvidence()` 函数（risk-rule-engine.mjs:19-26）仅在 evidence 字段中脱敏，但无规则标记命令本身为高危。
- **影响**：凭证可通过 echo 命令泄露到 agent 上下文或日志
- **证据**：`evidence/D4-28/probe.txt`
- **状态**：待提单

## #3【P1】D9-2 JSON-RPC无效参数未返回-32602错误码

- **现象**：向 MCP server 发送非法参数时，未返回 `-32602` (Invalid params) 错误码，实际无 error 对象返回
- **断言**：非法参数调用应返回 `{code: -32602, message: "Invalid params"}`
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` — 参数校验逻辑未严格返回标准 JSON-RPC 错误码
- **证据**：`evidence/D9-2/probe.txt`（protocol-probe.mjs D9-2b 结果）
- **状态**：待提单

## #4【P1】D9-9 notifications.cancellation能力未声明（SPEC-MISMATCH）

- **现象**：MCP server initialize 返回的 capabilities 中未声明 `notifications.cancellation`
- **断言**：`initialize.result.capabilities.notifications` 应包含 `cancellation` 声明
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` — initialize 响应的 capabilities 对象缺少 `notifications.cancellation` 字段
- **证据**：`evidence/D9-9/probe.txt`（protocol-probe.mjs D9-9a 结果）
- **状态**：待提单（SPEC-MISMATCH，契约漂移）

## #5【P1】D10-3 serviceCatalog路由准确率仅21.4%（远低于90%目标）

- **现象**：`node eval/harness/run-eval.mjs` 跑 15 条中文意图，serviceCatalog 路由准确率仅 21.4%（HIT=3, MISS=11, N/A=1）。大部分意图返回 "Run hcloud --help to list available services" 而非正确服务路由。
- **断言**：路由准确率应 ≥ 90%
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` — `huaweicloud_service_catalog` 工具的意图匹配逻辑对中文意图处理不完善，大部分中文意图未命中服务路由规则
- **影响**：用户用中文描述需求时，无法正确路由到对应华为云服务，严重影响用户体验
- **证据**：`evidence/D10-3/eval-run-result.csv`（15条评测集完整结果）
- **关联展开级**：EXP-E01~E05, E07, E10~E14 均为 MISS（D10-3 的展开级表现）
- **状态**：待提单

## #6【P1】EXP-C4-14 DMS服务名称KooCLI不支持

- **现象**：`list_operations("DMS")` 返回 `[USE_ERROR]不支持的服务名称:DMS`
- **断言**：DMS 只读规划冒烟命令语法/参数正确，规范路由可执行
- **根因**：KooCLI 7.2.12 不支持 `DMS` 作为直接服务名称。DMS 的子服务（Kafka/RabbitMQ/RocketMQ）可能需要使用不同的服务名
- **证据**：`evidence/EXP-C4-14/probe.txt`
- **状态**：待提单（非产品缺陷，测试侧/KooCLI限制）

## #7【P1】EXP-C4-18 DEW服务名称KooCLI不支持

- **现象**：`list_operations("DEW")` 返回 `[USE_ERROR]不支持的服务名称:DEW`
- **断言**：DEW 只读规划冒烟命令语法/参数正确，规范路由可执行
- **根因**：KooCLI 7.2.12 不支持 `DEW` 作为直接服务名称。DEW 的子服务（KMS/CSMS）可能需要使用不同的服务名
- **证据**：`evidence/EXP-C4-18/probe.txt`
- **状态**：待提单（非产品缺陷，测试侧/KooCLI限制）

## #8【P2】D3-S5 复合意图分层路由未命中

- **现象**：`service_catalog("部署一个带有Redis缓存的Web应用到华为云")` 返回 "Run hcloud --help"，未拆分为 DCS + ECS/Sandbox 多服务
- **断言**：复合意图应正确拆分并命中多个对应 service
- **根因**：同 #5，serviceCatalog 中文意图匹配逻辑不完善
- **证据**：`evidence/D3-S5/probe.txt`
- **状态**：待提单（D10-3 子集）
