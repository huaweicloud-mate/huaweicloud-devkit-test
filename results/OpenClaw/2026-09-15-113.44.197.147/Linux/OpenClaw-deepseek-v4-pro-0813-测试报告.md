# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 13:32（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-15-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 7 处缺陷，其中 4 处 P0，均与既有 open issue 去重跟踪，无新增拆单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（`ecs-hd-ai-work-00-0003`，`6.8.0-106-generic`，Ubuntu 24.04.4） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（npm latest 正式版，gitHead `9b67256`，PR #669 release-1.1.4） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，含 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | KooCLI 7.2.12（`~/.config/huaweicloud/credentials.json` 已配置，cn-north-4） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置；本轮仅只读规划验证，未创建/销毁真云资源） |
| 测试类型 | 源码级探针 / 真机 CLI（readonly）/ MCP 协议 / 安全规则引擎 / 22 服务只读规划冒烟 |
| 设计真源 | 设计级 81 / 展开级 39（本日 init_day 按 OpenClaw/Linux 预筛） |
| daily 基础用例 | 设计级 81 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与 `tools.mjs` `callTool()`，决策/结果落 `*.stdout.log`；证据统一落 `evidence/<case-id>/`。本报告为 **1.1.4 stable 正式版本轮执行**（昨日本机为 next.3/next.6 预发布轮）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 120（设计级 81 + 展开级 39） |
| 已执行（PASS+FAIL） | 75（设计级 57 + 展开级 18） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 68 / 7 / 45 / 0 / 0 |
| 通过率（分母 = PASS+FAIL） | 90.7% |
| P0 / P1 / P2 新增缺陷 | 4 / 3 / 0（均为已提单缺陷去重跟踪，无新增拆单） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮无真云资源创建） |

> BLOCKED 45 条目均为**环境/凭证阻塞或改用例**（真机 install/PTY 生命周期、真云高危创建、评测 harness、KooCLI 伞名），每条已回填 `blockedReason` 并分类。可机械验证的用例（源码探针 / CLI read-only / MCP 协议 / 22 服务只读规划）已全部实测。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 50 | 有证据且通过 PASS 门禁 |
| FAIL | 7 | 不符预期，根因见缺陷清单 |
| BLOCKED | 24 | 环境/凭证阻塞，见 §五 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | P0 无 NOT_RUN；环境不满足均按 BLOCKED 处理 |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 18 | 客户端枚举 + 22 服务只读规划冒烟（16 服务 PASS + 2 客户端枚举 PASS） |
| FAIL | 0 | — |
| BLOCKED | 21 | 真云高危创建(4) + KooCLI 伞名改用例(2) + 评测集补环境(15) |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整（`HW_` 前缀未覆盖） | `printenv HW_ACCESS_KEY` 应 `deny` | 返回 `allow` | `safety-policy.mjs:336` | P | 已提单 #651/#652/#673/#674/#676/#679/#681 |
| 2 | P0 | D4-16 | 命令包裹穿透（`sh -c` 内层 env dump 未二次检测） | `sh -c "env \| grep HUAWEICLOUD"` 应 `deny` | 返回 `allow` | `safety-policy.mjs:335` | P | 已提单 #651/#652/#674/#676/#681/#682 |
| 3 | P0 | D4-21 | hook_check_artifacts 未检出 broad IAM（HCL `actions = ["*"]`） | HCL broad IAM 制品应 `deny` | `findings=[]`/`allow` | `cloud-risk-rules.json:188-196` | P | 已提单 #651/#652 |
| 4 | P0 | D4-23 | 全局规则 huawei-agent-rules 未注入（孤儿文件） | `files` 白名单应含 `rules` 且安装目标注入 | 白名单缺 `rules`，0 处引用注入 | `package.json:8-18` + `setup-cli.mjs` | P | 已提单 #651/#673/#674/#676/#679 |
| 5 | P1 | D4-6 | adminPass 空格形式回显未脱敏 | `--adminPass Secret123` 不应含明文 | args 含明文 `Secret123` | `safety-policy.mjs:42` | P | 已提单 #651/#673/#679 |
| 6 | P1 | D4-7 | hook_check_artifacts broad IAM 失效（与 #3 同根因） | HCL broad IAM 应 `deny` | `allow` | `cloud-risk-rules.json:188-196` | P | 已提单 #651/#652 |
| 7 | P1 | D9-2 | JSON-RPC 未知方法错误码未区分（-32601 缺失） | 未知方法应 `-32601` | 统一 `-32603` | `mcp-server.mjs:169` + `mcp-protocol.mjs:95` | P | 已提单 #651/#652/#674/#676 |

