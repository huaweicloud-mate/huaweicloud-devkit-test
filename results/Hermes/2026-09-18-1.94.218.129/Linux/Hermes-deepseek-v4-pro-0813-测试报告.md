# Hermes-deepseek-v4-pro-0813 测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-18 05:30:00`（北京时间）
> **执行归档**：`results/Hermes/2026-09-18-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.5（npm latest，gitHead `e7ed6f66`）
> **结论**：`PARTIAL`（4 项 P0 历史缺陷（D4-16/D2-4/D4-23/D9-2）+ 4 项 P1 历史缺陷，全部为历史复现；真云 E2E 真机完成且归零）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04.4） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.5（npm latest 正式版，gitHead `e7ed6f66`；已从官方 registry 安装，规避私有镜像 1.1.3 滞后） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS，protocol-probe tools/list 实测 40） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 环境就绪 |
| 真云凭证 | cn-north-4（管理员 AKSK + 只读子账号 test001 均就绪） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 80 / 展开级 48（已按 Hermes+Linux 预筛） |

> **执行方法**：探针（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结果落 `evidence/<id>/stdout.log`；协议/评测走 harness（protocol-probe.mjs / run-eval.mjs）；真云走 hcloud + plan→run_approved 审批链路，建删归零。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 128（设计级 80 + 展开级 48） |
| 已执行（PASS+FAIL+SPEC） | 126 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 107 / 18 / 0 / 1 / 2 |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED/NOT_RUN） | 84.9%（107/126） |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 0（全部为历史缺陷复现） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（VPC/OBS 建删 + 残留 0） |

---

## 三、状态汇总

### 3.1 设计级（80）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 71 | 有证据且通过 PASS 门禁 |
| FAIL | 7 | D2-4 / D4-16 / D4-23 / D4-27 / D8-4 / D9-2 / D10-3 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 1 | D9-9（cancellation 未声明） |
| NOT_RUN | 1 | D1-39（Windows 专属，OS 专属豁免；展开级 EXP-NR3-10 代表覆盖） |
| **合计** | **80** | |

### 3.2 展开级（48）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 36 | 22 项 C4 服务矩阵 + D5/NR3/D1-58 + E06/E09/E15 |
| FAIL | 11 | EXP-E01~05/07/10/11/12/13/14（路由 MISS） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | EXP-E08（诊断类 intent，不在 serviceCatalog 路由范围） |
| **合计** | **48** | |

---

## 四、缺陷清单（全部为历史缺陷，详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 历史单 |
|---|---|---|---|---|---|
| 1 | P0 | D4-16 | sh -c 包裹凭证 env 打印未拦截 | safety-policy.mjs:384（classifyTextCommand 未解包） | #677/#682/#694 |
| 2 | P0 | D2-4 | redactString 字符串路径漏小写 ak=/sk= | safety-policy.mjs:41-45 | #694/#683/#651/#679 |
| 3 | P0 | D4-23 | 全局规则 huawei-agent-rules.mdc 未注入 | package.json:8 + setup-cli.mjs | #650/#679 |
| 4 | P1 | D4-27 | redactSecrets 字符串路径漏小写 ak=/sk=/token= | safety-policy.mjs:41-45 | 同 D2-4 |
| 5 | P1 | D8-4 | INSTALL.md 未随包发布 | package.json:8 | #694/#681/#675 |
| 6 | P0 | D9-2 | invalid params 未返回 -32602 | mcp-protocol.mjs 参数校验分支 | #704/#672/#651 |
| 7 | P1 | D9-9 | notifications.cancellation 未声明（SPEC） | mcp-server.mjs:158 | #698 |
| 8 | P1 | D10-3/EXP-E | serviceCatalog 路由命中率 21.4% | tools.mjs:350 | #689/#683 |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（升级检测链 EINVAL 语义），本机 Linux；由展开级 EXP-NR3-10（P0）代表覆盖 |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 改用例 | 诊断类意图（explain_error）不在 serviceCatalog 路由范围（harness 标记 N/A）；explain_error 路由需真实 LLM harness |

> 说明：以上 2 条均非「归我但没跑」，而是结构性不适用/需 LLM harness。其余 126 条全部实际执行并回填，无 BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针全程使用假凭证；D2-26/D4-27 隔离 HOME 测试；真云凭证只经 run-as-readonly/--cli-access-key 子进程注入，未打印）
- [x] 写操作误判 read-only：`0`（D4-5 delete/create 分类正确；D4-13 只读子账号写被 PolicyNotAuthorized 拒绝）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D4-13 子进程输出已 redact）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（hdk-c4-probe，真云审批链路） | 是 | 已删 | ListVpcs 无此 id（remain=0） |
| OBS 桶（testbot3-hermes-c4-*） | 是 | 已删 | obsutil 无残留（Delete bucket successfully） |
| VPC（hdk-ro-probe，D4-13 探针误建×2） | 是 | 已删 | ListVpcs 计数 0 |

> 真云只删本次创建资源；删除前盘点 + 本次创建唯一时间戳名，未触碰既有/他人资源。残留即 FAIL。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9（notifications.cancellation）；D4-23 上游已明示「有意不处理」（#650）。
- 本轮未覆盖（范围）：真实 Agent 会话中文意图路由（需 LLM harness，ITER-004+ 待建）；D1-39 Windows 专属（需 Windows 真机）；性能/破坏性升级/多客户端矩阵不在 daily 精选。
- D10-4 安全干预：确定性 hook 审批层（plan→confirm/deny + run_approved_command + 真云审批链路）已实证 PASS；「真实 Agent 高危请求自动走审批」的 LLM 层待真实 Agent harness。
- 建议：上游按 FINDINGS.md 推进 #677（D4-16 sh 包裹）、#694（D2-4/D8-4 打包）、#679（D4-23 rules 注入）、#672（D9-2 -32602）、#698（D9-9 cancellation）、#689（D10-3 路由）修复。