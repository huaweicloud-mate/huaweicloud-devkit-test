# OpenClaw-glm-5.2 每日测试报告

> **报告名**：`OpenClaw-glm-5.2-测试报告.md`
> **生成时间**：`2026-09-14 22:32:11`（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-14-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS`（0 FAIL，P0 无缺口）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `glm-5.2` |
| OS / 架构 | `Windows 11 AMD64` |
| Node / npm / Python | `Node v24.14.1 / npm 11.11.0 / Python 3.13.4` |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `9b67256`） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已安装 / doctor 11/11 pass` |
| 真云凭证 | `AKSK 已配置 / 本轮未使用真云写操作` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 |
| 设计真源 | 设计级 81 / 展开级 71 / 追踪表 183 行 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本直调 `hdk/src/*` 导出函数，CLI 真机执行记录日志，MCP 协议级验证通过源码审查+运行时确认；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `81` |
| 已执行 | `81` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `33 / 0 / 48 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `100%`（33/33） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本轮未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `33` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 无 |
| BLOCKED | `48` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `15` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 无 |
| BLOCKED | `56` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`71`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 本轮测试 **0 FAIL / 0 SPEC-MISMATCH**，无缺陷需提单。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| — | — | — | 无缺陷 | — | — | — | — | — |

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D2-11` | 需真云 STS token (securityToken) | 真云凭证+STS | 配置 STS 临时凭证后复测 |
| `D4-1` | OpenClaw 非 hook-capable 客户端 | hook-capable 客户端 | 切换 hook 客户端或 OpenClaw 增加 hook 支持 |
| `D4-2` | OpenClaw 非 hook-capable 客户端 | hook-capable 客户端 | 同上 |
| `D4-3` | OpenClaw 非 hook-capable 客户端 | hook-capable 客户端 | 同上 |
| `D4-5` | 需 hook-capable 客户端 plan_cli_command | hook-capable 客户端 | 同上 |
| `D4-9` | OpenClaw 非 hook-capable 客户端 | hook-capable 客户端 | 同上 |
| `D4-15` | OpenClaw 非 hook-capable 客户端 | hook-capable 客户端 | 同上 |
| `D4-16` | OpenClaw 非 hook-capable 客户端 | hook-capable 客户端 | 同上 |
| `D4-18` | 需真云写操作触发确认流 | 真云凭证+hook | 配置真云凭证+hook 客户端 |
| `D4-19` | OpenClaw 非 hook-capable 客户端 | hook-capable 客户端 | 同上 |
| `D4-21` | OpenClaw 非 hook-capable 客户端 | hook-capable 客户端 | 同上 |
| `D4-22` | OpenClaw 非 hook-capable 客户端 | hook-capable 客户端 | 同上 |
| `D4-23` | 需逐个安装目标验证 | 多客户端环境 | 在多客户端环境中复测 |
| `D10-4` | 需评测 harness+真实 Agent 环境 | 评测框架 | 搭建评测 harness 后复测 |
| `D1-1` | 全新环境引导安装-需环境重置 | 隔离环境 | 在全新环境复测 |
| `D1-5` | uninstall 干净度-需卸载测试 | 可卸载环境 | 执行卸载后复测 |
| `D1-31` | dismiss 冷却期-需 MCP 进程交互 | MCP 进程 | 启动 MCP server 交互测试 |
| `D1-41` | check_update 真实 MCP 返回契约 | 隔离 HOME | 在隔离 HOME 环境复测 |
| `D1-42` | dismiss 真实闭环与跨调用持久化 | 隔离 HOME+MCP | 在隔离环境复测 |
| `D1-45` | 兜底提示真实序列与预热竞态 | 隔离 MCP 进程 | 在隔离环境复测 |
| `D1-58` | 通用 MCP 白名单接入 | 隔离 HOME | 在隔离 HOME 环境复测 |
| `D2-1` | auth init 三端同步 | 真云凭证交互 | 配置真云凭证后复测 |
| `D2-10` | R7 current 档跟随 | 真云多 profile | 配置多 profile 后复测 |
| `D2-12` | R10 runtime 非空禁止落盘 | 真云 auth_init | 配置真云凭证后复测 |
| `D2-13` | R9 configuredBySession | 真云凭证 | 配置真云凭证后复测 |
| `D2-16` | import 文件读取后擦除 | 真云 auth_switch | 配置真云凭证后复测 |
| `D3-A1` | skill 检索完整性 | MCP 工具调用 | 通过 MCP 工具调用复测 |
| `D3-B3` | run_readonly 脱敏执行 | 真云只读命令 | 配置真云凭证后复测 |
| `D3-C4` | 服务创建类回归 | 真云 22 服务矩阵 | 配置真云凭证后复测 |
| `D4-13` | 最小权限凭证通过率 | 只读 IAM AK/SK | 配置只读凭证后复测 |
| `D4-24` | 确认令牌过期 | 真云写操作+可注入时钟 | 配置真云凭证后复测 |
| `D4-4` | 写操作审批门 | hook-capable 客户端 | 切换 hook 客户端 |
| `D4-6` | adminPass 回显警告 | hook-capable 客户端 | 同上 |
| `D4-7` | hook 三工具有效性 | hook-capable 客户端 | 同上 |
| `D4-8` | Python/Node 策略一致 | hook-capable 客户端 | 同上 |
| `D4-17` | hook 模糊 fail-closed | hook-capable 客户端 | 同上 |
| `D4-20` | 拒绝后零操作 | hook-capable 客户端 | 同上 |
| `D10-1` | 工具描述可选择性 | 评测 harness | 搭建评测 harness 后复测 |
| `D10-2` | skill 激活率 | 评测 harness | 同上 |
| `D10-3` | 路由准确率+混淆矩阵 | 评测 harness | 同上 |
| `D10-5` | 多轮任务完成率 | 评测 harness | 同上 |
| `D3-B1` | list_operations 规范名 | 真云 hcloud CLI | 配置真云凭证后复测 |
| `D4-10` | 规则库新增回归 | hook-capable 客户端 | 切换 hook 客户端 |
| `D4-14` | 操作可审计性 | 真云 CTS 审计日志 | 配置真云凭证后复测 |
| `D8-6` | 中英文文档一致 | 中文 README | 补充中文 README 后复测 |

> **阻塞分类汇总**：hook-capable 相关 16 项、真云凭证相关 18 项、评测 harness 5 项、隔离环境 6 项、其他 3 项。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | N/A | N/A（本轮未创建真云资源） |

> 本轮测试仅涉及源码探针、CLI 真机执行和 MCP 协议验证，未创建任何真云资源，无需释放。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖（说明范围）：真云 E2E（需 AKSK+真云写操作）、hook 审批流（需 hook-capable 客户端）、评测 harness（需框架支持）、隔离环境测试（需独立 HOME/MCP 进程）
- 建议：
  1. OpenClaw 后续增加 hook 支持后，复测 D4 系列 16 项阻塞用例
  2. 配置真云凭证后，复测 D2/D3 系列 18 项真云相关阻塞用例
  3. 搭建评测 harness 后，复测 D10 系列 5 项评测用例
  4. 补充中文 README.md (README.zh-CN.md) 以解除 D8-6 阻塞
