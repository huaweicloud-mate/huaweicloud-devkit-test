# AtomCode-deepseek-v4-pro 测试报告

> 生成时间：2026-09-13（北京时间）
> 测试执行归档：`results/AtomCode/2026-09-13/Linux/`
> 测试对象：huaweicloud-devkit（GitHub huaweicloud/huaweicloud-devkit）

## 一、测试概述

| 项 | 值 |
|---|---|
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next 最新，commit `3b6290bc`） |
| 源码仓库 | hdk 已 clone 并 checkout 到 `3b6290bc`（1.1.4-next.3） |
| 本机环境 | Linux，Node v22.23.2，Python 3.12.3 |
| 真云凭证 | cn-north-4（`credentials.json` 已配置，AKSK 模式） |
| Agent + 模型 | AtomCode + deepseek-v4-pro |
| 测试类型 | 每日回归：P0 安全核心 + P0 升级检测链 + P1 认证/MCP 协议 + 源码级全量单测 |
| gh 登录 | 未登录（影响 push 凭证路径与统一提单，不影响测试执行） |

**设计真源**：设计级 163 条 / 展开级 137 条 / 追踪表 169 条。

## 二、执行结果

### 2.1 已执行并通过（有真实证据）

| 用例组 | 结果 |
|---|---|
| P0 安全核心（D4-1/3/9/15/22） | 5/5 ✓ |
| P0 凭证脱敏 + 认证（D2-2/4/11） | 3/3 ✓ |
| P1 升级检测链（D1-28/40） | 2/2 ✓ |
| P1 MCP 协议（D9-1） | 1/1 ✓ |

### 2.2 源码级全量单测（hdk test 目录）

`node --test "test/*.test.mjs"` 全量 **442/442 pass**（safety-policy / mcp-server / update-check / auth-credentials / risk-rule-engine / credential-validator / tools / plugins-e2e / reconcile 等）。完整日志见 `evidence/full-suite/stdout.log`。

### 2.3 执行状态汇总（今日回填，仅本次实际执行）

| 状态 | 设计级 | 展开级 |
|---|---|---|
| PASS | 11 | 0 |
| FAIL | 4 | 0 |
| NOT_RUN | 148 | 137 |
| **合计** | **163** | **137** |

> 口径说明：本次为 AtomCode/Linux 单机每日回归，聚焦安全钩子、认证、升级检测与 MCP 协议的可机械执行用例。其余用例（客户端矩阵、真实云资源生命周期、沙箱 E2E 等）未经本机实际执行，如实标 NOT_RUN，不虚报。

## 三、缺陷清单（4 个 FAIL，均有证据）

| # | 级别 | 用例ID | 标题 | 根因 |
|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `classifyTextCommand()` env dump 正则 `/HUAWEICLOUD\|HWC_\|HCLOUD_\|OS_/i` 未覆盖 `HW_ACCESS_KEY` / `HW_SECRET_KEY` 前缀；`printenv HW_ACCESS_KEY`、`env \| grep HW_SECRET_KEY` 均被放行（allow） |
| 2 | P0 | D4-16 | 命令包裹穿透 | `sh -c "env \| grep HUAWEICLOUD"` 返回 allow — wrapper 内层参数未提取二次检测，仅整行正则匹配失效 |
| 3 | P0 | D4-21 | 制品预检未检出 broad IAM policy | `evaluateArtifacts()` 对含 `actions = ["*"]` 的 IAM policy 制品返回 0 findings，风险规则未覆盖 IaC 中的 broad IAM |
| 4 | P1/P2 | D9-2 | JSON-RPC 未知方法错误码未区分 | `mcp-server.mjs` catch 分支统一硬编码 `code: -32603`（Internal Error），未知方法应映射 `-32601`（Method not found） |

### 缺陷根因详情

**D4-2 凭证 env 打印拦截不完整**

文件：`plugins/huaweicloud-core/src/safety-policy.mjs` L334-336
```javascript
if (
  /(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i.test(text) &&
  /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)
) {
```
正则覆盖 `HWC_` 但缺 `HW_` 前缀，`HW_ACCESS_KEY` / `HW_SECRET_KEY`（运行时 STS 常用环境变量名）未被拦截。证据：`evidence/d4-security-core/stdout.log`（D4-2 两条 FAIL）。

**D4-16 命令包裹穿透**

文件：`plugins/huaweicloud-core/src/safety-policy.mjs` `classifyTextCommand()`。
`sh -c "env | grep HUAWEICLOUD"` 中 `env` 前是引号而非行首/空白，正则 `(^|\s)env` 不命中，且函数未抽取 wrapper 内层命令二次检测。证据：`evidence/d4-security-core/stdout.log`。

**D4-21 broad IAM policy 未检出**

文件：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `evaluateArtifacts()`。
对 `resource "huaweicloud_iam_policy"` + `statement { actions = ["*"] }` 的 Terraform 制品返回 `findings` 为空，broad IAM policy 规则未覆盖 IaC。证据：`evidence/d4-security-core/stdout.log`。

**D9-2 JSON-RPC 错误码**

文件：`plugins/huaweicloud-core/src/mcp-server.mjs` L164-173
```javascript
} catch (error) {
  writeMessage({
    error: { code: -32603, message: error.message },
  });
}
```
`mcp-protocol.mjs` `dispatch()` L95 对未知方法抛 `Unsupported method`，应映射 `-32601`，但被统一捕获为 `-32603`。证据：`evidence/d9-protocol/stdout.log`。

## 四、阻塞项

| 项 | 原因 |
|---|---|
| 客户端矩阵（D5 系列 10 客户端） | 本机仅 AtomCode 单客户端，未覆盖其它 9 客户端适配（EXP 展开级全 NOT_RUN） |
| 真云资源生命周期 E2E（D3-C1/C3/C6 等） | 不执行真实资源创建/删除（成本/时间约束），按红线归 NOT_RUN |
| `sh -c`/TTY 交互安装（部分 D1/D8） | 非交互 shell 无 PTY 菜单，未执行 |
| gh 未登录 | 影响统一提单与 push 凭证路径（详见资源清理/提交说明） |

## 五、资源清理声明

本次执行**未创建任何华为云资源**，无资源需清理。测试过程中使用 `HUAWEICLOUD_HOME` 指向临时目录的凭证落盘验证，探针已自清理（finally 删除临时目录）。

## 六、证据索引

| 证据目录 | 内容 |
|---|---|
| `evidence/d4-security-core/` | P0 安全核心探针（probe-p0-security.mjs + stdout.log） |
| `evidence/d2-auth/` | 认证域探针（凭证脱敏 / 文件读取拦截 / R3 STS 不落盘） |
| `evidence/d1-upgrade/` | 升级检测链探针（semver / target / 镜像 lag） |
| `evidence/d9-protocol/` | MCP 协议探针（dispatch / 错误码 / tools list） |
| `evidence/full-suite/` | 源码级全量单测 442/442 pass 日志 |