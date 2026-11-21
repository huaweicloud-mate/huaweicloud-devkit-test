# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-11-22（北京时间）
> **执行归档**：`results/Hermes/2026-11-22-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit@1.1.15（npm latest，gitHead `bf79b643a1941ef8665548a209683435a2b7a2af`）
> **结论**：`PARTIAL`（FAIL 3 项 + SPEC-MISMATCH 2 项，均为历史问题，无新增提单；P0 契约漂移 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.15`（npm latest；gitHead bf79b643a1941ef8665548a209683435a2b7a2af） |
| daily 基础用例 | 设计级 107 / 展开级 43 / 使命 mission-001 9 |

> **执行方法**：源码模块直调（`plugins/huaweicloud-core/src/*.mjs` file:// 导入，SUT 解包至 `sut115/`）+ MCP stdio 协议夹具（spawn mcp-server.mjs）+ 真实 `npx huaweicloud-devkit@1.1.15` CLI + 真云 E2E（hcloud 建删 VPC/子网/OBS 桶，测后归零）+ 只读子账号最小权限实测（run-as-readonly.py 注入 HW_ACCESS_KEY/HW_SECRET_KEY）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `150` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `137 / 3 / 8 / 2 / 0` |
| 通过率（分母 = PASS+FAIL = 140） | `97.9%` |
| 缺陷（FAIL+SPEC）按优先级 P0/P1/P2 | `1 / 3 / 1` |
| 新增提单 | `0`（全部历史问题，file_issue.py 查重跳过，生成 HISTORY_LINKS.md） |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零（见 §七）` |

---

## 三、状态汇总

### 3.1 设计级（107 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `95` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | D3-C2、D3-C13（OBS 静态站 STS 签名缺陷） |
| BLOCKED | `8` | 沙箱/第二客户端/多服务计费资源，见 §五 |
| SPEC-MISMATCH | `2` | D10-4（规则数漂移）、D8-9（遥测未脱敏） |
| NOT_RUN | `0` | — |
| **合计** | **`107`** | |

### 3.2 展开级（43 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | EXP-C4 22 服务只读冒烟全 PASS 等 |
| FAIL | `1` | EXP-E01（云主机路由 MISS） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 根因（文件:行号） | 状态 |
|---|---|---|---|---|
| 1 | P1 | D3-C13、D3-C2 | `tools.mjs:3421`（obsSignedRequest signedHeaders 漏纳 x-amz-security-token，~3457 行复用 token 头但未参与签名→403 InvalidAccessKeyId） | 历史问题（不重复开单） |
| 2 | P1 | EXP-E01 | `tools.mjs:2574`（serviceCatalog ECS 关键词缺「云主机」） | 历史问题 #705 |
| 3 | P0 | D10-4 | `safety/rules/cloud-risk-rules.json`（规则库 19 条 vs 文档 16 条） | 历史问题 #978 |
| 4 | P2 | D8-9 | `telemetry/telemetry.mjs:190`（sanitizeValue 仅清洗控制字符+截断，未接脱敏） | 历史问题（redact 重构 #791） |

> 完整根因/断言/证据见 `FINDINGS.md`；历史关联清单见 `HISTORY_LINKS.md`。file_issue.py 查重结论：**4 项均为历史缺陷，无新问题，跳过提单**。另：上一轮 2.0.0-next.4 的 D9-2「未知工具未返回 JSON-RPC -32602」缺陷在 1.1.15 已修复（今日 D9-2 = PASS，正确返回 -32602）。

---

## 五、未执行用例与原因

### BLOCKED（8 条，均设计级）

| 用例ID | 阻塞原因 | 分类 | 解除条件 |
|---|---|---|---|
| D3-C3 | 沙箱部署 E2E（upload_project→deploy_nginx→deploy_check）需沙箱服务可连 | 【补环境】 | 沙箱服务可连 |
| D3-C6 | 沙箱 check_user 返回 HDKIT_UPSTREAM_ERROR（查询实名状态失败） | 【补环境】 | 沙箱服务可连+实名+协议签署 |
| D3-C14 | 沙箱 HDKit 服务参数与 hwlink 凭证夹具需 sandbox 服务 | 【补环境】 | 沙箱服务可连 |
| D3-S3 | 沙箱预览出 URL 依赖 upload_project+deploy_nginx+expose_tunnel | 【补环境】 | 沙箱服务可连 |
| D3-S6 | FunctionGraph 定时任务需真机建 FG 函数+定时触发器→删除归零 | 【补环境】 | FG 函数+触发器建删 |
| D3-S7 | 跨服务交付(Web+RDS)并归零需 RDS 实例+沙箱部署+连接串注入 | 【补环境】 | RDS+沙箱+应用多服务 |
| D3-C4 | 服务创建类回归需逐服务(ECS/RDS/CCE/WAF)轻量建删；本轮已完成 VPC/子网真机建删归零 + 22 服务只读冒烟 | 【补环境】 | 逐服务计费资源轻量建删 |
| D9-6 | 跨客户端协议互通需第二客户端(OpenCode/Codex)会话；本机 Hermes 单客户端 | 【补环境】 | 本机安装第二客户端双端跑互通夹具 |

> 补测收尾：全部 BLOCKED 已追查。D3-C6 用真实 check_user 探活（返回 HDKIT_UPSTREAM_ERROR）属真·外部依赖；其余沙箱类均因沙箱服务不可达。无假阻塞。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（D9-12 initialize / D9-13 tools/call 均验证无 AK/SK/security_token 明文泄露）
- [x] 写操作误判 read-only：无（D4-5/D4-15 变体识别、D4-19 确认流预检均通过）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：D2-4/D2-11/D2-12/D2-16/D4-26/D4-27 凭据脱敏全部 PASS；仅 D8-9 telemetry sanitizeValue 未接脱敏（P2 缺陷，§四 #4）
- [x] 真云红线：真机执行（VPC/子网/OBS 建删归零），未 mock、未以「无凭证」标 BLOCKED
- [x] 最小权限：D4-13 只读子账号实测通过——只读 ListVpcs 允许 + CreateVpc 被 PolicyNotAuthorized 拒绝（100%）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC `testbot5-hermes-e2e-5295961914`（+子网） | CreateVpc/CreateSubnet exit 0 | DeleteSubnet→DeleteVpc（异步，补删架构二次确认） | `ListVpcs` 残留 0 ✓ |
| ECS | 未创建（只读 ListServersDetails） | — | count=0 ✓ |
| OBS 桶 `testbot5-hermes-obs-5296026156` | mb 成功 | OBS rm 部分 + 签名 DELETE 204 | 归零 ✓ |
| 只读子账号（test001） | 未创建资源 | — | 写操作 PolicyNotAuthorized ✓ |

真云建删已归零，无泄漏。

---

## 八、遗留与建议

1. **OBS website config STS 签名缺陷（§四 #1）**：obsSignedRequest 需把 `x-amz-security-token`（STS 临时凭证存在时）纳入 canonicalHeaders 与 signedHeaders，否则 OBS 校验 403 InvalidAccessKeyId；已延续多轮（2.0.0-next.4→1.1.15），建议优先修复。
2. **serviceCatalog「云主机」别名（§四 #2）**：routeMap ECS 关键词补「云主机」，可进一步提升中文意图命中率（今日 13/14=92.9%，唯一 MISS 即 EXP-E01；D10-3 阈值 90% 达线 PASS）。
3. **规则快照文档漂移（§四 #3，P0）**：规则库 19 条（9 deny+10 warn）与文档 16 条不一致，文档需同步或断言更新，属 P0 契约漂移。
4. **telemetry 脱敏链路（§四 #4）**：sanitizeValue 建议在遥测录入前接入 redactSecrets，避免明文凭证落盘。
5. **版本观察**：npm latest 已从 2.0.0-next.4 回退至 1.1.15（2.0 主版本号弃用）；本机 Hermes 运行时插件仍为 2.0.0-next.4（prepare_env 的 sync_agent_plugin 未同步全局包），但本轮 SUT 用 `sut115/` 解包的 1.1.15 实测，结果不受运行时插件影响。
6. **已修复确认**：D9-2 未知工具 JSON-RPC -32602 语义已在 1.1.15 修复（今日 PASS），建议维护者关单对应历史缺陷。