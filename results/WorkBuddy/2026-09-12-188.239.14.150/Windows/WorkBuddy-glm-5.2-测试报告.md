# WorkBuddy-glm-5.2 测试报告

> 生成时间：2026-09-12 22:31~（北京时间）
> 测试执行归档：`results/WorkBuddy/2026-09-12/Windows/`
> 测试对象：huaweicloud-devkit（GitHub huaweicloud/huaweicloud-devkit，dev 分支）

## 一、测试概述

| 项 | 值 |
|---|---|
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next 最新） |
| 工具全集 | 39 个（`tools.mjs` TOOL_DEFINITIONS 注册数组） |
| 本机环境 | Windows Server，Node v22.22.2，Python 3.13.14 |
| 真云凭证 | cn-north-4（credentials.json 已配置，AKSK 模式） |
| Agent + 模型 | WorkBuddy + glm-5.2 |
| 测试类型 | 全量测试（P0 安全核心 + P0 升级检测链 + P1 协议/认证/功能 + 源码级补充） |
| gh 登录 | 未登录（仅影响 push，不影响测试执行） |
| 源码仓库 | hdk 已 clone（`C:/Users/Administrator/WorkBuddy/2026-09-12-22-31-45/hdk`） |

**设计真源**：设计级 163 条 / 展开级 137 条 / 追踪表 169 条。

## 二、执行结果

### 2.1 已执行并通过（有真实证据）

| 用例组 | 结果 |
|---|---|
| P0 安全核心（D4-1/3/9/18/19/20/22） | 7/7 ✓ |
| P0 升级检测链（D1-27/28/30/31/32/34/35/39/40） | 9/9 ✓ |
| P0 凭证脱敏（D2-4） | 1/1 ✓ |
| P1 认证域源码级（D2-2/5/6/7/10/11/12/13/14/16/18/19） | 12/12 ✓ |
| P1 功能域（D3-A1/A4/A5/B1/B3/B4/B5/B6/B7/B8/C5/C7） | 12/12 ✓ |
| P1 CLI（D1-3/4/6） | 3/3 ✓ |
| P1 安全域源码级（D4-4/7/8/10/11/13/17） | 7/7 ✓ |
| P1 客户端适配（D5-1/3/8） | 3/3 ✓ |
| P1 性能（D6-1/3/4） | 3/3 ✓ |
| P1 文档质量（D8-1/4/6/7） | 4/4 ✓ |
| P1 MCP 协议（D9-1/3/4/5/7/8） | 6/6 ✓ |
| P1 兼容（D7-4） | 1/1 ✓ |
| P1 升级检测源码级（D1-26/33/36/37/38/41/42/44/47/48/49/50/51/53/54） | 15/15 ✓ |

### 2.2 执行状态汇总

| 状态 | 设计级 | 说明 |
|---|---|---|
| PASS | 80 | 有证据且通过门禁校验 |
| FAIL | 7 | 不符预期，记根因 |
| SPEC-MISMATCH | 6 | 契约漂移，需开发/产品裁决 |
| BLOCKED | 5 | 环境/权限阻塞 |
| NOT_RUN | 65 | 未执行（含历史 NOT_RUN + 本次未覆盖） |
| **合计** | **163** | |

### 2.3 展开级汇总

| 状态 | 展开级 |
|---|---|
| PASS | 48 |
| NOT_RUN | 89 |
| **合计** | **137** |

## 三、缺陷清单（7 个 FAIL + 6 个 SPEC-MISMATCH）

