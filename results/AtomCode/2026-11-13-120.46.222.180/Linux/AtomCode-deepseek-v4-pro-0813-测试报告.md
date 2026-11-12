# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-13 06:30:00（北京时间）
> **执行归档**：`results/AtomCode/2026-11-13-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit `v2.0.0-next.3`（npm @next，gitHead `4b718720`）
> **结论**：**PARTIAL**（存在 P1 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v2.0.0-next.3`（npm @next，gitHead `4b718720`，PR #1130 合入 v2 分支） |
| 工具全集 | 56（`tools.js` TOOL_DEFINITIONS，展开级断言） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 提示 7.3.12 版本不匹配）、undici 8.12.4 |
| 真云凭证 | cn-north-4（AKSK，真机执行 D3-C1/C2/C3/C6 建删资源） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 + 展开级 39（init_day 预筛后） |

> **版本跳变**：SUT 由 `v1.1.14-next.2` 跳变至 `v2.0.0-next.3`，源码 `.mjs` → `.ts` → 编译 `dist/*.js`，新增 vendor gate、审批姿态（DEVKIT_APPROVAL_MODE）、packs 分层。探针已适配：源路径指向 npm 全局包 `plugins/huaweicloud-core/dist`、`.mjs`→`.js`、gated 工具注入 `vendorConfirmed`。
> **执行方法**：探针脚本（.mjs）直调编译 dist 导出函数 + 真机 CLI + 真云 E2E，结论落 `stdout.log`，证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146 |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 135 / 9 / 0 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 93.1% |
| P0 / P1 / P2 新增缺陷 | 0 / 4 / 2 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（D3-C1 测试侧补删、D3-C2 桶已删、D3-C7 无残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 97 | 有证据且通过 PASS 门禁 |
| FAIL | 8 | D1-3 / D3-C1 / D3-C2 / D3-C7 / D3-S1 / D3-S2 / D8-9 / D10-3 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 1 | D9-9 |
| NOT_RUN | 1 | D1-39（OS 专属 Windows，Linux 侧由 EXP 代表覆盖） |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 |
| **合计** | **39** | |

---

## 四、缺陷清单

> 完整见 `FINDINGS.md`；根因均指向 v2 源文件（.ts 行号以 `4b718720` 为准）。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P1 | D3-S1/D3-S2/EXP-E01 | serviceCatalog 中文意图含英文服务名路由 miss | capability-catalog.ts:264 |
| 2 | P1 | D10-3 | vendor gate 使路由评测 harness 全程 MISS | vendor-gate.ts:49 |
| 3 | P2 | D8-9 | sanitizeValue 完全不脱敏键值 | telemetry-values.ts:27-31 |
| 4 | P1 | D9-9 | mcp-protocol 未声明取消/超时语义（SPEC-MISMATCH） | mcp-protocol.ts |
| 5 | P1 | D3-C7 | 跨区域写操作 token 项目不匹配未预检 | services/availability.ts:36-49 |
| 6 | P2 | D1-3 | npm -g 安装后 skills-tree 未物化，doctor 报 3 失败 | setup-cli.ts:1126-1141 |

---

## 五、未执行/阻塞用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 【调归属】 | OS 专属：Windows 升级检测链 EINVAL 语义，Linux 侧由 d1-upgrade queryDistTagsSync-no-EINVAL 代表覆盖 |

> 本日无 BLOCKED（真云已真机执行；无明显外部依赖阻塞）。

---

## 六、安全/红线

- v1→v2 已修复昨日缺陷：D2-4/D4-27 双路径脱敏（v2 已 `ak/sk/token=<redacted>`）、D4-25 Python hook 写命令分类（`cli:write` 命中）。本日 PASS。
- 仍存脱敏缺陷 D8-9（sanitizeValue 不脱敏，P2），计入缺陷清单。
- vendor gate 引入 route 层评测阻断（D10-3），安全收紧但破坏确定性评测通道，见缺陷 #2。

---

## 七、资源释放

| 资源 | 结论 |
|---|---|
| D3-C1 VPC/subnet/ECS | subnet/VPC 由 e2e finally 删除；ECS `1a36ba8c-...` 由测试侧补删 + `ListServersDetails` 归零验证（zeroing-verify.json） |
| D3-C2 OBS 桶 | 桶 `testbot3-hermes-obs-4521140794` 已 `OBS rm` 删除归零 |
| D3-C7 EIP | 创建失败（VPC.0501），无残留；ListPublicips 确认 total_count=0 |
| 测试侧临时 VPC | 审批流复现时创建的 `zztest` VPC 已删除并验证归零 |

---

## 八、遗留建议

1. **serviceCatalog 路由**：中文意图含英文服务名分词建议补「中文/英文边界」切分 + 「云主机」等关键词，缓解 D3-S1/S2/EXP-E01 miss（缺陷 #1）。
2. **vendor gate 与评测通道**：为确定性路由评测（run-eval.mjs）提供显式 vendor 断言或豁免，避免 D10-3 评测 100% MISS（缺陷 #2）。
3. **安装流程**：`npm install -g` 后应自动物化 skills-tree 或在 doctor 中给出可落地的一次性 install 指引，消除 D1-3 红灯（缺陷 #6）。