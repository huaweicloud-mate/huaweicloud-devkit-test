# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 18:16（北京时间）
> **执行归档**：`results/DSH/2026-09-15-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（6 P0 + 3 P1 + 1 P2 缺陷，全部为 v1.1.4 stable 复现/确认，已去重关联 #683）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux x86_64（机器 IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 11 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（npm latest，gitHead `9b67256e`，PR #669 合入） |
| 工具全集 | 39 注册（实际 `TOOL_DEFINITIONS.length` = 40） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认 hcloud credentials configured） |
| 真云凭证 | cn-north-4（管理员 AKSK；无只读子账号 → D4-13 BLOCKED） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 性能 / 路由 |
| 设计真源 | 设计级 77 / 展开级 17（daily 精选，按 agent+OS 预筛）/ 追踪表 183 行 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 77 + 展开级 17 = 94 |
| 已执行 | 94（PASS/FAIL/BLOCKED 全覆盖，0 NOT_RUN / 0 空） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 50 / 22 / 22 / 0 / 0 |
| 通过率（分母 = PASS+FAIL，不含 BLOCKED） | 69.4%（50/72） |
| P0 / P1 / P2 缺陷（去重后） | 6 / 3 / 1 |
| 红线（I 类）违规 | 0（凭证泄漏 0；真云未创建资源） |
| 资源释放 | 全部归零（探针全部 hermetic，无云资源创建） |

## 三、状态汇总

### 3.1 设计级（77）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 45 | 有证据且通过 PASS 门禁 |
| FAIL | 10 | 不符预期，根因见缺陷清单 |
| BLOCKED | 22 | 环境/权限/交互阻塞，见阻塞项 |
| SPEC-MISMATCH | 0 | - |
| NOT_RUN | 0 | - |
| **合计** | **77** | |

### 3.2 展开级（17）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 5 | EXP-D5-6-1/EXP-D5-6-3/EXP-E06/EXP-E09/EXP-E15 |
| FAIL | 12 | EXP-E01~E14 中文意图路由 miss（同 D10-3 根因） |
| BLOCKED | 0 | - |
| SPEC-MISMATCH | 0 | - |
| NOT_RUN | 0 | - |
| **合计** | **17** | |

## 四、缺陷清单（详尽，每个缺陷一栏）

> 全部真实执行后填写，字段完整到可让修复方直接定位。完整格式化版见同目录 `FINDINGS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏漏小写 ak=/sk= | 小写 `ak=`/`sk=` 值 → `<redacted>` | 原文未脱敏 | `safety-policy.mjs:45` |
| 2 | P0 | D4-2 | 凭证 env 打印拦截缺 HW_ 前缀 | `printenv HW_ACCESS_KEY` → deny | allow | `safety-policy.mjs:336` |
| 3 | P0 | D4-3 | 明文 secret API 漏 kms DecryptData | `hcloud kms DecryptData` → deny | allow/unknown_read | `safety-policy.mjs:349` |
| 4 | P0 | D4-15 | hook 命令替换绕过($()+ANSI-C) | 应 deny | allow | `risk-rule-engine.mjs:50-53` |
| 5 | P0 | D4-16 | shell 包裹穿透写操作拦截 | 内层 hcloud 写 → deny | allow | `safety-policy.mjs:345` |
| 6 | P0 | D4-23 | 全局规则未随安装注入 | install 后含 agent-rules | found=0 | `package.json:8` |
| 7 | P1 | D4-17 | hook 畸形输入 fail-open | 畸形输入 → deny(fail-closed) | allow | `risk-rule-engine.mjs:106` |
| 8 | P1 | D9-2 | JSON-RPC 错误码缺 -32601 | unknown method → -32601 | undefined | `mcp-protocol.mjs:95` |
| 9 | P1 | D10-3 | 中文意图路由大量 miss | 中文意图命中对应服务 | 3/15，多数返回 help | `tools.mjs:1776-1907` |
| 10 | P2 | D8-1 | 文档与能力漂移(39 vs 40) | 文档工具数=实现（40） | AGENTS.md 写 39 | `AGENTS.md:27,45` |

> 上述 10 项与本客户端今日早先执行（#683）为同一 SUT（1.1.4 stable）同根因复现，按「不重复提单」纪律去重关联，不新开单。

## 五、阻塞项（22 项设计级 BLOCKED）

| 用例 ID | 阻塞原因 |
|---|---|
| D1-5 | 真实卸载残留扫描需破坏共享环境 |
| D1-39 | Windows EINVAL 检测链专属（本机 Linux） |
| D1-41 / D1-42 / D1-45 | 需隔离 MCP 进程 + 可控 registry 时序夹具 |
| D2-2 | 三端 8 组合环境无法 hermetic 构造（hcloud 已装） |
| D4-8 | Python hook 为 Windows PowerShell 路径 |
| D4-10 / D4-11 / D4-12 | 规则库变更 / 注入观察 / SBOM 工具链 |
| D4-13 | 缺只读 IAM 子账号凭证 |
| D4-14 / D4-18 / D4-19 / D4-20 / D4-24 | 需真云写操作 + 交互确认流 / CTS / 注入时钟 |
| D9-5 / D9-9 | 需 stdio 负载/延迟注入夹具 |
| D9-6 | 需 ≥3 真实客户端 |
| D7-4 | 需国内镜像源网络 |
| D8-4 | 需逐 SKILL 人工评审 |
| D10-4 | 需真实 Agent 第三方观察审批流 |

（完整逐一 blockedReason 已回填至设计级 CSV `blockedReason` 列，见 `verify_coverage` 输出 BLOCKED=22 无原因 0。）

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 写命令均判 deny）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录仅含探针脚本 + stdout.log，无原始真实凭证/未脱敏日志（探针全部用假凭证 `AKxxx...`/`SKxxx...`）
- [x] 真云资源：本轮 0 创建 0 残留（全部函数级/CLI 只读探针）

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / OBS / 沙箱等 | 否 | - | 无资源创建，残留 0 |

> 探针全部 hermetic（隔离 HOME + 假凭证），未触发任何真云写操作。

## 八、遗留与建议

- 待裁决 SPEC：`无`（D9-7 协议版本协商实测正常协商，非 SPEC-MISMATCH）。
- 本轮未覆盖（说明范围）：真云 E2E（建删资源 / 审批确认流 / CTS 审计）、多终端矩阵（需 ≥3 客户端）、stdio 负载/延迟注入夹具——均按 BLOCKED 回填并写 blockedReason。
- 建议：10 项缺陷均为 stable v1.1.4 复现，与 #683 同根因，建议按 #683 内根因回归修复后复测。