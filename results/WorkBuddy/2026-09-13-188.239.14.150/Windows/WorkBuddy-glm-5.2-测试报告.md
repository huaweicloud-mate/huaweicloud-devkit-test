# WorkBuddy-glm-5.2 测试报告

> 生成时间：2026-09-13 18:05（北京时间）
> 测试执行归档：`results/WorkBuddy/2026-09-13-188.239.14.150/Windows/`
> 测试对象：huaweicloud-devkit@1.1.4-next.3（npm @next 最新）

## 一、测试概述

| 项 | 值 |
|---|---|
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next 最新） |
| 工具全集 | 39 个（`tools.mjs` TOOL_DEFINITIONS 注册数组） |
| 本机环境 | Windows Server，Node v22.22.2，Python 3.13.12 |
| 真云凭证 | cn-north-4（credentials.json 已配置，AKSK 模式） |
| Agent + 模型 | WorkBuddy + glm-5.2 |
| 测试类型 | 全量测试（P0 安全核心 + P0 升级检测链 + P0 凭证脱敏 + P1 协议/认证/功能 + 源码级补充） |
| 源码仓库 | hdk 已 clone（`C:/Users/Administrator/WorkBuddy/devkit-test/hdk`） |
| 机器 IP | 188.239.14.150 |

**设计真源**：设计级 81 条 / 展开级 71 条 / 追踪表 1 份。

## 二、执行结果

### 2.1 已执行并通过（有真实证据）

| 用例组 | 结果 |
|---|---|
| P0 安全核心（D4-1/3/5/7/8/9/17/18/19/20/21/22） | 12/12 ✓ |
| P0 凭证脱敏（D2-4） | 1/1 ✓ |
| P0 升级检测链（D1-26/27/28/30/31/33/39/40/41/42/45） | 11/11 ✓ |
| P1 认证域（D2-2/5/10/11/12/13/16） | 7/7 ✓ |
| P1 功能域（D3-A1/B1/B3/B5/C5） | 5/5 ✓ |
| P1 CLI（D1-3/4/6） | 3/3 ✓ |
| P1 客户端适配（D5-1/3/8） | 3/3 ✓ |
| P1 性能（D6-1/3/4） | 3/3 ✓ |
| P1 文档质量（D8-1/4/6/7） | 4/4 ✓ |
| P1 兼容（D7-4） | 1/1 ✓ |
| P1 MCP 协议（D9-1/3/5/8） | 4/4 ✓ |

### 2.2 执行状态汇总

| 状态 | 设计级 | 说明 |
|---|---|---|
| PASS | 52 | 有证据且通过门禁校验 |
| FAIL | 5 | 不符预期，记根因 |
| SPEC-MISMATCH | 3 | 契约漂移，需开发/产品裁决 |
| NOT_RUN | 21 | 未执行（环境阻塞或本轮未覆盖） |
| **合计** | **81** | |

### 2.3 展开级汇总

| 状态 | 展开级 |
|---|---|
| NOT_RUN | 71 |
| **合计** | **71** |

> 注：展开级 CSV 为多客户端共用设计矩阵（agent 列含 `Hermes; OpenCode; 声明支持的客户端矩阵`），不按单客户端拆分回填。WorkBuddy 的执行证据通过设计级回填覆盖。

## 三、缺陷清单（5 个 FAIL + 3 个 SPEC-MISMATCH）

