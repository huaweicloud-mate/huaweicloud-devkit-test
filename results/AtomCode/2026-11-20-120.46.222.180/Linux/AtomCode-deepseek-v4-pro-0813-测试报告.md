# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-11-20 05:23`（北京时间）
> **执行归档**：`results/AtomCode/2026-11-20-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（10 项 FAIL，无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.23.5 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v2.0.0-next.4`（npm @next，gitHead `16a24814`） |
| 工具全集 | `58`（TOOL_DEFINITIONS.length，见 EXP-D5-10-1） |
| hcloud / 依赖 | `hcloud 7.2.12`（doctor WARN：插件配对 7.3.12）+ 凭证已配置 |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，真机执行） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `plugins/huaweicloud-core/dist/*.js` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 走 `scripts/realcloud_e2e.mjs`（dist 布局 + vendor 门禁包装）；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `135 / 10 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `93.1%` |
| P0 / P1 / P2 新增缺陷 | `0 / 8 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（D3-C1 无残留、D3-C2 建桶后已删、D3-C6 无残留、D3-C7 EIP 归零 total_count=0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `97` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `1` | OS 专属 Windows 用例在 Linux（D1-39） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 serviceCatalog 路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D3-S1` `D3-S2` `EXP-E01` | D3功能 / D10评测集 | serviceCatalog 中文意图路由 MISS | `dist/capability-catalog.js:391` | 待提单 |
| 2 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `dist/telemetry/telemetry-values.js:21` | 待提单 |
| 3 | P1 | `D3-C1` `D3-C2` `D3-C3` `D3-C6` | D3功能 | 真云 E2E 写操作被审批门阻断 | `dist/approval-gate.js:53/77/91/99/578/587/596` + `dist/packs/huaweicloud-cli/tools.js` run_approved_command | 待提单 |
| 4 | P1 | `D1-3` | D1安装 | doctor 输出契约变化 + skills-tree 缺失 | `dist/doctor-native.ts` skills-tree 检查 + `sync_agent_plugin` | 待提单 |
| 5 | 非产品缺陷 | `D3-C7` | D3功能 | 跨区域 EIP 建删受账号 IAM 区域限制 | 云侧 VPC.0501，账号项目作用域 cn-north-4 | 不计提单 |

### 根因详情（完整见 FINDINGS.md）

- **#1 [P1] serviceCatalog 中文意图路由 MISS**：`dist/capability-catalog.js:391` 兜底返回 `Run hcloud --help`；`routeMap` 缺「云主机」关键词，分词器把服务名粘连在中文字句里无法命中。证据 `evidence/D3-S1/`、`evidence/D3-S2/`、`evidence/EXP-E01/`。
- **#2 [P2] telemetry sanitizeValue 不脱敏**：`dist/telemetry/telemetry-values.js:21` 仅空白折叠+截断，密钥明文 `AK=ABC123XYZ` 原样进入遥测事件值。证据 `evidence/D8-9/`。
- **#3 [P1] 真云 E2E 审批门阻断**：`dist/approval-gate.js` 默认 token 模式，`approvedByUser:true` 不再放行写入类工具，返回 `USER_CONFIRMATION_REQUIRED`。证据 `evidence/D3-C1~D3-C6/`。
- **#4 [P1] doctor 契约变化**：`doctor` 报 `Results: 12 pass, 5 warn, 2 fail`，2 项 fail 为 skills-tree 未预置；`prepare_env` 的 `sync_agent_plugin` 返回「Not installed」。证据 `evidence/D1-3/`。
- **#5 [非产品缺陷] D3-C7 跨区 EIP**：账号 IAM 项目作用域 cn-north-4，跨区 ap-southeast-3 建 EIP 被云侧拒（VPC.0501），非 devkit 缺陷；4/5 子断言通过，EIP 归零确认。证据 `evidence/D3-C7/`。

---

## 五、未执行用例与原因

| 分类 | 含义 | 维护 agent 动作 |
|---|---|---|
| `调归属` | 用例本不应由本 OS 执行（OS 列已标注专属） | 调整 `agent`/`OS` 列 |

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 专属：Windows 升级检测链 EINVAL 语义；OS 列标注「专属」，Linux 由 NR3 终端矩阵负面/环境验证代表覆盖 | 无需改用例，OS 列已标注专属 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D8-9 观测到脱敏缺失已记缺陷）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC/子网（D3-C1） | 否（审批门阻断，未建成） | 无需 | `无资源需清理` |
| OBS 桶（D3-C2） | 是（建桶成功） | 已删 | `Delete bucket ... successfully` |
| 沙箱（D3-C3/D3-C6） | 否（connect 被拒） | 无需 | 无残留 |
| EIP（D3-C7） | 否（云侧拒） | 无需 | `total_count=0` |

> 真云只删本次创建资源；D3-C2 建桶后立即删桶归零，无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`无`（本轮 0 条 SPEC-MISMATCH）。
- 本轮缺陷与 2026-11-19 同源（同 SUT 版本 `2.0.0-next.4` gitHead `16a24814`），5 项缺陷均经真机/源码级复现。
- 环境备注：`prepare_env --update` 的 `npm install -g huaweicloud-devkit@next` 出现一次回落安装成 `1.1.14`（dist-tag `next` 查询正确但安装结果回落 latest），导致首轮 142 探针大量 module-not-found BLOCKED；已显式 `npm install -g huaweicloud-devkit@2.0.0-next.4` 修复后重跑全部非真云用例。该安装回落行为建议维护方关注（可能复现于其它客户端）。
- 建议：真云自动化审批流恢复 `approve()` 契约或提供无人值守放行开关，以闭环建删资源用例。