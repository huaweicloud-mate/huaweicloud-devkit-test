# Codex-GPT-5 每日测试报告

> 生成时间：2026-09-13 19:00:00（北京时间）
> 执行归档：`results/Codex/2026-09-13-192.168.0.102/Windows/`
> 被测对象：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> 结论：`PARTIAL`

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Codex + GPT-5 |
| OS / 架构 | Windows / x64 |
| Node / npm / Python | Node v22.23.2 / npm 10.x / Python 3.11.15 |
| 被测版本（SUT） | v1.1.4-next.3，源码 commit `3b6290bc` |
| 工具全集 | 39（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12；doctor 10/10 pass |
| 真云凭证 | 已配置；本轮未创建或修改真云资源 |
| 测试类型 | 源码级探针 / Windows CLI / MCP 协议 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152 |
| 已执行 | 30 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 26 / 2 / 2 / 0 / 122 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 92.86% |
| P0 / P1 / P2 新增缺陷 | 0 / 1 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 无本轮创建的真云资源，残留 0 项 |

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---:|---|
| PASS | 25 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | Codex Windows 重装与状态一致性问题，见 FINDINGS |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 54 | 未覆盖的场景保持如实记录 |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---:|---|
| PASS | 1 | Windows 更新检测回归 |
| FAIL | 0 | |
| BLOCKED | 2 | Linux 与 macOS/ARM 不在当前 Windows 环境 |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 68 | 未覆盖的展开场景 |
| **合计** | **71** | |

## 四、逐用例结果（已执行项，含 PASS/FAIL/BLOCKED/SPEC）

已执行设计级用例：`D1-1`、`D1-3`、`D1-4`、`D1-6`、`D1-26`、`D1-27`、`D1-28`、`D1-30`、`D1-31`、`D1-33`、`D1-39`、`D1-40`、`D2-11`、`D3-A1`、`D3-C5`、`D4-7`、`D4-21`、`D4-22`、`D4-23`、`D5-1`、`D5-3`、`D8-7`、`D9-1`、`D9-3`、`D9-4`、`D9-5`、`D9-8`。其中除 `D1-1`、`D1-4` 外均为 `PASS`；证据路径与副本 CSV 的 `执行状态` / `evidencePath` 一致。

展开级：`EXP-NR3-09` 为 `PASS`，证据复用 Windows 更新检测探针；`EXP-NR3-10` 为 `BLOCKED`（当前非 Linux）；`EXP-NR3-11` 为 `BLOCKED`（当前无 macOS/ARM runner）。其余展开级为 `NOT_RUN`。

## 五、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---:|---|---|---|---|---|---|---|---|
| 1 | P1 | `D1-1` | Codex 卸载后重装失败 | `install --target codex` 返回成功并完成插件安装 | 返回 `Installation failed for: codex` | `setup-cli.mjs:659-675` | P | 待提单 |
| 2 | P2 | `D1-4` | status 与重装结果不一致 | 安装失败后状态不得报告可用安装 | status 仍输出 `Plugin: Installed` | `setup-cli.mjs:704-719` | P | 待提单 |

根因与复现证据详见同目录 `FINDINGS.md`。

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `EXP-NR3-10` | 当前执行环境为 Windows，无法验证 Linux 专项断言 | Linux runner | 提供 Linux runner 后复测 |
| `EXP-NR3-11` | 当前无 macOS/ARM 测试机或 CI runner | macOS/ARM runner | 提供 runner 后复测 |

## 七、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：本轮未执行真云写操作
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录未写入原始 AK/SK 或未脱敏凭证日志

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/OBS/沙箱等 | 否 | 不适用 | 无本轮资源残留 |
| Codex 本地插件注册 | 是（测试安装） | 保留被测安装态供后续复测 | `codex plugin list --json` 已核验 |

## 九、遗留与建议

- 待裁决 SPEC：无。
- 本轮未覆盖：其余 122 条 daily 用例、Linux/macOS 矩阵、真云 E2E、完整审批交互、多客户端现场矩阵。
- 建议：优先复测 Codex CLI 的 `plugin add` 非零退出原因，并让安装流程保留底层 stderr、以实际可用性校验覆盖仅看持久化列表的状态判断。
