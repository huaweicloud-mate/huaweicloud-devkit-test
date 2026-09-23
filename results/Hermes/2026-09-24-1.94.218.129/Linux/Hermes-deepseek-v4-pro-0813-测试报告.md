# Hermes-deepseek-v4-pro-0813 测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-24 05:15`（北京时间）
> **执行归档**：`results/Hermes/2026-09-24-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.6（npm 官方 latest，gitHead `46152dd`）
> **结论**：`PARTIAL`（3 项 P0 历史缺陷 D4-16/D2-4/D4-23 + 12 项 P1/P2 缺陷；真云 E2E 真机完成且归零；SUT 与上一轮同为 v1.1.6，15 项缺陷全部复现，无新增、无修复）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.6（npm 官方 latest，gitHead `46152dd`） |
| 工具全集 | 40（protocol-probe tools/list 实测 40） |
| hcloud / 依赖 | hcloud 7.2.12 已配置 / doctor 环境就绪 |
| 真云凭证 | cn-north-4（管理员 AKSK + 只读子账号均就绪，实测通过） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 路由评测 harness / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 100 / 展开级 43（已按 Hermes+Linux 预筛） |

> **执行方法**：探针（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结果落 `evidence/<id>/stdout.log`；协议走 `eval/harness/protocol-probe.mjs`，评测走 `eval/harness/run-eval.mjs`；真云走 hcloud 实机建删归零。本轮 30 组证据全部本机新鲜落盘（非复用昨日 stdout.log），源码 checkout 至 v1.1.6（`46152dd`），npm 全局包装 1.1.6（官方 registry）。

> **版本口径修正**：`prepare_env.py --update` 默认「取 latest/next 最高」会误装 next 预发布 `1.1.7-next.1`。每日测试按 AGENTS.md 应测 latest 正式版，本轮已显式固定 SUT=v1.1.6（`npm install -g huaweicloud-devkit@1.1.6 --registry https://registry.npmjs.org` + `git checkout 46152dd`）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 143（设计级 100 + 展开级 43） |
| 已执行（PASS+FAIL+SPEC） | 138（设计级 96 + 展开级 42） |
| 设计级 PASS / FAIL / SPEC / NOT_RUN / BLOCKED | 81 / 14 / 1 / 3 / 1 |
| 展开级 PASS / FAIL / NOT_RUN | 31 / 11 / 1 |
| 通过率（分母=PASS+FAIL+SPEC，不含 NOT_RUN/BLOCKED） | 设计级 84.4%（81/96）；展开级 73.8%（31/42） |
| P0 缺陷 | 3（D4-16 / D2-4 / D4-23，均历史复现） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（VPC/OBS 建删 + 残留 0） |

---

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 81 | 有证据且通过 PASS 门禁 |
| FAIL | 14 | D1-68 / D2-4 / D3-S1 / D3-S3 / D3-S5 / D4-16 / D4-23 / D4-25 / D4-26 / D4-27 / D8-4 / D8-9 / D9-2 / D10-3 |
| SPEC-MISMATCH | 1 | D9-9（cancellation 未声明） |
| NOT_RUN | 3 | D1-39（OS 专属豁免）/ D3-S6 / D3-S7 |
| BLOCKED | 1 | D3-S4（领券一人一次已领取） |
| **合计** | **100** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 31 | 22 项 C4 服务矩阵 + D5/NR3 + E06/E09/E15 |
| FAIL | 11 | EXP-E01~05/07/10/11/12/13/14（路由 MISS） |
| NOT_RUN | 1 | EXP-E08（诊断类 intent 不在 serviceCatalog 路由范围） |
| **合计** | **43** | |

---