### 根因详情（P0/P1 缺陷代码片段 + 复现证据）

**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`printenv HW_ACCESS_KEY` → `deny`
- 实际：`allow`（`HW_` 前缀漏防；`HUAWEICLOUD_ACCESS_KEY_ID` 前缀可正常拦截）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:334-337`

```javascript
if (
  /(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i.test(text) &&
  /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)   // ← 缺 HW_ 前缀
) { ... deny ... }
```

- 证据：`evidence/d4-security-core/probe-p0-security.mjs.stdout.log`（`FAIL printenv HW_ACCESS_KEY => allow`）

**#2 [P0] D4-16 命令包裹穿透**

- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335` env-dump 正则 `(^|\s)` 不命中 `sh -c "..."` 引号内的 `env`，且未抽取内层命令二次检测。
- 证据：`evidence/d4-security-core/probe-p0-security.mjs.stdout.log`（`FAIL sh -c "env | grep HUAWEICLOUD" => allow`）

**#3 [P0] D4-21 hook_check_artifacts broad IAM 漏检**

- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:188-196` `hwc-iam-admin-policy` 的 Action 正则仅匹配 JSON `"Action":"*"` / `Action=*`，不匹配 Terraform HCL `actions = ["*"]` 块语法。
- 证据：`evidence/d4-security-core/probe-p0-security.mjs.stdout.log`（`FAIL broad IAM policy (actions=["*"]) 检出 => false`）、`probe-d4-7-hooks.mjs.stdout.log`（`FAIL hook_check_artifacts broad IAM 拦截 => allow`）

**#4 [P0] D4-23 全局规则注入失效**

- 根因：`package.json:8-18` `files` 白名单缺 `rules`；`setup-cli.mjs` 0 处引用 `rules/`/`.mdc`/`agent-rules`。
- 证据：`evidence/d4-security-core/probe-d4-23-rules.mjs.stdout.log`（3 FAIL：files 白名单 / setup-cli 引用 / 安装目标注入）

**#5 [P1] D4-6 adminPass 空格形式回显未脱敏**

- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString()` 正则 `((?:...|adminPass)...)\s*[:=]\s*(...)` 只覆盖 `=`/`:` 分隔，KooCLI 空格形式 `--adminPass xxx` 不命中。
- 证据：`evidence/d4-security-core/probe-d4-6-adminpass.mjs.stdout.log`（`FAIL 空格形式 adminPass 值脱敏 => true`）

**#7 [P1] D9-2 JSON-RPC 错误码未区分**

- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs:169` catch 统一硬编码 `code: -32603`；`mcp-protocol.mjs:95` 对 unknown method 直接 `throw`，未映射 `-32601`。
- 证据：`evidence/d9-protocol/probe-d9-mcp-protocol.mjs.stdout.log`（`FAIL 服务端区分 -32601 => false`）

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 逐条列出本轮 **BLOCKED** 用例（展开级「不涉及本客户端/OS」的建包时已剔除，不在此列）。
> 原因详细到可判断「是否需修改用例」，并按分类标注：

| 分类 | 含义 | 维护 agent 动作 |
|---|---|---|
| `改用例` | 用例自身设计不合理：前置/步骤/预期不可判定、粒度错误、需真云/真机/时长计费资源但未标注、代理/OS 归属写错 | 修改 `test-cases/` 母版对应用例 |
| `补环境` | 环境 / 凭证 / 配额 / 依赖缺失 | 补环境后复测，无需改用例 |
| `调归属` | 该用例本不应由本客户端/OS 执行 | 调整 `agent`/`OS`/`终端覆盖类型` 列 |

### 设计级（24）

| 用例ID | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|
| `D1-1` | P1 | BLOCKED | 补环境 | 需真机 OpenClaw install --target 生命周期 + 隔离 HOME 验证，本 run 源码探针环境无真机安装态 | — |
| `D1-2` | P2 | BLOCKED | 补环境 | 需多客户端共存环境验证 auto-detect，本机仅 OpenClaw 单客户端 | — |
| `D1-3` | P1 | BLOCKED | 补环境 | 需真机 doctor CLI + 人为制造组件缺失场景验证 | — |
| `D1-4` | P2 | BLOCKED | 补环境 | 需真机 status/update CLI + 用户自定义 config 保护验证 | — |
| `D1-5` | P1 | BLOCKED | 补环境 | 需真机 uninstall + 残留扫描，本机无真机安装态 | — |
| `D1-6` | P2 | BLOCKED | 补环境 | 需无 KooCLI 环境重装引导验证；本机 KooCLI 已装(hcloud 7.2.12) | — |
| `D1-41` | P1 | BLOCKED | 补环境 | 需隔离 MCP 进程 + 可控 registry 四态响应注入 | — |
| `D1-42` | P1 | BLOCKED | 补环境 | 需隔离 HOME + CROSS_PROCESS 跨进程重启复查 | — |
| `D1-45` | P1 | BLOCKED | 补环境 | 需隔离 MCP 进程 + 预热竞态双时序注入 | — |
| `D2-1` | P1 | BLOCKED | 补环境 | auth init 三端同步需真云 AK/SK + KooCLI/OBS/沙箱三端真实落位 | — |
| `D3-C4` | P1 | BLOCKED | 补环境 | 22 服务只读规划已实测通过；高危服务(ECS/RDS/CCE/WAF)轻量创建→立即释放→归零需真云最小权限 + 账单/配额风险评估 | 前置「真云+最小权限AK/SK」已标注，非改用例 |
| `D4-10` | P2 | BLOCKED | 补环境 | 需规则库版本快照 + 新增规则项注入夹具 | — |
| `D4-12` | P2 | BLOCKED | 补环境 | 需 npm 安装供应链攻击仿真夹具（恶意依赖注入） | — |
| `D4-13` | P1 | BLOCKED | 补环境 | 需真云最小权限凭证 + 逐服务权限校验 | — |
| `D4-14` | P2 | BLOCKED | 补环境 | 需真云 CTS 审计日志验证 | — |
| `D4-24` | P1 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界需真云确认流 + 可注入时钟 | — |
| `D9-4` | P1 | BLOCKED | 补环境 | 协议生命周期需长连接断连/重连/关闭时序夹具 | — |
| `D9-6` | P1 | BLOCKED | 补环境 | 跨客户端互通需多客户端同机环境，本机仅 OpenClaw 单客户端 | — |
| `D9-7` | P2 | BLOCKED | 补环境 | 协议版本协商降级需多版本服务端/客户端夹具 | — |
| `D9-9` | P1 | BLOCKED | 补环境 | tools/call 超时协议需可注入延迟夹具 + capabilities.cancellation | — |
| `D10-1` | P1 | BLOCKED | 补环境 | 工具描述可选择性需真机评测集 + LLM 选择行为采样 | — |
| `D10-2` | P1 | BLOCKED | 补环境 | skill 激活率需真机评测集 + LLM 激活采样 | — |
| `D10-3` | P1 | BLOCKED | 补环境 | 路由准确率+混淆矩阵需真机 15 条意图评测集 + 真机 agent 执行 | — |
| `D10-5` | P1 | BLOCKED | 补环境 | 多轮任务完成率需真机多轮任务评测集 | — |

### 展开级（21）

| 用例ID | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|
| `EXP-C4-01` | P1 | BLOCKED | 补环境 | ECS 只读规划(list_operations+plan)已 PASS；轻量创建→立即释放→归零需真云最小权限 + 账单/配额风险评估 | 前置「真云+最小权限AK/SK」已标注，非改用例 |
| `EXP-C4-04` | P1 | BLOCKED | 补环境 | RDS 只读规划已 PASS；轻量创建→归零需真云最小权限 | 同上 |
| `EXP-C4-06` | P1 | BLOCKED | 补环境 | CCE 只读规划已 PASS；轻量创建→归零需真云最小权限 | 同上 |
| `EXP-C4-14` | P1 | BLOCKED | 改用例 | 母版枚举对象用伞名 `DMS`，KooCLI 顶级无此服务(`Unsupported service`)；子服务名 Kafka/RocketMQ/RabbitMQ 均可路由 | 母版 `枚举对象` 列 `DMS` → 改为 `Kafka/RocketMQ/RabbitMQ`（或 3 条子服务展开） |
| `EXP-C4-15` | P1 | BLOCKED | 补环境 | WAF 只读规划已 PASS；轻量创建→归零需真云最小权限 | 前置「真云」已标注，非改用例 |
| `EXP-C4-18` | P1 | BLOCKED | 改用例 | 母版枚举对象用伞名 `DEW`，KooCLI 顶级无此服务(`Unsupported service`)；子服务名 KMS/CSMS 均可路由 | 母版 `枚举对象` 列 `DEW` → 改为 `KMS/CSMS`（或 2 条子服务展开） |
| `EXP-E01`~`EXP-E15` | P1 | BLOCKED | 补环境 | D10-3 中文意图路由评测集，oracle 需真机 agent 多轮执行（混淆矩阵）+ 评测 harness | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针仅源码级断言，22 服务只读规划不触真云 API）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/沙箱/OBS 等） | 否 | — | 本轮未创建任何真云资源，无需释放 |

---

## 八、遗留与建议

- **缺陷去重结论**：本轮 7 处 FAIL（4 P0 + 3 P1）与已开出的 open issue（#651/#652/#673/#674/#676/#679/#681/#682）逐条对应，均属**已提单**缺陷（同一 SUT 缺陷族，v1.1.4 正式版未修复），故依据「勿重复拆单」红线不重复提单。
- **本轮较 09:35 初版的改进**：展开级 22 服务只读规划冒烟（`list_operations` + `plan_cli_command`）由全部 BLOCKED 改为实测——16 服务 PASS（只读路由+归类 read_only 证据落盘），2 服务（DMS/DEW）发现母版「伞名」改用例问题，4 服务（ECS/RDS/CCE/WAF）只读规划已 PASS、真云高危创建项按补环境 BLOCKED。展开级 PASS 由 2 提升到 18。
- **范围外（BLOCKED）说明**：真机 install/uninstall 生命周期、真云高危资源 E2E、多客户端互通、D10 评测集、Windows/macOS 变体、协议超时/协商降级，需对应环境。
- **建议**：① `safety-policy.mjs:336` env-dump 正则补 `HW_` 前缀与 `echo $VAR` 路径；② `cloud-risk-rules.json` broad IAM 规则补 HCL `actions = ["*"]`；③ `mcp-server.mjs` 区分 `-32601/-32602/-32603`；④ `package.json` `files` 补 `rules` 并在 `setup-cli` 注入全局规则；⑤ `redactString` 补空格形式 `--adminPass xxx` 脱敏；⑥ 母版 `EXP-C4-[14|18]` 枚举对象由伞名 `DMS`/`DEW` 改为可路由子服务名。