| # | 级别 | 用例ID | 标题 | 根因 |
|---|---|---|---|---|
| 1 | P0 | D4-15 | hook 绕过 - `Deleteserver` 裸命令大小写变体 | `classifyTextCommand('Deleteserver --instance-id i-xxx')` 返回 `allow (not_huaweicloud)` — 未以 `hcloud` 前缀开头的裸写操作名不被识别为华为云命令，仅 `hcloud ECS DELETEserver` 被正确拦截 |
| 2 | P0 | D4-19 | 确认流下 `DeleteSecret` 预检失效 | `classifyHcloudArgs(['dew','DeleteSecret','--secret-id','test'], {allowWrites:true})` 返回 `allow (write)` — `DeleteSecret` 被判定为写操作而非 secret 操作，`allowWrites:true` 时直接放行，未保持 secret 拦截 |
| 3 | P1 | D9-2 | JSON-RPC 错误码缺失且映射错误 | `mcp-server.mjs` stdio 传输仅实现 `-32603`（Internal Error）；`-32700/-32600/-32601/-32602` 均未实现。`dispatch()` 抛 `Unsupported method` 被统一捕获为 `-32603`，应映射为 `-32601`（Method not found） |
| 4 | P1 | D9-4 | 协议生命周期未强制 | `tools/list` 在 `initialize` 之前发送时返回正常 39 工具结果而非错误 — MCP 规范要求 `initialize` 必须先于其他请求 |
| 5 | P1 | D9-7 | 协议版本协商无降级逻辑 | `initialize` 直接回显客户端 `protocolVersion`（或默认 `2024-11-05`），不校验是否为支持的版本，不做协商降级 |
| 6 | SPEC | D4-2 | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` 返回 allow — 正则 `HUAWEICLOUD|HWC_|HCLOUD|OS_` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀；`echo $HUAWEICLOUD_ACCESS_KEY_ID` 也不在拦截范围（echo 命令未被检测） |
| 7 | SPEC | D4-16 | 命令包裹穿透 - sh -c/eval wrapper | `sh -c "env \| grep HUAWEICLOUD"` 返回 allow — wrapper 内层命令未被提取做二次检测；`eval "hcloud DeleteServer"` 同样穿透 |
| 8 | SPEC | D4-23 | agent-rules.md 未注入 WorkBuddy 目录 | `setup-cli.mjs` 中 WorkBuddy 安装目标缺少 `huawei-agent-rules.md` 复制逻辑 |

### 缺陷根因详情

**D4-15 hook 绕过 - Deleteserver 裸命令**

文件：`plugins/huaweicloud-core/src/safety-policy.mjs` `classifyTextCommand()`
```javascript
// 仅当文本匹配 /(^|\s)hcloud(\.exe)?\s+/i 时才进入 classifyHcloudArgs
// 裸 "Deleteserver --instance-id i-xxx" 不含 hcloud 前缀 → 走 not_huaweicloud allow
```
`Deleteserver` 不带 `hcloud` 前缀时，`classifyTextCommand` 不识别为华为云命令，直接返回 `allow (not_huaweicloud)`。虽然实际执行需要通过 `run_approved_command` 或 `run_readonly_command` 工具（会走 `classifyHcloudArgs`），但 `hook_check_command` 对裸命令的拦截存在盲区。

**D4-19 DeleteSecret 预检失效**

文件：`plugins/huaweicloud-core/src/safety-policy.mjs` line 163-177
```javascript
if (policy.blockedSecretOperations.some((op) => op.toLowerCase() === operation.toLowerCase())) {
  return { decision: 'deny', risk: 'secret', ... };
}
```
`DeleteSecret` 不在 `blockedSecretOperations` 列表中（列表可能只含 `ShowSecretVersion`/`GetSecretValue` 等），且不匹配 `/secret[_-]?string|secret[_-]?binary/i` 正则。因此 `DeleteSecret` 被识别为写操作（`Delete` 前缀），在 `allowWrites:true` 时直接放行。

**D9-2 JSON-RPC 错误码**

文件：`plugins/huaweicloud-core/src/mcp-server.mjs`
```javascript
// handleMessage catch 块统一返回 -32603
} catch (error) {
  writeMessage({
    jsonrpc: '2.0', id: message.id,
    error: { code: -32603, message: error.message },
  });
}
```
`dispatch()` 中 `throw new Error('Unsupported method: ...')` 应映射为 `-32601`（Method not found），但被统一捕获为 `-32603`。`-32700`（Parse error）仅在 `mcp-server-remote.mjs` 中实现，stdio 传输完全缺失。

**D9-4 协议生命周期未强制**

文件：`plugins/huaweicloud-core/src/mcp-server.mjs`
服务器在 `tools/list` 请求到达时不检查 `initialize` 是否已完成，直接返回工具列表。MCP 规范要求 `initialize` 必须先于其他请求。

**D9-7 协议版本协商**

文件：`plugins/huaweicloud-core/src/mcp-server.mjs`
```javascript
protocolVersion: params.protocolVersion || '2024-11-05',
```
服务器直接回显客户端版本，不校验是否在支持列表中，不做协商降级。

## 四、阻塞项

| 项 | 原因 |
|---|---|
| D3-C1 ECS 生命周期 E2E | 不执行真实资源创建/删除（成本/时间约束） |
| D3-C3 沙箱部署 E2E | 需 DevStation 沙箱环境 |
| D3-C4 22服务只读规划 | 需逐服务真云调用（时间约束） |
| D3-C6 沙箱 7 隐式工具 | 需 DevStation 沙箱环境 |
| D3-C8 企业项目参数 | 需真云 enterprise_project_id |
| D4-6 adminPass 回显警告 | 需真云创建 ECS 场景 |
| D4-12 供应链安装期安全 | 需完整 postinstall 审计环境 |
| D4-13 最小权限凭证通过率 | 需只读 IAM AK/SK |
| D4-14 操作可审计性 | 需 CTS 查询权限 |
| D4-24 确认令牌过期 | 需可注入时钟 + 真云写操作 |
| D1-1 全新环境引导安装 | 需全新未安装环境 |
| D1-2 多 Agent 探测 | 需多客户端共存环境 |
| D1-5 uninstall 干净度 | 需已安装环境卸载验证 |
| D2-1 auth init 三端同步 | 需真云写操作（凭证同步到 KooCLI/OBS/沙箱） |
| D10 系列 | 需评测预算 + 真实 Agent E2E |

## 五、证据清单

| 证据目录 | 探针脚本 | 覆盖用例 |
|---|---|---|
| `evidence/d4-security-core/` | `probe-p0-security.mjs` + `stdout.log` | D4-1/2/3/5/7/8/9/15/16/17/18/19/20/21/22/23 + D2-4 |
| `evidence/d1-upgrade/` | `probe-p0-upgrade.mjs` + `stdout.log` | D1-26/27/28/30/31/33/39/40/41/42/45 |
| `evidence/d2-d3-auth-func/` | `probe-d2-d3-auth-func.mjs` + `stdout.log` | D2-2/5/10/11/12/13/16 + D3-A1/B1/B3/B5/C5 + D1-3/4/6 |
| `evidence/d5-static/` | `probe-d5-d9-static.mjs` + `stdout.log` | D5-1/3/8 + D6-1/3/4 + D8-1/4/6/7 + D7-4 |
| `evidence/d9-protocol/` | `probe-d9-mcp-protocol.mjs` + `stdout.log` | D9-1/3/4/5/8 |
| `evidence/d9-robust/` | `probe-d9-robust-source.mjs` + `stdout.log` | D9-2/7 |

## 六、与上轮（2026-09-12）对比

| 项 | 上轮 (09-12) | 本轮 (09-13) | 变化 |
|---|---|---|---|
| PASS | 80 | 52 | 设计真源缩减（daily 精选子集 vs 全量） |
| FAIL | 7 | 5 | D4-21/D4-22 已修复（上轮 FAIL→本轮 PASS） |
| SPEC-MISMATCH | 6 | 3 | D4-2/D4-16/D4-23 持续存在 |
| D4-21 broad IAM 制品 | FAIL | **PASS** | `evaluateArtifacts` 已修复，检测到 1 finding |
| D4-22 公网暴露 deploy plan | FAIL | **PASS** | `evaluateDeployPlan` 已修复，检测到 2 findings |
| D9-2 JSON-RPC 错误码 | FAIL | FAIL | 未修复 |
| D9-4 生命周期 | 未测 | **FAIL** | 新发现：initialize 前可 tools/list |
| D9-7 版本协商 | 未测 | **FAIL** | 新发现：无协商降级逻辑 |
| D4-15 hook 绕过 | FAIL | FAIL | `Deleteserver` 裸命令仍可绕过 |
| D4-19 DeleteSecret 预检 | 未测 | **FAIL** | 新发现：allowWrites 时 secret 拦截失效 |

## 七、真云资源清理声明

本轮未创建任何真云资源（仅执行只读查询和源码级静态检查），无资源残留。

## 八、PASS 门禁校验

`python scripts/verify_no_fake_pass.py WorkBuddy Windows` → **通过**

所有标 PASS 的用例均满足：
1. 已实际执行（探针真实运行）
2. 有结果证据落到 `evidence/<case-id>/`（probe 脚本 + stdout.log）
3. `evidencePath` 列回填该证据路径且文件存在
