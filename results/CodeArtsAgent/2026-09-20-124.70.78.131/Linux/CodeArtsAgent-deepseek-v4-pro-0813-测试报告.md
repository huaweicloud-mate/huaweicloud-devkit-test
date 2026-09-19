# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-20 05:40（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-20-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，npm latest v1.1.5，gitHead e7ed6f66）
> **结论**：`PARTIAL`（有 P0/P1 缺陷，多为历史 #673/#685/#650/#726 复现 + D10-3 延续；本轮新增产品缺陷 D4-25 Python hook 写分类失效 + 新 SPEC D4-29 classifyRawCommand 未导出）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（CodeArts CLI）+ deepseek-v4-pro-0813 |
| OS / 架构 | Linux (aarch64) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.5（npm latest 正式版，gitHead e7ed6f66） |
| 工具全集 | 40（tools.mjs 源码）；源码 spawn 实测 40；CodeArts 框架 MCP 实际暴露 37 |
| hcloud / 依赖 | hcloud 7.2.12（check_cli installed+authenticated，真云 AK/SK 可用） |
| 真云凭证 | cn-north-4（管理员 AKSK + 只读子账号 test001，均真机执行） |
| 测试类型 | 源码级 node 直调 + spawn mcp-server 黑盒 + 框架 MCP + CLI 真机 + 真云 E2E |
| 设计真源 | 设计级 100（daily 全量下发）/ 展开级 39（预筛后） |

