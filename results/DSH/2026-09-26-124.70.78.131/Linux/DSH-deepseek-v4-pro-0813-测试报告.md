# DSH-deepseek-v4-pro-0813 每日测试报告

> **生成时间**：`2026-09-26 05:25:00`（北京时间）
> **执行归档**：`results/DSH/2026-09-26-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 6 个 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0011） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.7`（npm latest，hdk HEAD `7456d05`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 已确认 |
| 真云凭证 | cn-north-4（AKSK 管理员 + test001 只读子账号） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 102 / 展开级 39（init_day 预筛后） |

> **执行方法**：探针脚本（.mjs/.py）直调 `huaweicloud-devkit` 插件源码导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；MCP 协议走 `eval/harness/protocol-probe.mjs` + `run-eval.mjs`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `108 / 30 / 1 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `77.7%`（108/139） |
| P0 / P1 / P2 缺陷（合并后） | `6 / 7 / 6`（P1 含 D10-3 覆盖 12 条展开级路由 MISS） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/SG/OBS 无 `tctest-dsh-` 残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `81` | 有证据且通过 PASS 门禁 |
| FAIL | `18` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | D3-S3 沙箱 DevStation 配给超时（补环境） |
| SPEC-MISMATCH | `1` | D9-9 契约漂移（缺 notifications.cancellation） |
| NOT_RUN | `1` | D1-39 Windows 专属用例（Linux 由 NR3 + D1-40 代表覆盖） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | EXP-E01~E15 中 12 条路由 MISS（源 D10-3） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽）

> 完整 19 项缺陷（含根因文件:行号）见 `FINDINGS.md`。摘要如下：

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D9-12 | initialize 未强制时序（非法 tools/list 未 -32600） | mcp-protocol.mjs:30 / mcp-server.mjs:166 |
| 2 | P1 | D4-13 | 只读子账号 env 动态切换失效 | credentials.mjs:245 (R9) |
| 3 | P1 | D10-3 | serviceCatalog 中文意图路由命中率仅 21.4%（12 EXP-E MISS） | tools.mjs:1947 |
| 4 | P0 | D2-4 | 凭证脱敏漏小写 ak=/sk= | safety-policy.mjs:31/45-49 |
| 5 | P0 | D4-3 | kms DecryptData 未列入明文 secret 拦截 | safety-policy.mjs:232 |
| 6 | P0 | D4-15 | 命令替换 $(...) 未拦截 | safety-policy.mjs classifyTextCommand |
| 7 | P0 | D4-16 | bash -c 包裹穿透（未识别 hcloud） | safety-policy.mjs:67-90/443 |
| 8 | P0 | D4-23 | 发布包 files 未含 rules | package.json:8 |
| 9 | P1 | D4-17 | hook 模糊输入未 fail-closed | risk-rule-engine.mjs:150 |
| 10 | P1 | D4-24 | 审批令牌重复/过期未结构化返回 | hcloud-cli.mjs:85-92 |
| 11 | P1 | D3-S7 | 跨服务复合意图未命中 RDS+部署 | tools.mjs:1947 |
| 12 | P1 | D9-9 | tools/call 未声明取消/超时语义（SPEC-MISMATCH） | mcp-protocol.mjs:47 |
| 13 | P2 | D1-65 | 调试开关仅接受 'true' | telemetry/telemetry.mjs:81 |
| 14 | P2 | D3-S5 | 复合意图分层路由未命中 | tools.mjs:1947 |
| 15 | P2 | D3-S6 | FunctionGraph 定时任务路由未命中 | tools.mjs:1947 |
| 16 | P2 | D4-25 | Python hook 写命令分类 cli:invoke | huaweicloud-safety.py:44-46 |
| 17 | P2 | D8-1 | 文档工具数 39 vs 实现 40 | AGENTS.md:27 |
| 18 | P2 | D8-9 | sanitizeValue 未移除小写 ak=/sk= | telemetry/telemetry.mjs:189 |
| 19 | P1 | D9-2 | tools/list 非法 params 未返回 -32602 | mcp-protocol.mjs:57-58 |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注「Windows 专属」，本机 Linux；Linux 侧由展开级 EXP-NR3 终端矩阵 + D1-40 代表覆盖 | 设计级可在 init_day 建包阶段对 OS 专属用例同样预筛 |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | `huaweicloud_sandbox_check_user` 可达且 agreementSigned=true，但 `sandbox_connect` 建立 DevStation workspace 超时（>60s 无配额/配给未完成），无法 upload→deploy→URL→close_session | 补沙箱 DevStation 配额后复测 |

> D9-6（跨客户端互通）原由单客户端探针标 BLOCKED，经 `eval/harness/protocol-probe.mjs` 10 客户端 clientInfo 矩阵复测 10/10 通过，已改判 PASS（协议不依赖特定客户端）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D9-13 tools/call 返回无 AK/SK/token 明文复测通过）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（tctest-dsh-c4/s2/c14/c18/c20） | 是 | 已删 | 归零（ListVpcs 无 tctest-dsh 残留） |
| 安全组（tctest-dsh-sg） | 是 | 已删 | 归零 |
| OBS 桶（tctest-dsh-web） | 是 | 已删 | 归零 |
| 只读子账号写测试 | 是 | 无副作用 | VPC.0010 写拒验证通过 |

> 真云只删本次创建资源；删除前已按 `tctest-dsh-` 前缀白名单盘点，未触碰既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities 未声明 notifications.cancellation，MCP 取消/超时语义缺失）
- 本轮未覆盖（说明范围）：真实 LLM Agent 会话行为评测（D10-1/2/5/9 执行器）不在每日精选范围；D1-39 Windows 升级检测链由 Windows 客户端（如 OpenCode/WorkBuddy）覆盖。
- 建议：serviceCatalog 中文意图路由层（tools.mjs:1947 兜底）是当前最高价值修复项——15 条意图仅 3 条命中，需补齐中文意图→服务映射字典。