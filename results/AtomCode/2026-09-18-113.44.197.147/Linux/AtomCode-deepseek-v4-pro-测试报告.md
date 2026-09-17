# AtomCode-deepseek-v4-pro 测试报告（v1.1.5 每日全量重跑）

> **报告名**：`AtomCode-deepseek-v4-pro-测试报告.md`
> **生成时间**：`2026-09-18 05:20:19`（北京时间）
> **执行归档**：`results/AtomCode/2026-09-18-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（v1.1.5 上 5 项 P0 缺陷仍复现 + 2 项 P1 缺陷 + 1 项测试侧差异）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f6`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 已配置，真实凭证可调云 API |
| 真云凭证 | 管理员 `~/.config/huaweicloud/credentials.json`（cn-north-4）+ 只读子账号 `credentials.readonly.json`（test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 80 / 展开级 39（预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout*.log`；CLI 真机执行记录日志；D10 评测跑 `eval/harness/run-eval.mjs`，D9 协议跑 `eval/harness/protocol-probe.mjs`；证据统一落 `evidence/<case-id>/`。本轮为 v1.1.5（latest）每日强制完整重跑：全部探针当天重新执行、证据落盘、状态回填。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `119`（设计级 80 + 展开级 39） |
| 已执行 | `119` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `89 / 19 / 9 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `81.7%`（89/109） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（本轮缺陷均为 v1.1.5 上已复现/已记录项，历史查重不重复提单） |
| 历史 P0 缺陷（v1.1.5 仍复现） | `5`（D4-2 / D4-16 / D4-21 / D4-23 / D9-2） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 真云创建 1 个最小规格 VPC，测后删除归零（list 计数=0） |

---

## 三、状态汇总

### 3.1 设计级（80，OS 专属豁免 1）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `62` | 有证据且通过 PASS 门禁 |
| FAIL | `7` | D3-C4 / D4-2 / D4-16 / D4-21 / D4-23 / D9-2 / D10-3 |
| BLOCKED | `9` | D1-1/2/5/6/58、D4-8/12、D7-4、D9-5 |
| SPEC-MISMATCH | `1` | D9-9 capabilities.notifications.cancellation 未声明 |
| NOT_RUN | `1` | D1-39 Windows 专属（Linux 由展开级 EXP-NR3 代表覆盖） |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | D5-10×2 + EXP-C4×22 + EXP-E HIT×3（E06/E09/E15） |
| FAIL | `12` | EXP-E01~E15 中 11 MISS + E08 诊断未识别 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整（`env\|grep HW_*` 形态） | `env \| grep HW_SECRET_KEY` → `deny` | `allow` | `safety-policy.mjs:398-399` | P | 历史仍复现 |
| 2 | P0 | `D4-16` | 命令包裹穿透（sh -c 包 env dump） | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` → `deny` | `allow` | `safety-policy.mjs:398` | P | 历史仍复现 |
| 3 | P0 | `D4-21` | IaC 制品 broad IAM（HCL `actions=["*"]`） | HCL `actions=["*"]` 应拦截 | findings 空 | `cloud-risk-rules.json:179,192` | P | 历史仍复现 |
| 4 | P0 | `D4-23` | kms Decrypt 直连未识别为 secret | `hcloud kms Decrypt` → `deny`/secret | `allow`/unknown_read | `policy.json:26` | P | 历史仍复现 |
| 5 | P0 | `D9-2` | invalid params 未返回 -32602 | 非法 params → `-32602` | 无 error 对象 | `mcp-protocol.mjs:73` | G | 历史仍复现 |
| 6 | P1 | `D10-3` | 中文意图路由准确率 21.4% | 路由准确率 ≥90% | 21.4%（3/14 HIT） | `tools.mjs:1776` | G | 历史仍复现 |
| 7 | P1 | `D9-9` | capabilities.notifications.cancellation 未声明 | 应声明取消能力 | 未声明 | `mcp-protocol.mjs:63` | G | SPEC-MISMATCH |
| 8 | 测试侧 | `D3-C4` | hcloud CLI OBS/DMS/DEW 不可执行 | 22 服务可执行 | 19/22 | hcloud CLI 7.2.12 | E | 非产品缺陷 |

> **D9-9（SPEC-MISMATCH）**：initialize 返回 `capabilities:{tools:{}}`，未声明 `notifications.cancellation`（`mcp-protocol.mjs:63`），记为契约漂移，待裁决。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-1` | 设计级 | P1 | BLOCKED | 改用例 | 破坏性全局安装/卸载/改源/多客户端覆盖，run-only 每日测试不应破坏共享环境 | 用例标注「破坏性」，run-only 环境豁免或下沉到独立隔离机 |
| `D1-2` | 设计级 | P2 | BLOCKED | 改用例 | 破坏性全局安装/卸载/改源 | 同上 |
| `D1-5` | 设计级 | P1 | BLOCKED | 改用例 | 破坏性全局改源（切换 npm 源） | 同上 |
| `D1-6` | 设计级 | P2 | BLOCKED | 改用例 | install-hcloud 为破坏性命令引导 | 同上 |
| `D1-58` | 设计级 | P1 | BLOCKED | 补环境 | 需交互式 install 菜单 option3 白名单探测（PTY），run-only 无 PTY | 提供 PTY/非交互等价探测 |
| `D4-8` | 设计级 | P1 | BLOCKED | 补环境 | Python hook 路径本机未携带 | 补装 Python hook 后复测 |
| `D4-12` | 设计级 | P2 | BLOCKED | 补环境 | 供应链/SBOM 审计需独立 CI + npm audit 全量核对 | 补 CI 环境 |
| `D7-4` | 设计级 | P2 | BLOCKED | 改用例 | 国内镜像源安装需切换全局 npm 源（破坏性） | run-only 豁免 |
| `D9-5` | 设计级 | P1 | BLOCKED | 补环境 | stdio 大 payload/断连恢复需真实 MCP 传输子进程压测，现有 protocol-probe 不覆盖 | 补可注入大 payload/断连的 MCP 夹具 |
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（升级检测链 EINVAL）；Linux 已由展开级代表覆盖 | 无（归属正确） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D2-4/D3-B3/D4-27 脱敏断言通过）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（最小规格） | 是（`ac-cc-*`） | 已删 | list 计数=0 |

> 真云只删本次创建资源；未触碰既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.notifications.cancellation 未声明）。
- 本轮未覆盖（说明范围）：`D9-5`（stdio 大 payload/断连恢复）、`D1-58`（交互式 PTY install 菜单）、`D4-8`（Python hook）、`D4-12`（SBOM 独立 CI）——均保留 BLOCKED 并写明解除条件。
- 建议：优先修复 5 项 P0 残留——D4-2（`env|grep HW_*` 形态）、D4-16（env-dump 命令包裹）、D4-21（HCL broad IAM）、D4-23（kms Decrypt）、D9-2（JSON-RPC -32602），并补齐 D10-3 中文意图路由。