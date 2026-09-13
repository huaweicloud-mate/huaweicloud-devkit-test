# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-09-14 07:35:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-14-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，dev 分支）
> **结论**：`PARTIAL`（有 FAIL 和 P0 缺口）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + glm-5.2 |
| OS / 架构 | Windows Server 2019 (x86_64) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.13.14 |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `3b6290bc`） |
| 工具全集 | 39（`tools.mjs` TOOL_DEFINITIONS 注册数组） |
| hcloud / 依赖 | hcloud 未独立安装（doctor 在 setup-cli.mjs 中） |
| 真云凭证 | cn-north-4（credentials.json 已配置，AKSK 模式） |
| 测试类型 | 源码级探针（.mjs 直调导出函数）+ 源码静态检查 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |
| gh 登录 | 已登录（shuangheaven，keyring，repo scope） |

> **执行方法**：探针脚本（.mjs）直调 `huaweicloud-devkit/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 81（设计级） |
| 已执行 | 54 |
| PASS / FAIL / BLOCKED / NOT_RUN | 47 / 8 / 2 / 24 |
| 通过率（分母 = PASS+FAIL） | 85.5% |
| P0 / P1 / P2 新增缺陷 | 4 / 3 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 47 | 有证据且通过 PASS 门禁 |
| FAIL | 8 | 不符预期，根因见缺陷清单 |
| BLOCKED | 2 | 环境阻塞（reg.exe 安全策略阻止 MCP server spawn） |
| SPEC-MISMATCH | 0 | 无新增契约漂移 |
| NOT_RUN | 24 | 本轮未覆盖（真云 E2E/多终端矩阵/D10 评测等） |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 41 | 源用例 PASS 的展开行 |
| FAIL | 6 | 源用例 FAIL 的展开行 |
| BLOCKED | 0 | 无 |
| NOT_RUN | 24 | 源用例 NOT_RUN 的展开行 |
| **合计** | **71** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `env \| grep HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow`，`HW_*` 前缀未拦截 | `safety-policy.mjs:335-343` 正则缺 `HW_` 前缀 | P | 待提单 |
| 2 | P0 | D4-9 | 破坏性命令未检测 | `evaluateCommandRisk('rm -rf /')` 应返回 `deny` 或有 findings | 返回 `deny` 但被探针判为未标记（findings 为空） | `risk-rule-engine.mjs:evaluateCommandRisk()` | P | 待提单 |
| 3 | P0 | D4-16 | 命令包裹穿透 - sh -c wrapper | `sh -c "env \| grep HUAWEICLOUD"` 应返回 `deny` | 返回 `allow`，内层 env dump 未被提取检测 | `safety-policy.mjs:classifyTextCommand()` | P | 待提单 |
| 4 | P0 | D4-21 | hook_check_artifacts 未检测 broad IAM 制品 | `evaluateArtifacts()` 对 `Action: ["*"]` 应返回 findings > 0 | 返回 0 findings | `risk-rule-engine.mjs:evaluateArtifacts()` | P | 待提单 |
| 5 | P0 | D4-23 | agent-rules.md 未注入 WorkBuddy 目录 | `huawei-agent-rules.md` 应存在于 WorkBuddy 安装目标 | 缺少复制逻辑 | `setup-cli.mjs` WorkBuddy 安装目标分支 | P | 待提单 |
| 6 | P1 | D5-1 | manifest.json 不存在 | 安装后 `manifest.json` 应存在 | 文件不存在 | `setup-cli.mjs` manifest 生成逻辑 | P | 待提单 |
| 7 | P1 | D8-7 | SKILL.md 7 个 meta/通用技能指引验证 | SKILL.md 应可被机器执行验证 | 探针检查标记 FAIL（需进一步核实） | `skills/` 目录结构 | I | 待核实 |
| 8 | P1 | D9-2 | JSON-RPC 错误码 -32603 而非 -32601 | 未知方法应返回 `-32601` (Method not found) | 硬编码 `-32603` (Internal Error) | `mcp-server.mjs:164-173` | P | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`env | grep HW_ACCESS_KEY` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335-343`
  `classifyTextCommand()` 的 env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀
- 证据：`evidence/d4-security-core/stdout.log`

**#2 [P0] D4-9 破坏性命令检测不完整**

- 期望：`evaluateCommandRisk('rm -rf / && hcloud ecs delete-servers')` 应有 findings 或 deny
- 实际：返回 `deny` 但 findings 为空（风险规则引擎未标记具体风险项）
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:evaluateCommandRisk()`
- 证据：`evidence/d4-security-core/stdout.log`

**#3 [P0] D4-16 命令包裹穿透**

- 期望：`sh -c "env | grep HUAWEICLOUD"` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:classifyTextCommand()` 只检查整行文本，不提取 wrapper 内层参数
- 证据：`evidence/d4-security-core/stdout.log`

