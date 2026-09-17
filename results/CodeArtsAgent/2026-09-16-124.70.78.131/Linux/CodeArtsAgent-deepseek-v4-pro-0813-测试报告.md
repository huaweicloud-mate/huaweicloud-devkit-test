# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-16 07:40:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-16-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，npm latest v1.1.5，gitHead e7ed6f6）
> **结论**：`PARTIAL`（有 P0/P1 缺陷，均为历史 #673/#685 复现 + D9-2/D10-3 延续，无本轮新增）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（CodeArts CLI）+ deepseek-v4-pro-0813 |
| OS / 架构 | Linux (aarch64) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.5（npm latest 正式版，gitHead e7ed6f6） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS）；源码 spawn 实测 40；CodeArts 框架 MCP 实际暴露 37 |
| hcloud / 依赖 | hcloud 7.2.12（check_cli installed+authenticated，真云 AK/SK 可用） |
| 测试类型 | 源码级 node 直调 + spawn mcp-server 黑盒 + 框架 MCP tool_call + CLI 真机 + 真云 E2E |
| 设计真源 | 设计级 78（daily 精选全量下发）/ 展开级 39（预筛后） |

> **版本差异说明**：v1.1.4(9b67256) → v1.1.5(e7ed6f6) 主要修复：①safety-policy `#650` env-dump HW_ 前缀 + shell-wrap 解包 + JSON-RPC -32601；②`#648` explain_error 回退指引；③`#691` sandbox target-selection gate。本轮重点复测这些修复的落地情况。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 117（设计级 78 + 展开级 39） |
| 已执行（非 BLOCKED） | 109 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 84 / 21 / 8 / 4 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 77.1%（84/109） |
| P0 / P1 / P2 缺陷 | 0 新增（全为历史 #673/#685 复现 + D9-2/D10-3 延续） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本轮 OBS 复用上一轮归零结论，无新增真云写资源 |

---

## 三、状态汇总

### 3.1 设计级（78）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 58 | 含真云 D4-13（test001 已补 readonly 组，只读 API 100% 可用）|
| FAIL | 10 | 全部历史复现（#673/#685）+ D9-2/D10-3 延续 |
| BLOCKED | 7 | 真·外部依赖（Windows 专属/多客户端/镜像网络/LLM harness/SBOM 基建）|
| SPEC-MISMATCH | 3 | D5-3、D9-1（工具枚举 40 vs 37）、D9-9（cancellation 未声明）|
| NOT_RUN | 0 | 无 |
| **合计** | **78** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 26 | EXP-C4-01~22 服务矩阵 + EXP-D5-3-1 + 评测 HIT 3 条 |
| FAIL | 11 | 评测集中文意图 MISS 11 条（D10-3 同源）|
| BLOCKED | 1 | EXP-E08（explain_error 诊断路由需 LLM harness）|
| SPEC-MISMATCH | 1 | EXP-D5-3-3（工具枚举 37 vs 40）|
| NOT_RUN | 0 | 无 |
| **合计** | **39** | |

---

## 四、缺陷清单（历史复现）

> 本轮无新增缺陷。10 条设计级 FAIL + 11 条展开级 FAIL，全部为历史 issue 复现或延续，见 FINDINGS.md。

| # | 级别 | 用例ID | 缺陷 | 关联历史单 |
|---|---|---|---|---|
| 1 | P0 | D4-5 | framework Apply* 写误判 unknown_read | #685 |
| 2 | P0 | D4-2 | 凭证 env HW_ 前缀拦截不完整（hook 层） | #673 |
| 3 | P0 | D4-15 | hook ANSI-C 编码绕过 | #673 |
| 4 | P0 | D4-23 | 全局规则 orphan 未注入 | #673 |
| 5 | P0 | D8-7 | meta 技能指引断链 | #673 |
| 6 | P1 | D1-26/D5-3/D9-1 | 工具暴露漂移 40 vs 37 | #673 |
| 7 | P1 | D4-6 | adminPass 明文无告警 | #673 |
| 8 | P1 | D4-17 | hook fail-open | #673 |
| 9 | P1 | D9-2 | JSON-RPC unknown tool -32603 未区分 -32602（-32601 已修） | #650 延续 |
| 10 | P1 | D10-3 | serviceCatalog 中文路由 MISS 21.4% | 上一轮 #11 延续 |

---

## 五、BLOCKED 用例与原因（真·外部依赖）

| 用例ID | 优先级 | 缺什么资源 | 解除条件 |
|---|---|---|---|
| D1-2 | P2 | 多客户端共存安装环境 | 多客户端同机部署 |
| D1-6 | P2 | KooCLI 下载源/镜像网络 | 配 GITCODE_TOKEN |
| D1-39 | P0 | Windows 环境（OS 专属，Linux 归 NR3） | Windows 真机复测 |
| D4-12 | P2 | npm 安装期 SBOM 审计基建 | 接入 SBOM 审计 |
| D7-4 | P2 | GitCode 镜像网络 + GITCODE_TOKEN | 配 token |
| D9-6 | P1 | 多客户端并存环境 | 多客户端同机 |
| D10-4 | P0 | LLM 评测 harness | 建 LLM harness |
| EXP-E08 | P1 | LLM 评测 harness（explain_error 诊断路由） | 建 LLM harness |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：framework 层 1 处（D4-5 Apply*，复现 #685，源码已修复但框架运行时滞后）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：show_profile_redacted 全字段 `<redacted>`，无原始凭证落盘
- [x] 隔离探针清理：tmp 目录 probe 脚本已清理，无环境残留

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云只读/审计调用 | 否（纯只读 ListVpcs/ListServersDetails/CTS） | — | 无新增写资源 |
| 隔离 HOME 临时目录 | 是（探针用） | 已 rm | 无残留 |

## 八、遗留与建议

- D4-13 由昨日 FAIL 转 PASS（test001 已绑定 readonly 组，只读 API 100% 可用）——环境问题已修复。
- v1.1.5 修复验证：①D4-2 safety-policy 层 HW_ 已拦截，但 hook_check_command 走 cloud-risk-rules.json 仍缺 HW_（分层修复不完整）；②D4-16 shell-wrap 框架层可拦截（destructive 规则文本匹配）；③D9-2 -32601 已修、-32602 未修。
- 建议：cloud-risk-rules.json env-dump 规则补 HW_ 前缀；框架 MCP 层同步源码 40 工具/33 项 Apply 前缀。