> **执行方法**：复用 22 个历史探针脚本（.mjs）重跑 + 新增 6 个源码探针直调 hdk 源码函数 + 真云 E2E（OBS 建删归零 / 沙箱 / 只读子账号 / CTS 审计）。证据统一落 `evidence/<case-id>/stdout.txt` + `evidence/_probes/*.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 139（设计级 100 + 展开级 39） |
| 已执行（非 BLOCKED/NOT_RUN） | 134 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 102 / 26 / 4 / 6 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 76.1%（102/134） |
| 本轮新增产品缺陷 | 1（D4-25 Python hook 写分类失效）+ 1 新 SPEC（D4-29 classifyRawCommand 未导出） |
| 红线（I 类）违规 | 0 |
| 资源释放 | OBS 桶（建→删归零）+ 只读子账号探测 VPC（建→删归零）+ 沙箱 session（close），无残留 |

---

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 76 | 含真云 OBS 建删归零、沙箱连接、CTS 审计、D2-26 备份恢复、新增环境变量/CLI/KooCLI/代理/隧道等 |
| FAIL | 15 | 14 条历史复现（#673/#685/#650/#726）+ D3-S1、D3-S5 路由 MISS（D10-3 同源）+ D4-13 权限过宽（非产品缺陷） |
| BLOCKED | 3 | D3-S7（跨服务 RDS 重资产）/ D9-6（跨客户端）/ D10-4（LLM harness） |
| SPEC-MISMATCH | 5 | D4-29（classifyRawCommand 未导出）、D5-3/D9-1（40vs37）、D9-8、D9-9 |
| NOT_RUN | 1 | D1-39（Windows 专属，OS 列标注「专属」豁免） |
| **合计** | **100** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 26 | EXP-D5-3-1 + EXP-C4-01~22 服务矩阵（22 全过）+ 评测 HIT 3 条（E06/E09/E15） |
| FAIL | 11 | 评测集中文意图 MISS 11 条（D10-3 同源） |
| BLOCKED | 1 | EXP-E08（诊断类需 LLM harness） |
| SPEC-MISMATCH | 1 | EXP-D5-3-3（工具枚举 40 vs 37） |
| NOT_RUN | 0 | 无 |
| **合计** | **39** | |

---

## 四、缺陷清单

> 本轮新增产品缺陷 1 条（#13 D4-25）+ 新 SPEC 1 条（#14 D4-29），其余 13 条为历史 issue 复现/延续，详见 FINDINGS.md。

| # | 级别 | 用例ID | 缺陷 | 关联历史单 |
|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截（hook 层 HW_ 缺覆盖） | #673 |
| 2 | P0 | D4-5 | framework Apply* 写误判（运行时 policy 缺 Apply） | #685 |
| 3 | P0 | D4-15 | hook ANSI-C 编码绕过 | #673 |
| 4 | P1 | D4-16 | 命令包裹 env-dump 词边界不穿透 | #673 |
| 5 | P1 | D4-17 | hook 模糊 fail-open | #673 |
| 6 | P0 | D4-23 | 全局规则 huawei-agent-rules.mdc 孤儿未注入 | #673 |
| 7 | P0 | D8-7 | meta 技能指引断链 | #673 |
| 8 | P1 | D9-2 | JSON-RPC unknown tool -32603 未区分 -32602 | #650 |
| 9 | P1 | D10-3/D3-S1/D3-S5 | serviceCatalog 中文/复合意图路由 MISS | 上轮 #11 |
| 10 | P1 | D4-26/D4-27 | 双路径脱敏缺裸 token 关键字 | #726 |
| 11 | P1 | D1-26/D5-3/D9-1 | 工具暴露漂移 40 vs 37 | #673 |
| 12 | P1 | D9-8/D9-9 | inputSchema 版本 / cancellation 未声明 | 延续 |
| 13 | P1 | D4-25 | Python hook 写操作遥测分类失效 | **本轮新增** |
| 14 | P1 | D4-29 | classifyRawCommand 未导出（契约漂移） | **本轮新 SPEC** |
| 15 | — | D4-13 | 只读子账号权限过宽（非产品缺陷，IAM 组配置） | 非产品缺陷 |

根因详情（文件:行号 + 复现证据）见 `FINDINGS.md` 各节。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（EINVAL/文件锁），Linux 由 NR3 展开级 disttags-probe 覆盖 | OS 列已标注「专属」，豁免 |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | 跨服务交付（Web+RDS）需真实 RDS 实例 + Web 部署重资产编排；本日已验沙箱/路由/审批/清理机制 | 可降级为「沙箱 Web + 模拟库」或标注需 RDS 配额 |
| D9-6 | 设计级 | P1 | BLOCKED | 补环境 | 真实多客户端并存互通冒烟环境缺失（协议层 clientInfo 互通已 PASS） | — |
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 真实 Agent 高危请求行为评测需 LLM harness（run-eval.mjs 仅 serviceCatalog 路由层） | 建 LLM harness |
| EXP-E08 | 展开级 | P1 | BLOCKED | 补环境 | 诊断类意图需真实 Agent 会话理解（LLM harness） | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：framework 层 1 处（D4-5 Apply*，复现 #685）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：D2-4 show_profile_redacted 无原始凭证落盘；D4-26/D4-27 裸 token= 未脱敏已记 #726（同根因）
- [x] 真云资源红线：OBS 桶建→删归零；只读子账号探测 VPC 建→删归零；沙箱 session close，无残留

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（testbot3-hermes-obs-*） | 是 | 已删 | Delete bucket successfully |
| 只读子账号探测 VPC（tctest-ro-probe-x） | 是 | 已删 | ListVpcs current_count=0 |
| 沙箱 session | 是（连接） | close_session | close 返回 ok |
| 隔离 HOME 临时目录 | 是（探针用） | 已 rm | 无残留 |

## 八、遗留与建议

- 本轮沿用 D4-6 口径：母版源码级脱敏断言（adminPass=xxx→<redacted>）PASS，hook 层明文无告警记 #673。
- D4-13 只读子账号 test001 权限过宽（写操作 CreateVpc 实测成功），需维护者核查 readonly IAM 组策略后复测。
- **本轮新增 D4-25**：`huaweicloud-safety.py:46` 写分类正则 `(^|[A-Za-z0-9])` 应改为 `\b`（单词边界），否则标准 CLI 格式 `hcloud <svc> <Operation>` 的写动词不被匹配。
- **本轮新 SPEC D4-29**：需明确 `classifyRawCommand` 是否应作为公开导出（当前仅 classifyTextCommand/classifyHcloudArgs/assertAllowed）。
- 建议：cloud-risk-rules.json env-dump 规则补 HW_ 前缀 + 去掉 shell 包裹词边界；框架运行时 policy.json/MCP 暴露集同步源码（40 工具/33 项 Apply）；safety-policy 与 redactEvidence 补裸 token 关键字。