**#4 [P0] D4-21 broad IAM 制品未拦截**

- 期望：`evaluateArtifacts()` 对含 `Action: ["*"]` 的 Terraform IAM role 制品应返回 findings > 0
- 实际：返回 0 findings
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:evaluateArtifacts()` 规则未覆盖 IaC 中的 broad IAM policy
- 证据：`evidence/d4-security-core/stdout.log`

**#5 [P0] D4-23 agent-rules.md 未注入 WorkBuddy**

- 期望：WorkBuddy 安装目标应包含 `huawei-agent-rules.md`
- 实际：缺少复制逻辑
- 根因：`plugins/huaweicloud-core/src/setup-cli.mjs` WorkBuddy 安装目标分支
- 证据：基于源码检查（`evidence/d2-d3-auth-func/stdout.log` 中 setup-cli.mjs 检查）

**#8 [P1] D9-2 JSON-RPC 错误码**

- 期望：未知方法应返回 `-32601` (Method not found)
- 实际：硬编码 `-32603` (Internal Error)
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs:164-173` 统一 catch 块
- 证据：`evidence/d9-robust/stdout.log`

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D9-8 | MCP server spawn 触发 reg.exe 安全策略 | WorkBuddy 沙箱禁止 reg.exe | 在安全中心移除 reg.exe 黑名单或使用非沙箱环境 |
| D9-9 | 同上 | 同上 | 同上 |
| D1-1 | 全新环境引导安装需重置环境 | 需独立 manifest + 环境重置 | 一次性环境 |
| D1-5 | uninstall 干净度需独立环境 | 需卸载后重装验证 | 一次性环境 |
| D1-58 | 通用 MCP 白名单需多客户端环境 | Claude/Cursor 环境依赖 | 多客户端环境 |
| D3-C1 | ECS 生命周期 E2E | 真云资源创建/删除 | 成本/时间约束 |
| D3-C3 | 沙箱部署 E2E | DevStation 沙箱环境 | 沙箱配额 |
| D10-1~5 | 评测集需 agent 真实交互 | 多轮任务执行环境 | agent 评测框架 |

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
| 无 | 否 | N/A | N/A |

> 本轮仅执行源码级探针和静态检查，未创建任何真云资源，无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：无新增
- 本轮未覆盖（说明范围）：真云 E2E（D3-C1/C3/C6/C8）、多终端矩阵（D5-1~10）、D10 评测集、D1-56/57 安装中断/回滚
- 建议：
  1. 修复 D4-2 HW_ 前缀正则覆盖（P0，与 09-12 一致，未修复）
  2. 修复 D4-16 wrapper 命令内层检测（P0，与 09-12 一致，未修复）
  3. 修复 D4-21 broad IAM 制品规则覆盖（P0，与 09-12 一致，未修复）
  4. 修复 D4-23 WorkBuddy agent-rules.md 注入（P0，与 09-12 一致，未修复）
  5. 修复 D9-2 JSON-RPC 错误码区分（P1，与 09-12 一致，未修复）
  6. 解除 reg.exe 安全策略限制以覆盖 D9-8/D9-9（环境层面）

---

## 九、PASS 门禁校验

`python scripts/verify_no_fake_pass.py WorkBuddy Windows 2026-09-14` → **通过**

所有标 PASS 的用例均满足：
1. 已实际执行（探针真实运行）
2. 有结果证据落到 `evidence/<case-id>/`（probe 脚本 + stdout.log）
3. `evidencePath` 列回填该证据路径且文件存在

---

## 证据清单

| 证据目录 | 探针脚本 | 覆盖用例 |
|---|---|---|
| `evidence/d4-security-core/` | `probe-p0-security.mjs` + `stdout.log` | D4-1/2/3/9/15/16/18/19/20/21/22 + D2-4 |
| `evidence/d1-upgrade/` | `probe-p0-upgrade.mjs` + `stdout.log` | D1-27/28/30/31/32/34/35/39/40 |
| `evidence/d2-d3-auth-func/` | `probe-d2-d3-auth-func.mjs` + `stdout.log` | D2-1/2/5/10/11/12/13/16 + D3-A1/B1/B3/B5/C4/C5 + D1-3/4/6 |
| `evidence/d5-static/` | `probe-d5-d9-static.mjs` + `stdout.log` | D5-1/3 + D6-1/3/4 + D7-4 + D8-1/4/6/7 + D9-1/3/4 |
| `evidence/d9-protocol/` | `probe-d9-mcp-protocol.mjs`（BLOCKED） | D9-3/4/8/9（BLOCKED） |
| `evidence/d9-robust/` | `probe-d9-robust-source.mjs` + `stdout.log` | D9-2/5/7 |
