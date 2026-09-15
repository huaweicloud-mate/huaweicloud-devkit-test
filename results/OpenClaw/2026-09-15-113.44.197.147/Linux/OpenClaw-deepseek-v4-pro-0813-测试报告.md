# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 09:36（北京时间）
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
| hcloud / 依赖 | KooCLI 7.2.12（`~/.config/huaweicloud/credentials.json` 已配置，cn-north-4，AK/SK） |
| 真云凭证 | `cn-north-4`（AK/SK，仅只读验证；本轮未创建/销毁真云资源） |
| 测试类型 | 源码级探针 / 真机 CLI（readonly）/ MCP 协议 / 安全规则引擎 |
| 设计真源 | 设计级 81 / 展开级 39（本日 init_day 按 OpenClaw/Linux 预筛） |
| daily 基础用例 | 设计级 81 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与 `tools.mjs` `callTool()`，决策/结果落 `*.stdout.log`；证据统一落 `evidence/<case-id>/`。本报告为 **1.1.4 stable 正式版本轮执行**（昨日为 next.3/next.6 预发布轮）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 120（设计级 81 + 展开级 39） |
| 已执行（PASS+FAIL） | 59（设计级 57 + 展开级 2） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 52 / 7 / 61 / 0 / 0 |
| 通过率（分母 = PASS+FAIL） | 88.1% |
| P0 / P1 / P2 新增缺陷 | 4 / 3 / 0（均为已提单缺陷去重跟踪，无新增拆单） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮无真云资源创建） |

> BLOCKED 61 条目均为**环境阻塞**（无真机 install/PTY 生命周期、无真云、无 Windows/macOS、无多客户端、无评测 harness），每条已回填 `blockedReason`。可机械验证的用例（源码探针/CLI read-only/MCP 协议）已全部实测。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 50 | 有证据且通过 PASS 门禁 |
| FAIL | 7 | 不符预期，根因见缺陷清单 |
| BLOCKED | 24 | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | P0 无 NOT_RUN；环境不满足均按 BLOCKED 处理 |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 2 | 本客户端可机械验证（EXP-D5-9-1/9-3 OpenClaw 客户端枚举） |
| FAIL | 0 | — |
| BLOCKED | 37 | 环境阻塞（真云 22 服务矩阵 / D10 评测集） |
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

## 五、阻塞项

| 类别 | 用例 ID | 阻塞原因 | 解除条件 |
|---|---|---|---|
| 真机 install 生命周期 | D1-1~D1-6, D1-41, D1-42, D1-45 | 需真机 OpenClaw install/doctor/update/uninstall + PTY 交互 + 隔离 HOME | 提供真机客户端终端/PTY 环境后复测 |
| 真云资源 | D3-C4, D2-1, D4-13, D4-14, EXP-C4-* | 需华为云最小权限 AK/SK（建删资源红线） | 真云权限到位后按红线复测 |
| 多客户端/评测 | D9-6, D1-2, D10-*, EXP-E* | 需多客户端同机 + D10 评测 harness | 提供多客户端/评测环境后复测 |
| 协议生命周期/超时 | D9-4, D9-7, D9-9 | 需长连接断连/重连/多版本/延迟注入夹具 | 提供夹具后复测 |

> 全部 BLOCKED 用例均已回填 `blockedReason`，无「无原因 BLOCKED」。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针仅源码级断言，真云只读验证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/沙箱/OBS 等） | 否 | — | 本轮未创建任何真云资源，无需释放 |

---

## 八、遗留与建议

- **缺陷去重结论**：本轮 7 处 FAIL（4 P0 + 3 P1）与已开出的 open issue（#651/#652/#673/#674/#676/#679/#681/#682）逐条对应，均属**已提单**缺陷（同一 SUT 缺陷族，v1.1.4 正式版未修复），故依据「勿重复拆单」红线不重复提 New issue。
- **范围外（BLOCKED）说明**：真机 install/uninstall 生命周期、真云资源 E2E、多客户端互通、D10 评测集、Windows/macOS 变体、协议超时/协商降级，需对应环境。
- **建议**：① `safety-policy.mjs:336` env-dump 正则补 `HW_` 前缀与 `echo $VAR` 路径；② `cloud-risk-rules.json` broad IAM 规则补 HCL `actions = ["*"]`；③ `mcp-server.mjs` 区分 `-32601/-32602/-32603`；④ `package.json` `files` 补 `rules` 并在 `setup-cli` 注入全局规则；⑤ `redactString` 补空格形式 `--adminPass xxx` 脱敏。