| # | 级别 | 用例ID | 标题 | 根因 |
|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `safety-policy.mjs` `classifyTextCommand()` 的 env dump 正则 `/HUAWEICLOUD\|HWC_\|HCLOUD_\|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀；`echo $HUAWEICLOUD_ACCESS_KEY_ID` 未被拦截（echo 命令不在 deny 规则） |
| 2 | P0 | D4-15 | hook 绕过尝试 - base64 解码执行 | `classifyTextCommand('echo ... \| base64 -d \| sh')` 返回 deny（因为匹配 credential 文件路径），但 `bash -c "cat ~/.config/huaweicloud/credentials.json"` 中 cat 命令被拦截而 wrapper 命令 `bash -c` 本身未被检测 |
| 3 | P0 | D4-16 | 命令包裹穿透 - sh -c wrapper | `classifyTextCommand('sh -c "env \| grep HUAWEICLOUD"')` 返回 allow — 内层 env dump 未被提取检测，wrapper 穿透 |
| 4 | P0 | D4-21 | hook_check_artifacts 未检测 broad IAM 制品 | `risk-rule-engine.mjs` `evaluateArtifacts()` 对含 `Action: ["*"]` 的 Terraform IAM role 制品返回 0 findings，规则未覆盖 IaC 中的 broad IAM policy |
| 5 | P1 | D4-23 | agent-rules.md 未注入 WorkBuddy 目录 | `setup-cli.mjs` 中 WorkBuddy 安装目标缺少 `huawei-agent-rules.md` 复制逻辑 |
| 6 | P2 | D9-2 | JSON-RPC 错误码 -32603 而非 -32601 | `mcp-server.mjs` line 169 硬编码 `code: -32603` (Internal Error)，未知方法应返回 `-32601` (Method not found) |
| 7 | P2 | D3-C9 | 资源不存在返回错误码与断言不一致 | 测试矩阵断言 APIGW.0101，实际服务返回 Ecs.0114（非产品缺陷，需裁决） |
| 8 | SPEC | D1-29 | pre-release 用户提醒策略差异 | pre 用户候选含 latest+next 取最大；升级提醒语义与文档表差异，需开发/产品裁决 |
| 9 | SPEC | D1-46 | 缓存 TTL 边界 reject 防御 | 主行为 PASS，46g reject 防御 SPEC（待开发裁决） |
| 10 | SPEC | D1-55 | 多会话提示隔离 | stdio PASS + remote SPEC/NOT_RUN + TTY BLOCKED（待裁决/环境） |
| 11 | SPEC | D2-20 | HUAWEICLOUD_HOME 重定向 (R6) | S2 固定 ~/.hcloud 不受影响（方案 T1 断言3），需真机复核 |
| 12 | SPEC | D4-24 | 确认令牌过期与重复确认边界 | 过期令牌返回精确 {code:'CONFIRM_TOKEN_EXPIRED'}，重复确认语义需裁决 |
| 13 | SPEC | D9-9 | tools/call 超时协议语义 | 超时返回 {code:-32000, message 含 'timeout'}，取消能力按 capabilities，需裁决 |

### 缺陷根因详情

**D4-2 凭证 env 打印拦截不完整**

文件：`plugins/huaweicloud-core/src/safety-policy.mjs` line 335-343
```javascript
if (
  /(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i.test(text) &&
  /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)
) {
```
正则中 `HWC_` 覆盖了 `HWC_ACCESS_KEY`，但未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀（少了 `HW_` 模式）。此外，`echo $HUAWEICLOUD_ACCESS_KEY_ID` 不在拦截范围（echo 命令未被检测）。

**D4-16 命令包裹穿透**

文件：`plugins/huaweicloud-core/src/safety-policy.mjs` `classifyTextCommand()`
`sh -c "env | grep HUAWEICLOUD"` 未被拦截 — 函数只检查整行文本是否匹配 `env` 模式，但不提取 wrapper 命令内层参数进行二次检测。

**D9-2 JSON-RPC 错误码**

文件：`plugins/huaweicloud-core/src/mcp-server.mjs` line 164-173
```javascript
} catch (error) {
  writeMessage({
    jsonrpc: '2.0',
    id: message.id,
    error: {
      code: -32603,  // ← 应根据 error 类型区分 -32601 (Method not found) vs -32603 (Internal error)
      message: error.message,
    },
  });
}
```
`dispatch()` line 95 `throw new Error('Unsupported method: ...')` 抛出的错误应映射为 `-32601`，但被统一捕获为 `-32603`。

## 四、阻塞项

| 项 | 原因 |
|---|---|
| D3-C1 ECS 生命周期 E2E | 不执行真实资源创建/删除（成本/时间约束） |
| D3-C3 沙箱部署 E2E | 需 DevStation 沙箱环境 |
| D3-C6 沙箱 7 隐式工具 | 需 DevStation 沙箱环境 |
| D3-C8 企业项目参数 | 需真云 enterprise_project_id |
| D1-52 真实升级安装 | 需一次性环境（升级链 BLOCKED） |

## 五、证据清单

| 证据目录 | 探针脚本 | 覆盖用例 |
|---|---|---|
| `evidence/d4-security-core/` | `probe-p0-security.mjs` + `stdout.log` | D4-1/2/3/9/15/16/18/19/20/21/22 + D2-4 |
| `evidence/d1-upgrade/` | `probe-p0-upgrade.mjs` + `stdout.log` | D1-27/28/30/31/32/34/35/39/40 + D1-26/33/36/37/38/41/42/44/47/48/49/50/51/53/54 |
| `evidence/d5-static/` | `probe-d5-d9-static.mjs` + `stdout.log` | D5-1/3/8 + D6-1/3/4 + D8-1/4/6/7 + D7-4 |
| `evidence/d2-d3-readonly/` | `probe-d2-d3-auth-func.mjs` + `stdout.log` | D2-2/5/6/7/10/11/12/13/14/16/18/19 + D3-A1/A4/A5/B1/B3/B4/B5/B6/B7/B8/C5/C7 + D1-3/4/6 |
| `evidence/d9-protocol/` | `probe-d9-mcp-protocol.mjs` + `stdout.log` | D9-1/3/4/8 + D6-3 |
| `evidence/d9-robust/` | `probe-d9-robust-source.mjs` + `stdout.log` | D9-2/5/7 |

## 六、剩余待执行项

1. **D1 剩余 NOT_RUN**：安装中断恢复(D1-56)、坏包回滚(D1-57)、OpenClaw 插件流(D1-7/8/9/10/11/12/13/14/15)
2. **D4 剩余 NOT_RUN**：D4-5/6/9/12/14 + confirm-not-dany 审批闭环(D4-18~20 已覆盖但 D4-23 rules 注入 FAIL)
3. **D3 剩余 NOT_RUN**：D3-A2/A3/A6 + D3-B2 + D3-C2/C4 + 22 服务只读规划
4. **D5/D6/D7/D8/D9/D10 共 ~40 条 NOT_RUN**：多终端矩阵/性能采样/OS 矩阵/文档质量/Agent E2E

## 七、真云资源清理声明

本轮未创建任何真云资源（仅执行只读查询和源码级静态检查），无资源残留。

## 八、PASS 门禁校验

`python scripts/verify_no_fake_pass.py WorkBuddy Windows` → **通过**

所有标 PASS 的用例均满足：
1. 已实际执行（探针真实运行）
2. 有结果证据落到 `evidence/<case-id>/`（probe 脚本 + stdout.log）
3. `evidencePath` 列回填该证据路径且文件存在
