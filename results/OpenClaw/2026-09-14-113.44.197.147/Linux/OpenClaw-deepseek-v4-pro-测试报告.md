# OpenClaw-deepseek-v4-pro 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-测试报告.md`
> **生成时间**：2026-09-14 07:12:00（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-14-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 6 处高危缺陷，其中 P0 未修复，不得标 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro |
| OS / 架构 | Linux aarch64（`ecs-hd-ai-work-00-0003`，`6.8.0-106-generic`） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `3b6290bc`，PR #647） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | KooCLI 7.2.12（credentials.json 已配置，AKSK 模式，cn-north-4） |
| 真云凭证 | `cn-north-4`（AKSK，仅只读验证；本轮未创建/销毁真云资源） |
| 测试类型 | 源码级探针 / 真机 CLI（readonly）/ MCP 协议 / 安全规则引擎 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`/`*.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行 | 49（设计级 54 标 PASS/FAIL，展开级 2 标 PASS） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 49 / 7 / 0 / 0 / 96 |
| 通过率（分母 = PASS+FAIL，不含 BLOCKED/NOT_RUN） | 87.5% |
| P0 / P1 / P2 新增缺陷 | 4 / 3 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 47 | 有证据且通过 PASS 门禁 |
| FAIL | 7 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 27 | 本轮未覆盖（PTY 安装引导 / Windows / 跨进程注入 / 真云 E2E / D10 评测等） |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 2 | OpenClaw 客户端矩阵展开（EXP-D5-9-1/3） |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 69 | 本轮未覆盖（其余多终端矩阵 / 真云 EXP-C4 / ADV-E / NR3 等） |
| **合计** | **71** | |

---

## 四、缺陷清单（详尽，7 个 FAIL，均有证据 + 根因）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow`，`HW_*` 前缀未拦截 | `safety-policy.mjs:336` | P | 待提单 |
| 2 | P0 | `D4-16` | 命令包裹穿透 | `sh -c "env \| grep HUAWEICLOUD"` 应返回 `deny` | 返回 `allow`，wrapper 内层命令未二次检测 | `safety-policy.mjs:335` | P | 待提单 |
| 3 | P0 | `D4-21` | 制品预检未检出 broad IAM policy | `actions = ["*"]` 应检出 findings>0 | findings=[]，Terraform HCL 未覆盖 | `safety/rules/cloud-risk-rules.json:192` | P | 待提单 |
| 4 | P0 | `D4-23` | 全局规则 huawei-agent-rules.mdc 注入失效 | `package.json files` 应含 `rules/` | files 白名单不含 `rules/`，npm 包缺失规则；setup-cli 0 处引用 | `package.json:8` + `setup-cli.mjs` | P | 待提单 |
| 5 | P1 | `D4-6` | adminPass 空格形式回显未脱敏 | `--adminPass xxx`（空格）应脱敏不返回明文 | 返回 `true`（明文 `Secret123` 出现在 args） | `safety-policy.mjs:42` | P | 待提单 |
| 6 | P1 | `D4-7` | hook 三工具之一（artifacts）失效 | `hook_check_artifacts` 对 broad IAM 应 `deny` | 返回 `allow` | `safety/rules/cloud-risk-rules.json:192` | P | 待提单 |
| 7 | P1 | `D9-2` | JSON-RPC 未知方法错误码未区分 | 未知方法应返回 `-32601`（Method not found） | 统一返回 `-32603`（Internal Error） | `mcp-server.mjs:169` + `mcp-protocol.mjs:95` | P | 待提单 |

### 根因详情（每个 P0/P1 缺陷附代码片段 + 复现证据）

**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`env | grep HW_ACCESS_KEY` → `deny`
- 实际：`printenv HW_ACCESS_KEY`、`env | grep HW_SECRET_KEY` 均返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336`
  `classifyTextCommand()` 的 env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY`（STS 临时凭证环境变量前缀）

```javascript
if (
  /(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i.test(text) &&
  /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)   // ← 缺 HW_ 前缀
) {
```

- 证据：`evidence/d4-security-core/probe-p0-security.log`（D4-2 两条 FAIL）

**#2 [P0] D4-16 命令包裹穿透**

