# Hermes-DeepSeek-V4-Pro-v1.1.5 版本全量测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-v1.1.5-测试报告.md`
> **生成时间**：`2026-09-16 10:12:00`（北京时间）
> **执行归档**：`results/Hermes/2026-09-16-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）v1.1.5（npm latest）
> **测试类型**：版本全量测试（母版全量，`init_day --full`）
> **结论**：`PARTIAL`（存在 P0 缺陷 D4-16）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Windows 10 x64 |
| Node / npm / Python | Node v22.23.2 / npm 10.9.8 / Python 3.11.15 |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f66`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，MCP tools/list 实测 40） |
| hcloud / 依赖 | hcloud（KooCLI 已配置，admin + 只读子账号 test001） |
| 真云凭证 | `cn-north-4`（AKSK 有效；只读子账号 test001 已下发） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E / D10 eval harness |
| 用例源 | 母版全量 设计级 179 + 展开级 137（按 Hermes+Windows 预筛后 57） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；CLI 真机执行；MCP 协议走 `eval/harness/protocol-probe.mjs`；D10 评测走 `eval/harness/run-eval.mjs`；真云 D4-13 走 `run-as-readonly.py`（只读子账号）、D3-C4 走最小 VPC 创建-删除-归零。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（全量，预筛后） | `236`（设计级 179 + 展开级 57） |
| 已执行 | `235`（展开级 1 条 EXP-E08 诊断类 N/A） |
| PASS / FAIL / SPEC-MISMATCH / NOT_RUN | `220 / 14 / 1 / 1` |
| 通过率（分母=PASS+FAIL+SPEC，不含 NOT_RUN） | `93.6%`（220/235） |
| P0 / P1 / P2 新增缺陷 | `1 / 4 / 0` |
| 红线（I 类）违规 | `1`（D4-16 安全包裹穿透，属安全红线风险） |
| 资源释放 | `全部归零`（D3-C4 创建 VPC 已删除，ShowVpc 返回 VPC.9904） |

---

## 三、状态汇总

### 3.1 设计级（179）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `175` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | D4-16 / D8-4 / D9-2 |
| SPEC-MISMATCH | `1` | D9-9 |
| NOT_RUN | `0` | — |
| **合计** | **`179`** | |

### 3.2 展开级（57）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `45` | 含 EXP-C4 22 条、EXP-NR3/D5 等 |
| FAIL | `11` | EXP-E01~E14 路由 MISS（11/15） |
| NOT_RUN | `1` | EXP-E08（诊断类 N/A，非服务路由意图） |
| **合计** | **`57`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | 命令包裹穿透：`sh -c "printenv HW_ACCESS_KEY"` 未拦截 | `deny` | `allow` | `safety-policy.mjs:384`（文本路径未解包 shell，仅 #650 hcloud args 路径有）：`stripExecutable` 在 67-89 | 待提单 |
| 2 | P1 | `D10-3` / `EXP-E01~14` | serviceCatalog 路由命中率 21.4% | 中文意图命中期望服务 | 11/14 MISS，返回 `--help` 兜底 | `tools.mjs:350` | 待提单 |
| 3 | P1 | `D9-2` | JSON-RPC invalid params 未返回 -32602 | `error.code=-32602` | 无 error 对象 | `mcp-server.mjs`（参数校验失败分支） | 待提单 |
| 4 | P1 | `D8-4` | INSTALL.md 未随 npm 包发布 | INSTALL.md 存在 | 缺失 | `package.json` files 白名单 | 待提单 |
| 5 | P1 | `D9-9` | 未声明 notifications.cancellation（契约漂移） | 声明 cancellation | 缺失 | `mcp-server.mjs:158` | 待裁决 |

> 根因细节、复现命令、代码片段见 `FINDINGS.md`（本文同目录）。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `EXP-E08` | 展开级 | P1 | NOT_RUN | 改用例 | 评测集中该条为「ECS 启动失败帮我分析原因」诊断类意图，非服务路由意图，`serviceCatalog` 路由层不适用（run-eval 判 N/A） |

> 其余未执行用例 = 0。展开级「不涉及本客户端/OS」的 80 条在建包时已按 Hermes+Windows 预筛剔除。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（show_profile_redacted 实测无明文 AK/SK）
- [ ] 写操作误判 read-only：`0`（D4-5/D4-13 分类实测正确）
- [x] 红线（I 类）违规：`1` —— **D4-16 sh -c 包裹穿透**（安全包裹可绕过，需上游修复）
- [x] 脱敏复核：真云命令输出经 run-as-readonly / redactOutput 脱敏，证据目录无原始凭证

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（`testbot3-hermes-c4-0916095738`，cidr 10.99.0.0/16） | 是 | 已删 | `ShowVpc` 返回 `VPC.9904 could not be found` |
| 只读子账号 test001 写操作 | — | — | 未创建任何资源（D4-13 只读命令 7/7，D3-C4 写分类判 deny） |

> 真云只删本次创建资源（VPC ID `402b3e34-...`），未触碰既有 VPC（`testbot5-view2-free-vpc` 等）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（notifications.cancellation 未声明，是否补齐协议契约）。
- 待上游修复：`D4-16`（P0 安全）、`D9-2`（-32602）、`D8-4`（INSTALL.md 打包）、`D10-3`（路由命中率）。
- 本轮未覆盖（说明范围）：真实 Agent 会话理解中文意图并路由（需 LLM harness，`run-eval.mjs` 的 serviceCatalog 路由层为确定性调用，已跑出 21.4% 基线）；10 客户端终端矩阵（仅覆盖 Hermes 客户端）。
- 建议：D10 路由层引入关键词/近义词词典扩展覆盖率，或将「未命中即判 FAIL」的基线阈值纳入回归盯防。