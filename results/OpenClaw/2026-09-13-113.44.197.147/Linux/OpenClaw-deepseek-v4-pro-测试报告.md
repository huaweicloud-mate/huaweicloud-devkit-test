# OpenClaw-deepseek-v4-pro 测试报告

> 生成时间：2026-09-13（北京时间）
> 测试执行归档：`results/OpenClaw/2026-09-13-113.44.197.147/Linux/`
> 测试对象：huaweicloud-devkit（GitHub huaweicloud/huaweicloud-devkit）

## 一、测试概述

| 项 | 值 |
|---|---|
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next 最新，commit `3b6290bc`） |
| 源码仓库 | hdk 已 clone 并 checkout 到 `3b6290bc`（1.1.4-next.3） |
| 本机环境 | Linux（arm64），Node v22.13.0，Python 3.12.3 |
| 真云凭证 | cn-north-4（`credentials.json` 已配置，AKSK 模式，KooCLI `default` profile） |
| Agent + 模型 | OpenClaw + deepseek-v4-pro |
| 测试类型 | 每日回归：P0 安全核心 + P1 认证/MCP 协议/客户端/技能 + P2 性能/文档/兼容 |
| gh 登录 | 未登录（`~/.hdk_token` 存在，push 凭证走 token 文件；gh CLI 未安装） |

**设计真源**：daily 精选设计级 81 条 / 展开级 71 条。

## 二、执行结果

### 2.1 执行状态汇总（今日回填，仅本次实际执行）

| 状态 | 设计级 | 展开级 |
|---|---|---|
| PASS | 47 | 2 |
| FAIL | 7 | 0 |
| NOT_RUN | 27 | 69 |
| **合计** | **81** | **71** |

PASS 门禁校验：`python scripts/verify_no_fake_pass.py OpenClaw Linux` → **通过**（所有 PASS 用例均有 evidencePath 且证据落盘）。

### 2.2 已执行并通过（有真实证据）

| 维度 | 用例 | 证据目录 |
|---|---|---|
| D1 安装/升级检测 | D1-26/27/28/30/31/33/40 | `evidence/d1-upgrade` |
| D2 认证 | D2-2/4/5/10/11/12/13/16 | `evidence/d2-auth` + `evidence/d4-security-misc` |
| D3 功能 | D3-A1/B1/B3/B5/C5 | `evidence/d3-d5-functional` + `evidence/d8-skills` |
| D4 安全 | D4-1/3/4/5/8/9/11/15/17/18/19/20/22 | `evidence/d4-security-core` + `evidence/d4-security-misc` |
| D5 客户端 | D5-1/3（含展开 EXP-D5-9-1/3） | `evidence/d3-d5-functional` |
| D6 性能 | D6-1/3/4 | `evidence/d6-performance` |
| D7 兼容 | D7-4 | `evidence/d8-docs` |
| D8 质量 | D8-1/4/6/7 | `evidence/d8-docs` + `evidence/d8-skills` |
| D9 协议 | D9-1/3/5/8 | `evidence/d9-protocol` + `evidence/d4-security-misc` |

**源码级全量单测**：`npm test`（`node --test "test/*.test.mjs"`）全量 **442/442 pass**。

### 2.3 性能实测（D6）

| 指标 | 实测 | 预期 |
|---|---|---|
| MCP 冷启 | p95 ≈ 241ms | <5s ✓ |
| 检索响应延迟（list_regions） | p95 ≈ 176ms | <2s ✓ |
| 并发调度（30 并发 tools/list） | 全通，无死锁错乱 | ✓ |

## 三、缺陷清单（7 个 FAIL，均有根因 + 证据）

