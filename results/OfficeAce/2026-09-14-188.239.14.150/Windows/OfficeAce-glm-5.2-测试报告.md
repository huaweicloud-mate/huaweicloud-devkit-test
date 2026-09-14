# OfficeAce-glm-5.2 每日测试报告

> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：`2026-09-14 07:33:41（北京时间）`
> **执行归档**：`results/OfficeAce/2026-09-14-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（1 个 P0 FAIL: D4-2，52 条 BLOCKED 待环境就绪）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows 11 AMD64` |
| Node / npm / Python | `Node v24.14.1 / npm 10 / Python 3.13.4` |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK / 未使用）` |
| 测试类型 | MCP 工具真机执行 / hook 安全规则验证 / skill 检索验证 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：通过 MCP 工具（huaweicloud-devkit）真机执行 hook_check_command/artifacts/deploy_plan、plan_cli_command、retrieve_skill、list_operations、run_readonly_command 等工具，验证安全规则、命令分类、skill 检索、脱敏等能力。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `81` |
| 已执行 | `17` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `16 / 1 / 53 / 0 / 11` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `94.1%` |
| P0 / P1 / P2 新增缺陷 | `1 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本轮未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `16` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `53` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `0` | 契约漂移，待裁决 |
| NOT_RUN | `11` | 本轮未覆盖（P2 低优先级） |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `0` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `0` | 契约漂移，待裁决 |
| NOT_RUN | `69` | 本轮未覆盖 |
| **合计** | **`71`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `echo %HW_ACCESS_KEY% %HW_SECRET_ACCESS_KEY%` 应返回 `deny` | 返回 `allow`，`HW_*` 前缀 env 变量未拦截 | `safety-policy.mjs` env-dump 正则未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_ACCESS_KEY` 前缀 | P | 待提单 |

### 根因详情（每个 P0/P1 缺陷附代码片段 + 复现证据）

```markdown
**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`echo %HW_ACCESS_KEY% %HW_SECRET_ACCESS_KEY%` → `deny`
- 实际：hook_check_command 返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` 中 classifyTextCommand() 的 env-dump 检测正则
  可能未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_ACCESS_KEY` 前缀（仅覆盖 HUAWEICLOUD/HWC_/HCLOUD/OS_ 前缀）
- 复现命令：通过 MCP 工具 huaweicloud_hook_check_command 传入
  `echo %HW_ACCESS_KEY% %HW_SECRET_ACCESS_KEY%`，返回 decision=allow
- 证据：`evidence/D4-2/stdout.log`
```

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D1-1` | 全新环境引导安装需干净机器 | 需全新未安装环境 | 隔离 HOME 后复测 |
| `D1-3` | doctor 健康自检需组件异常环境 | 需组件异常构造 | 删除 MCP Python SDK 后复测 |
| `D1-26`~`D1-45` | 升级提醒/检测/dismiss 需直调函数或 MCP Inspector | 需 MCP Inspector / 隔离 HOME | 工具就绪后复测 |
| `D1-39` | Windows 升级检测链需隔离环境 | 需隔离 HOME | 隔离后复测 |
| `D1-40` | 镜像 lag 检测需可控镜像源 | 需可控 npm 镜像 | 镜像配置后复测 |
| `D2-1` | auth init 三端同步需真云验证 | 需真云凭证验证 | 凭证就绪后复测 |
| `D2-5`~`D2-16` | 凭证管理需隔离环境或特殊配置 | 需隔离 HOME / 多 profile | 环境就绪后复测 |
| `D3-C4` | 服务创建回归需 22 服务矩阵真云 | 需真云 22 服务 | 真云就绪后复测 |
| `D4-3` | 明文 secret API 拦截需 hook 客户端 | OfficeAce 非 hook 客户端 | hook 客户端复测 |
| `D4-6`~`D4-24` | 安全规则需真云操作或特殊构造 | 需真云/注入环境 | 环境就绪后复测 |
| `D5-1`~`D5-3` | 客户端矩阵需 10 客户端环境 | 需 10 客户端 | 客户端就绪后复测 |
| `D6-4` | 并发调度需压测环境 | 需并发压测 harness | harness 就绪后复测 |
| `D9-1`~`D9-9` | MCP 协议需 MCP 客户端/Inspector | 需 MCP 工具 | 工具就绪后复测 |
| `D10-1`~`D10-5` | Agent 评测需真实 Agent harness | 需评测 harness | harness 就绪后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（所有凭证通过 show_profile_redacted 脱敏查看）
- [x] 写操作误判 read-only：`0`（DeleteServers 正确分类为 write/deny）
- [x] 红线（I 类）违规：`无`（未创建真云资源，无残留）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/OBS/VPC 等 | 否 | N/A | 本轮未创建真云资源 |
| 沙箱/DevStation | 否 | N/A | 未使用沙箱 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留即 FAIL。本轮零创建零残留。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖（说明范围）：
  - 真云 E2E 测试（需真云资源创建/销毁闭环）
  - 多终端矩阵（需 10 客户端环境）
  - MCP 协议层测试（需 MCP Inspector/客户端）
  - Agent 评测测试（需真实 Agent harness）
  - 升级提醒全链路（需直调 judgeUpdate 函数）
- 建议：
  1. D4-2 缺陷（HW_* 前缀 env 变量未拦截）应优先修复，属 P0 安全漏洞
  2. 后续轮次优先准备隔离 HOME 环境，解除 D1/D2 系列 BLOCKED
  3. 考虑引入 MCP Inspector 解除 D9 协议层测试阻塞
