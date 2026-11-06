# OfficeAce-testbot4 每日测试报告

> **报告名**：`OfficeAce-testbot4-测试报告.md`
> **生成时间**：2026-11-07 05:53:50（北京时间）
> **执行归档**：`results/OfficeAce/2026-11-07-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷；3 项 FAIL 均为历史问题连续复现，已历史查重不重复提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `testbot4` |
| OS / 架构 | `Windows 11` |
| Node / npm / Python | `Node v22.22.2 / npm 12.1.0 / Python 3.11.9` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.14-next.0`（gitHead `ac955889`，PR #1111 sync/lockfile-fix 之后） |
| 工具全集 | `47`（MCP `tools/list` 实测 toolCount=47，badSchemas=0） |
| hcloud / 依赖 | 已配置（prepare_env --update 通过） |
| 真云凭证 | `cn-north-4`（credentials.json 已配置） |
| 测试类型 | 源码级探针直调 / MCP 协议真机 / CLI 真机（version/doctor/status/plugins） |
| 设计真源 | 设计级 107 / 展开级 39 / 追踪表 216 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：批处理探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（redactString/classifyTextCommand/judgeUpdate 等）与 MCP 服务（initialize/tools/list/tools/call）真实执行，决策/结果逐用例落 `stdout.log`；真云用例经 MCP `plan`/`list_operations` 真机调用；EXP-D5-7 客户端矩阵用例以 CLI `plugins/status --target officeace` + MCP `tools/list` 真机补齐；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 3 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（3 项 FAIL 均命中历史单，不重复提单） |
| 红线（I 类）违规 | `1`（D2-4 小写 ak=/sk= 凭证明文泄漏，历史问题） |
| 资源释放 | `全部归零`（本轮无需真云建删资源，沙箱 4 例缺 DevStation 上游不可建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单（D2-4、D4-3） |
| BLOCKED | `5` | 环境/权限/凭证阻塞（D1-67 DSH 专属 + 4 例沙箱 DevStation 上游缺） |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单（EXP-E01） |
| BLOCKED | `0` | 环境阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 小写 ak=/sk= 凭证明文未脱敏 | 凭证值应脱敏为 `<redacted>`，akLeak/skLeak=false | 返回样本仍含 `ak=TESTAK... sk=TESTSK...`，akLeak=true skLeak=true | `safety-policy.mjs:45` AK/SK 正则未加 `i` 忽略大小写 | I | 历史问题（#1065/#1055/#980） |
| 2 | P0 | `D4-3` | D4安全 | KMS DecryptData 明文 secret API 未拦截 | `classifyTextCommand` 应返回 `deny` | `decision=allow` | `safety/policy.json` blockedSecretOperations 未含 DecryptData；`safety-policy.mjs:249` | I | 历史问题（#1065/#1055） |
| 3 | P1 | `EXP-E01` | D3功能(EXP) | 中文「云主机」未路由 ECS 服务 | prompt 应命中 `ECS` | 返回 `Run hcloud --help to list available services.`，verdict=MISS | `tools.mjs:2287` ECS routeMap keywords 缺「云主机」 | G | 历史问题（#1055） |

### 根因详情

- **D2-4**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:45` 的 `redactString` AK/SK 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 未加 `i` 标志，导致小写 `ak=`/`sk=` 绕过脱敏。断言：`akLeak`/`skLeak` 应为 false，实际 true。证据：`evidence/D2-4/stdout.log`。

- **D4-3**：`hdk/plugins/huaweicloud-core/src/safety/policy.json` 的 `blockedSecretOperations` 未包含 `DecryptData`；`safety-policy.mjs:249` 仅按该列表匹配 action 拦截。断言：KMS `DecryptData`（返回明文密钥料）应 `deny`，实际 `allow`。证据：`evidence/D4-3/stdout.log`。

- **EXP-E01**：`tools.mjs:2287` ECS 路由 `serviceCatalog` routeMap 的 keywords 仅含「云服务器」，缺「云主机」。断言：prompt「帮我查一下我账号在华北北京四有哪些云主机」应命中 `ECS`，实际 verdict=MISS。证据：`evidence/EXP-E01/stdout.log`。

---

## 五、未执行用例与原因

### BLOCKED（共 5 例，均为环境/归属阻塞，非本轮新增缺陷）

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | `AGENT_TOOLKIT_MODE=local` 为 DSH 客户端专属；OfficeAce 无该环境变量语义 | 【调归属】OS/客户端专属用例在非对应客户端 |
| `D3-C3` | D3功能 | 沙箱部署 E2E | 需 DevStation 上游网络连接的真实沙箱环境 | 【补环境】 |
| `D3-C14` | D3功能 | 沙箱 HDKit | 需 DevStation 上游网络连接 | 【补环境】 |
| `D3-S3` | D3功能 | 沙箱删除资源 | 需 DevStation 上游网络连接 | 【补环境】 |
| `D3-S7` | D3功能 | 沙箱重启 | 需 DevStation 上游网络连接 | 【补环境】 |

---

## 六、安全 / 红线

| 红线 | 结果 |
|---|---|
| I 类（凭证/密钥明文泄漏） | 命中 1 项（D2-4 小写 ak=/sk= 明文泄漏，历史问题，安全策略未覆盖小写形式） |
| 真云资源泄漏 | 无（本轮无建删资源） |
| 脱敏/拦截绕过 | D4-3 KMS DecryptData 未拦截（历史问题） |

---

## 七、资源释放

本轮未执行真云建删资源用例，无残留资源需要释放。沙箱 4 例因缺 DevStation 上游未建资源。

---

## 八、遗留建议

1. 3 项 FAIL 均为历史问题连续复现（D2-4、D4-3、EXP-E01，与 2026-11-06/11-05/11-04 相同根因），建议追踪上游修复节奏；相关历史单 #1065/#1055/#980 仍 open。
2. 沙箱 4 例（D3-C3/D3-C14/D3-S3/D3-S7）依赖 DevStation 上游，建议补该环境后专项回归。
3. D1-67 为 DSH 客户端专属用例，OfficeAce 侧无对应环境变量语义，建议确认归属列是否需要调整。