| # | 级别 | 用例ID | 标题 | 根因 |
|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `safety-policy.mjs` L335-336 env dump 正则 `/HUAWEICLOUD\|HWC_\|HCLOUD\|OS_/i` 未覆盖 `HW_` 前缀，`printenv HW_ACCESS_KEY`、`env \| grep HW_SECRET_KEY` 被放行 |
| 2 | P0 | D4-16 | 命令包裹穿透 | `sh -c "env \| grep HUAWEICLOUD"` 返回 allow — wrapper 内层命令参数未提取二次检测 |
| 3 | P0 | D4-21 | 制品预检未检出 broad IAM policy | `risk-rule-engine.mjs` `hwc-iam-admin-policy`（cloud-risk-rules.json L179）只匹配 JSON 形式 `"Action"`，未覆盖 Terraform HCL `actions = ["*"]`，`evaluateArtifacts` 返回 0 findings |
| 4 | P0 | D4-7 | hook 三工具有效性 | 同上 broad IAM 根因 — `huaweicloud_hook_check_artifacts` 对 `actions = ["*"]` 返回 allow，三工具中 artifact 预检一条失效 |
| 5 | P1 | D4-6 | adminPass 回显警告 | `safety-policy.mjs` `redactString` L42 只脱敏 `adminPass=xxx`（等号形式），空格形式 `--adminPass xxx` 明文 `xxx` 未脱敏，进入 plan 返回的 args |
| 6 | P0 | D4-23 | 全局规则 huawei-agent-rules.md 注入失效 | `package.json` `files` 白名单（L8-18）未包含 `rules/`，npm 包 & 全局安装目录均无 `huawei-agent-rules.mdc`；`setup-cli.mjs` 未引用/注入 `rules/`，11 安装目标无全局规则注入 |
| 7 | P1 | D9-2 | JSON-RPC 未知方法错误码未区分 | `mcp-server.mjs` L164-173 catch 统一硬编码 `code: -32603`，`mcp-protocol.mjs` `dispatch()` 对未知方法抛 `Unsupported method` 但未映射 `-32601`（Method not found） |

### 缺陷根因详情

**🔥 D4-2 凭证 env 打印拦截不完整**
文件：`plugins/huaweicloud-core/src/safety-policy.mjs` L335-336
```javascript
if (
  /(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i.test(text) &&
  /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)
) {
```
正则覆盖 `HWC_` 但缺 `HW_` 前缀。运行时的 STS 临时凭证环境变量名恰为 `HW_ACCESS_KEY` / `HW_SECRET_KEY`（见 `reconcile.mjs` `scanState()` 读 `process.env.HW_ACCESS_KEY`），因此 `printenv HW_ACCESS_KEY`、`env | grep HW_SECRET_KEY` 均返回 `allow`。证据：`evidence/d4-security-core/stdout.log`（D4-2 两条 FAIL）。

**🔥 D4-16 命令包裹穿透**
文件：`plugins/huaweicloud-core/src/safety-policy.mjs` `classifyTextCommand()`。
`sh -c "env | grep HUAWEICLOUD"` 中 `env` 前是引号而非行首/空白，`(^|\s)env` 不命中；且函数未抽取 wrapper 内层命令二次检测。证据：`evidence/d4-security-core/stdout.log`。

**🔥 D4-21 / D4-7 broad IAM policy 未检出**
文件：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` L179 `hwc-iam-admin-policy` + `risk-rule-engine.mjs` `evaluateArtifacts()`。
`hwc-iam-admin-policy` 的 Action 正则仅匹配 JSON 形式（`"Action" : "*"` / `Action = *`），不匹配 Terraform HCL `statement { actions = ["*"] }`。`evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" ... statement { actions = ["*"] }'}])` 返回 `findings=[]`。证据：`evidence/d4-security-core/stdout.log`（D4-21）、`evidence/d4-security-core/hooks.log`（D4-7）。

**D4-6 adminPass 空格形式脱敏缺失**
文件：`plugins/huaweicloud-core/src/safety-policy.mjs` L42 `redactString()`。
正则 `adminPass\s*[:=]\s*...` 只覆盖 `=`/`:` 分隔；KooCLI 空格形式 `--adminPass Secret123` 不命中，明文值回显进 `planHcloudCommand` 返回的 `args`。证据：`evidence/d4-security-core/adminpass.log`（等号形式脱敏 PASS，空格形式 FAIL）。