- 期望：`sh -c "env | grep HUAWEICLOUD"` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335` `classifyTextCommand()` 的 `(^|\s)env` 不命中 wrapper 引号内的 `env`；未抽取 wrapper 内层命令二次检测
- 证据：`evidence/d4-security-core/probe-p0-security.log`

**#3 [P0] D4-21 / 制品预检未检出 broad IAM policy**

- 期望：`evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" ... statement { actions = ["*"] }'}])` 应 findings>0
- 实际：findings=[]（未检出）
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:192` `hwc-iam-admin-policy` 的 Action 正则仅匹配 JSON 形式（`"Action" : "*"` / `Action = *`），不匹配 Terraform HCL `actions = ["*"]`
- 证据：`evidence/d4-security-core/probe-p0-security.log`（D4-21 第二条）

**#4 [P0] D4-23 全局规则注入失效**

- 期望：`package.json files` 白名单含 `rules/`，全局安装后含 `huawei-agent-rules.mdc`
- 实际：`files` 白名单不含 `rules/`（`package.json:8`），`setup-cli.mjs` 0 处引用 `rules/`/`.mdc`/`agent-rules`，安装目标无规则文件
- 根因：`package.json:8-18` + `plugins/huaweicloud-core/src/setup-cli.mjs`（无引用）
- 证据：`evidence/d4-security-core/probe-d4-23-rules.log`（3 条 FAIL）

**#5 [P1] D4-6 adminPass 空格形式脱敏缺失**

- 期望：`--adminPass Secret123`（空格）脱敏后不返回明文值
- 实际：明文 `Secret123` 出现在 plan 返回的 args
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString()` 正则只覆盖 `\s*[:=]\s*`（等号/冒号分隔），KooCLI 空格形式 `--adminPass xxx` 不命中
- 证据：`evidence/d4-security-core/probe-d4-6-adminpass.log`

**#6 [P1] D4-7 hook 三工具之一（artifacts）失效**

- 期望：`hook_check_artifacts` 对 `actions = ["*"]` 返回 `deny`
- 实际：返回 `allow`
- 根因：同 #3，`cloud-risk-rules.json:192` 未覆盖 HCL 形式
- 证据：`evidence/d4-security-core/probe-d4-7-hooks.log`

**#7 [P1] D9-2 JSON-RPC 错误码未区分**

- 期望：未知方法应映射 `-32601`（Method not found）
- 实际：`mcp-server.mjs:169` 统一硬编码 `code: -32603`
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs:164-173` catch 统一 `-32603`；`mcp-protocol.mjs:95` `dispatch()` 抛 `Unsupported method` 但未映射 `-32601`
- 证据：`evidence/d9-protocol/probe-d9-mcp-protocol.log`

---

## 五、阻塞项（NOT_RUN 说明，共 96 条）

| 用例维度 | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-1/2/3/4/5/6 安装引导（PTY 菜单） | 非交互 shell 无 TTY 菜单 | 交互式终端 | 提供 TTY 后可复测 |
| D1-39 Windows EINVAL | Linux 单机无法复现 Windows 场景 | Windows 环境 | Windows 机器执行 |
| D1-41/42/45 跨进程注入 | 需可控 registry 响应 + MCP 进程重启时序夹具 | 注入夹具 | 夹具到位后复测 |
| D1-58 通用 MCP 白名单接入 | 需 Claude/Cursor merge 语义现场 | 多客户端环境 | 对应客户端复测 |
| D2-1 auth init 三端同步 | 需真实终端逐步收集三端落位证据 | 交互式终端 | 手动执行逐步验证 |
| D3-C4 + EXP-C4-* 服务创建类 | 红线：真云最低配置创建→删除归零，未执行真实资源创建 | 真云 + 配额 | 白名单 + 归零验证后执行 |
| D4-10/12/13/14 供应链/审计 | 需 pack 对比、SBOM 产出、CTS 审计现场证据 | SBOM/CTS | 工具链就绪后复测 |
| D4-24 确认令牌边界 | 需真云 + 可注入时钟（TTL 加速）确认流 | 可注入时钟 | 夹具到位后复测 |
| D5-6/7/8 其它客户端矩阵展开 | 本机单客户端（OpenClaw） | 多客户端环境 | 对应客户端复测 |
| D9-4/6/7 协议生命周期/跨客户端 | 需多客户端 + 可控协议时序 | 多客户端 | 环境就绪后复测 |
| D9-9 超时/取消 | 需可注入延迟夹具 + capabilities.cancellation | 延迟注入夹具 | 夹具到位后复测 |
| D10-1~5 评测类 | 需 E2E 评测集 + 人工标注 | 评测集 | 评测集就绪后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（所有只读命令输出已脱敏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / 沙箱 / OBS | 否 | 未创建 | 无残留 |

> 本轮未执行真云资源创建（D3-C4/EXP-C4 红线用例未跑），无资源残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（tools/call 超时协议语义与取消，需可注入延迟夹具 + capabilities.cancellation 实测，本轮仅做结构探测）
- 本轮未覆盖（说明范围）：真云 E2E / 多终端矩阵 / 审批流实时对话框 / Windows 场景 / D10 评测集
- 建议：P0 安全缺陷（D4-2/16/21/23）已被上一轮（2026-09-13）提单 #648，#4 D4-23 与 #3 D4-21 保持根因未修复，建议优先修复 `HW_*` env-dump 正则 + HCL broad IAM 检出。