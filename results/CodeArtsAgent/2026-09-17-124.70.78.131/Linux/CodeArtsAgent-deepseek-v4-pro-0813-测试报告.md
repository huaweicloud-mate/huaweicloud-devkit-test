# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-17 07:14:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-17-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，npm latest v1.1.5，gitHead e7ed6f6）
> **结论**：`PARTIAL`（有 P0/P1 缺陷，全部为历史 #673/#685 复现 + D9-2/D10-3 延续；另 D4-13 只读子账号权限配置异常，本轮无新增产品缺陷）

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

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 117（设计级 78 + 展开级 39） |
| 已执行（非 BLOCKED） | 108 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 83 / 21 / 9 / 4 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 76.9%（83/108） |
| P0 / P1 / P2 缺陷 | 0 新增（全为历史 #673/#685 复现 + D9-2/D10-3 延续） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本轮新增真云写资源：OBS 桶（创建→释放归零）+ 只读子账号 VPC（创建→已删归零），无残留 |

---

## 三、状态汇总

### 3.1 设计级（78）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 57 | 含真云 OBS 建删归零、show_profile_redacted 全 `<redacted>` |
| FAIL | 10 | 全部历史复现（#673/#685）+ D9-2/D10-3 延续 |
| BLOCKED | 8 | 真·外部依赖（Windows 专属/多客户端/镜像网络/LLM harness/SBOM 基建/只读子账号权限异常） |
| SPEC-MISMATCH | 3 | D5-3、D9-1（工具枚举 40 vs 37）、D9-9（cancellation 未声明） |
| NOT_RUN | 0 | 无 |
| **合计** | **78** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 26 | EXP-C4-01~22 服务矩阵 + EXP-D5-3-1 + 评测 HIT 3 条 |
| FAIL | 11 | 评测集中文意图 MISS 11 条（D10-3 同源） |
| BLOCKED | 1 | EXP-E08（explain_error 诊断路由需 LLM harness） |
| SPEC-MISMATCH | 1 | EXP-D5-3-3（工具枚举 37 vs 40） |
| NOT_RUN | 0 | 无 |
| **合计** | **39** | |

---

## 四、缺陷清单（历史复现）

> 本轮无新增产品缺陷。10 条设计级 FAIL + 11 条展开级 FAIL，全部为历史 issue 复现或延续，见 FINDINGS.md。

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

## 五、未执行用例与原因（BLOCKED 真·外部依赖 + 环境）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-2 | 设计级 | P2 | BLOCKED | 补环境 | 多客户端共存安装环境缺失（本机仅 CodeArtsAgent） | — |
| D1-6 | 设计级 | P2 | BLOCKED | 补环境 | KooCLI 下载源/国内镜像引导网络缺失 | — |
| D1-39 | 设计级 | P0 | BLOCKED | 调归属 | Windows 专属（EINVAL/文件锁），Linux 归 NR3 展开级覆盖 | OS 列已标注「专属」，豁免 |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | npm 安装期抓包/SBOM 审计基建缺失 | — |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 只读子账号 test001 只读 API 100% 可用，但 CreateVpc 写操作成功（未被 IAM 拒绝）；已归零删除。需维护者核查 readonly 组权限 | — |
| D7-4 | 设计级 | P2 | BLOCKED | 补环境 | GitCode 镜像网络 + GITCODE_TOKEN 缺失 | — |
| D9-6 | 设计级 | P1 | BLOCKED | 补环境 | 真实多客户端并存互通冒烟环境缺失（协议层 10 客户端 clientInfo 互通已 PASS） | — |
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | LLM 评测 harness 缺失 | 建 LLM harness（ITER-004+） |
| EXP-E08 | 展开级 | P1 | BLOCKED | 补环境 | explain_error 诊断路由需真实 Agent 会话理解（LLM harness） | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：framework 层 1 处（D4-5 Apply*，复现 #685，源码 npm 1.1.5 policy.json 已含 Apply 33 项，框架运行时 policy.json 滞后 32 项）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：show_profile_redacted 全字段 `<redacted>`，无原始凭证落盘
- [x] 真云资源红线：OBS 桶 + 只读子账号 VPC 均测后删除归零

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（testbot3-hermes-obs-*） | 是 | 已删 | Delete bucket successfully |
| 只读子账号 VPC（tctest-d4-13-ro） | 是 | 已删 | ListVpcs 无残留（仅剩 2 个非本次 VPC） |
| 隔离 HOME 临时目录 | 是（探针用） | 已 rm | 无残留 |

## 八、遗留与建议

- 本轮新增【非产品缺陷】1 项（D4-13 只读子账号权限配置异常，补环境类，非 DevKit 代码缺陷），需维护者核查 test001 readonly 组权限。
- v1.1.5 修复验证：①D4-2 safety-policy 层 HW_ 已拦截（classifyTextCommand deny），但 hook 层 cloud-risk-rules.json 仍缺 HW_（分层修复不完整）；②D4-16 shell-wrap hook 层已有效（destructive 规则 warn/deny）；③D9-2 -32601 已修、-32602 未修。
- 建议：cloud-risk-rules.json env-dump 规则补 HW_ 前缀；框架运行时 policy.json + MCP 暴露集同步源码（40 工具/33 项 Apply 前缀）。