**🔥 D4-23 全局规则注入失效**
文件：`package.json` L8-18 `files` 白名单未含 `rules/`；`plugins/huaweicloud-core/src/setup-cli.mjs` 无 `rules/`/`.mdc` 引用。
源码仓库存在 `rules/huawei-agent-rules.mdc`，但未进入 npm 包（`npm pack` 后全局安装目录无 `rules/`），且 `setup-cli.js` 安装各 agent 时（installOpenClaw/installOpenCode 等）只复制 skills/src/safety，不复制全局规则。证据：`evidence/d4-security-core/rules.log`。

**D9-2 JSON-RPC 错误码**
文件：`plugins/huaweicloud-core/src/mcp-server.mjs` L164-173。
```javascript
} catch (error) {
  writeMessage({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: error.message } });
}
```
`mcp-protocol.mjs` `dispatch()` L95 对未知方法抛 `Unsupported method: ${method}`，但被统一捕获为 `-32603`（Internal Error），未映射 `-32601`（Method not found）。证据：`evidence/d9-protocol/stdout.log`。

## 四、阻塞项（NOT_RUN 说明）

| 维度 | 原因 |
|---|---|
| D1-1/3/5 安装引导（PTY 菜单） | 非交互 shell 无 TTY 菜单，无法机械执行安装交互流程 |
| D1-39 Windows EINVAL | Linux 单机无法复现 Windows 场景 |
| D1-41/42/45 跨进程注入 | 需可控 registry 响应 + MCP 进程重启时序夹具 |
| D2-1 auth init 三端同步 | 需真实终端逐步收集三端落位证据 |
| D3-C4 真云服务创建类 | 红线：真云最低配置创建→删除归零，未执行真实资源创建 |
| D4-24 确认令牌边界 | 需真云 + 可注入时钟（TTL 加速）确认流 |
| D4-10/12/13/14 供应链/审计 | 需 pack 对比、SBOM 产出、CTS 审计等现场证据 |
| D5-6/7/8 等其它客户端矩阵展开 | 本机单客户端（OpenClaw），未覆盖其它客户端适配 |
| D9-4/6/7 协议生命周期/跨客户端 | 需多客户端 + 可控协议时序 |
| D9-9 超时/取消 | 需可注入延迟夹具 + capabilities.cancellation 实测 |
| D10-1~5 评测集 | 需完整评测集 + 模型参数 + 多轮交互，非单机每日回归范围 |

## 五、资源清理声明

本次执行**未创建任何华为云资源**。仅执行了 1 条只读命令 `hcloud IAM KeystoneListProjects --cli-region=cn-north-4`（D3-B3，无资源变更）。所有凭证落盘验证探针使用 `HUAWEICLOUD_HOME` 指向 `mkdtemp` 临时目录，探针 finally 已 `rmSync` 递归删除。无资源需清理。

## 六、证据索引

| 证据目录 | 内容 |
|---|---|
| `evidence/d1-upgrade/` | D1 升级检测链（semver/判定/冷却/skip 文件）probe + stdout.log |
| `evidence/d2-auth/` | D2 认证（脱敏/R3/R9/R10/import 擦除/auth status）probe + 多份 log |
| `evidence/d3-d5-functional/` | D3/D5（skill 完整性/工具枚举/清单/detect_framework/run_readonly）probe + log |
| `evidence/d4-security-core/` | D4 安全核心（P0 拦截/hook 三工具/审批语义/adminPass/规则注入）多 probe + log |
| `evidence/d4-security-misc/` | D4 补充（只读误判/fail-closed/Python-Node 一致性/list_operations）probe + log |
| `evidence/d6-performance/` | D6 性能（冷启/延迟/并发）probe + log |
| `evidence/d8-docs/` | D8 文档一致性 + D7 镜像源 probe + log |
| `evidence/d8-skills/` | D8 技能可机械执行 + D3-C5 工具冒烟 probe + log |
| `evidence/d9-protocol/` | D9 MCP 协议（tools/list/错误码/响应格式）probe + log |

## 七、后续建议

1. 补齐 7 个 FAIL 根因对应的修复验证（主要集中 P0 安全正则在 `HW_` 前缀、命令包裹、Terraform HCL broad IAM、`rules/` 打包注入分支）。
2. gh 未登录仅影响 `file_issue.py`（依赖 `gh issue create`）与 push 走 `gh auth git-credential` 的路径；本机 push 走 `~/.hdk_token`，可正常提交。