## 四、缺陷清单（详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D4-16 | sh -c 包裹凭证 env 打印未拦截 | safety-policy.mjs:384 |
| 2 | P0 | D2-4 | redactString 字符串路径漏小写 ak=/sk= | safety-policy.mjs:34-45 |
| 3 | P0 | D4-23 | 全局规则 huawei-agent-rules.mdc 未注入 | package.json:8 |
| 4 | P1 | D4-27 | redactSecrets 漏小写 ak=/sk=/token= | safety-policy.mjs:34-45 |
| 5 | P1 | D8-4 | INSTALL.md 未随包发布 | package.json:8 |
| 6 | P1 | D9-2 | invalid params 未返回 -32602（tools/list 参数非 object 不校验） | mcp-protocol.mjs:57-59 |
| 7 | P1 | D9-9 | notifications.cancellation 未声明（SPEC） | mcp-server.mjs:174 |
| 8 | P1 | D10-3 | serviceCatalog 路由命中率 21.4% | tools.mjs:1815 |
| 9 | P1 | D3-S1 | ECS 只读意图未路由命中 ecs | tools.mjs:1815 |
| 10 | P1 | D3-S3 | 沙箱 upload_project / deploy_check 返回空 | tools.mjs:1329/1382 |
| 11 | P2 | D3-S5 | 复合意图仅命中单一服务 | tools.mjs:1815 |
| 12 | P2 | D1-68 | region 优先级 HW_REGION 优先于 HUAWEICLOUD_REGION | credentials.mjs:133 |
| 13 | P2 | D4-25 | 写命令误归 cli:invoke | huaweicloud-safety.py:46 |
| 14 | P2 | D4-26 | findings.evidence 小写 ak=/sk=/token= 未脱敏 | risk-rule-engine.mjs:19-25 |
| 15 | P2 | D8-9 | sanitizeValue 未剥离 AK/SK/token | telemetry.mjs:189-196 |

**版本对比结论**：本轮 SUT 与上一轮（2026-09-23）同为 v1.1.6（`46152dd`），版本未升版。15 项缺陷**逐一复现**，无新增退化、无修复回归。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（升级检测链 EINVAL），本机 Linux；由展开级 EXP-NR3-10（P0）代表覆盖 | — |
| D3-S6 | 设计级 | P2 | NOT_RUN | 补环境 | FunctionGraph 定时任务真云场景：需函数代码包 + IAM 执行委托 + 定时触发器三件套，daily 范围未预置；已覆盖 serviceCatalog 路由层判定 EXP-E10 MISS + 工具链路 | — |
| D3-S7 | 设计级 | P1 | NOT_RUN | 补环境 | 跨服务交付(Web+RDS)真云多服务编排：RDS 创建计费 5-15 分钟 + 连接串注入 + 读写验证 + 归零，超 daily 单资源范围；已覆盖 D3-C4 单资源真云建删归零 + D3-S2 删除确认 + D3-S3 沙箱预览 | — |
| D3-S4 | 设计级 | P1 | BLOCKED | 补环境 | 领券一人一次，本账号已领取（voucher_status.claimed=true），无法复跑 claim 闭环；status 步已实测 | — |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 改用例 | 诊断类意图(explain_error)不在 serviceCatalog 路由范围（harness 标记 N/A） | 移至真实 LLM harness 评测(D10 会话层)，或 routing harness 标记豁免 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针全程用假凭证；真云凭证只经子进程注入，未打印。d3-cloud 的 hwlink-getCredentials 已脱敏 ak 仅留前 4 位 + `****`、sk 全遮 `****`）
- [x] 写操作误判 read-only：`0`（D4-5 delete/create 分类正确；D4-13 只读子账号写被 PolicyNotAuthorized 拒绝）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始管理员凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（hdk-c4-probe，D3-C4 真云审批链路） | 是 | 已删 | ListVpcs 无此 id（remain=0） |
| OBS 桶（testbot3-hermes-c4-*） | 是 | 已删 | obsutil 无残留 |
| VPC（hdk-s2-probe，D3-S2 删除确认链路） | 是 | 已删 | ListVpcs 无此 id（remain=0） |
| OBS 桶（testbot3-hermes-c13-*） | 是 | 已删 | obsutil 无残留 |
| 只读子账号写命令（D4-13） | 否 | — | PolicyNotAuthorized（未创建） |

> 真云只删本次创建资源；删除前盘点 + 唯一时间戳名，未触碰既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9（notifications.cancellation）；D4-23 上游已明示「有意不处理」；D1-68 region 优先级需确定契约（HW_REGION vs HUAWEICLOUD_REGION）。
- 本轮 SUT 与上一轮同为 v1.1.6，15 项缺陷全部复现（无修复回归、无新增退化）。
- 本轮未覆盖（范围）：D3-S6/D3-S7 真云多服务编排、真实 Agent 会话中文意图路由（需 LLM harness，非 DSH 客户端）。
- 建议：上游按 FINDINGS.md 推进修复——重点 P0 #1/#2/#3（安全策略 + 规则注入 + 凭证脱敏），P1 #6/#8（tools/list 参数校验 + serviceCatalog 路由）。
- 环境建议：`prepare_env.py --update` 默认「自动取 next 最高」会误装预发布包（本轮实测误装 1.1.7-next.1），每日测试应显式走 latest 正式版；本机 npm 私有镜像 `127.0.0.1:45998` latest 与官方 registry 漂移问题仍在。