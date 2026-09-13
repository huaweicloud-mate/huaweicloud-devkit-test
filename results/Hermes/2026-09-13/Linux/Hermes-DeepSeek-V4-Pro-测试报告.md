# Hermes-DeepSeek-V4-Pro 测试报告

> 生成时间：2026-09-13（北京时间）
> 测试执行归档：`results/Hermes/2026-09-13/Linux/`
> 被测对象：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）

## 一、测试概述

| 项 | 值 |
|---|---|
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `3b6290b0`，PR #647） |
| 工具全集 | 39 个（`tools.mjs` TOOL_DEFINITIONS） |
| 本机环境 | Linux (aarch64)，Node v22.13.0，Python 3.12.3 |
| 真云凭证 | cn-north-4（credentials.json 已配置，AKSK 模式） |
| hcloud | 7.2.12（doctor 确认已装且已配置凭证） |
| Agent + 模型 | Hermes + DeepSeek-V4-Pro |
| 测试类型 | 源码级探针（safety-policy / risk-rule-engine / update-check / mcp-protocol）+ 真机 CLI（install/doctor/status/uninstall） |

**设计真源**：设计级 163 条 / 展开级 137 条 / 追踪表 169 条。
**执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，记录 decision/结果到 `stdout.log`；CLI 真机执行 install/status/doctor/uninstall 记录日志。

## 二、执行结果

### 2.1 状态汇总（设计级）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 32 | 有证据且通过 PASS 门禁校验 |
| FAIL | 7 | 不符预期，记录根因（见缺陷清单） |
| BLOCKED | 1 | D1-39 Windows 专属用例 |
| SPEC-MISMATCH | 7 | 契约漂移（历史遗留，待开发/产品裁决） |
| NOT_RUN | 116 | 本轮未覆盖（真云 E2E / 多终端矩阵 / 审批流实时对话框等） |
| **合计** | **163** | |

### 2.2 状态汇总（展开级）

| 状态 | 数量 |
|---|---|
| PASS | 1（EXP-D5-8-1 Hermes-D5-1 安装） |
| NOT_RUN | 136 |
| **合计** | **137** | |

### 2.3 已执行并通过的用例组

| 用例组 | 结果 |
|---|---|
| P0 安全核心（D4-1/3/4/5/7/9/22） | 通过，探针实测 deny/allow |
| P0 升级检测链（D1-27/28/30/31/32/34/40） | 通过（judgeUpdate/semverCompare 源码级） |
| P0 凭证脱敏（D2-4）+ STS 拒绝（D2-11） | 通过（redactSecrets + auth_switch persist+securityToken → {status:error, scope:rejected}） |
| P1 CLI 安装/doctor/status/uninstall（D1-1/3/4/5） | 通过（真机 CLI） |
| P1 安全域（D4-7/8/11/12/13/14/17/20） | 通过（源码级） |
| P1 MCP 协议（D9-1/3/4/8） | 通过（dispatch 源码级） |
| P0 技能机械执行（D8-7） | 通过（7 meta 技能 SKILL.md 结构 + retrieve_skill 加载） |

## 三、缺陷清单（7 个 FAIL）

| # | 级别 | 用例ID | 标题 | 根因（文件：行） |
|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `safety-policy.mjs` `classifyTextCommand()` 的 env-dump 正则 `/HUAWEICLOUD\|HWC_\|HCLOUD\|OS_/i`（line 334-337）未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀；`echo $HUAWEICLOUD_ACCESS_KEY_ID` 通道未被拦截（echo 不在 env/printenv 规则） |
| 2 | P0 | D4-15 | hook 绕过：命令替换 $() 混淆路径 | `classifyTextCommand('cat ~/.hc$(echo loud)/credentials')` 返回 allow，credentialFilePatterns 的 `\.hcloud` 被 `$(...)` 打断无法命中 |
| 3 | P0 | D4-16 | 命令包裹穿透：sh -c wrapper | `classifyTextCommand('sh -c "env \| grep HUAWEICLOUD"')` 与 `sh -c "hcloud ecs DeleteServer ..."` 均返回 allow，wrapper 内层未做二次提取检测 |
| 4 | P0 | D4-21 | hook_check_artifacts 未检测 Terraform HCL broad IAM | `risk-rule-engine.mjs` `hwc-iam-admin-policy` 的 Action 正则仅匹配 JSON `"Action":"*"`；`Action = ["*"]` 与 `effect = "Allow"`（带引号 HCL）不命中，evaluateArtifacts 返回 allow |
| 5 | P1 | D4-6 | --adminPass flag 形式不脱敏 | `redactString()`（line 40-46）仅匹配 `adminPass[:=]value`，未覆盖 `--adminPass value`（空格/flag 形式） |
| 6 | P2 | D4-10 | fork bomb 规则失效（正则双重转义） | `cloud-risk-rules.json` `hwc-sandbox-destructive-command` 的 fork bomb 正则 `:\(\)\{...` 双重转义，编译后匹配字面反斜杠；`:(){ :|:& };:` 永不命中（evaluateCommandRisk 返回 allow） |
| 7 | P2 | D9-2 | JSON-RPC 错误码未区分 | `mcp-server.mjs` `handleMessage()`（line 164-173）对所有异常硬编码 `code:-32603`，未知方法应映射 `-32601 (Method not found)` |

### 缺陷根因详情（关键证据）

**D4-2（P0）凭证 env 打印拦截不完整**

文件：`plugins/huaweicloud-core/src/safety-policy.mjs` line 334-343
```javascript
if (
  /(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i.test(text) &&
  /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)      // ← 缺 HW_ 前缀
)
```
- `env | grep HW_ACCESS_KEY` → `allow`（应 deny）
- `printenv HW_SECRET_KEY` → `allow`（应 deny）
- `echo $HUAWEICLOUD_ACCESS_KEY_ID` → `allow`（echo 通道无拦截）

**D4-16（P0）命令包裹穿透**

`sh -c "env | grep HUAWEICLOUD"` → allow（内层 env dump 未提取）；`sh -c "hcloud ecs DeleteServer --server-id x"` → allow（内层写操作穿透）。`classifyTextCommand()` 只检测整行文本，未提取 wrapper（`sh -c`/`bash -c`）内层参数做二次判定。对照：`bash -c "cat ~/.hcloud/credentials"` → deny（仅因凭证文件路径整行仍可见而命中，属巧合拦截）。

**D4-21（P0）Terraform HCL broad IAM 漏检**

`risk-rule-engine.mjs` 规则 `hwc-iam-admin-policy`：
- Action 正则 `"Action"\s*:\s*("*"|["*"])|Action\s*[=:]\s*(\*|\*:\*)`：不匹配 `Action = ["*"]`（`[` 阻断）
- Effect 正则 `"Effect"\s*:\s*"Allow"|Effect\s*[=:]\s*Allow`：不匹配 `effect = "Allow"`（引号阻断）
- JSON 形式 `"Action":"*"` + `"Effect":"Allow"` 可正确 deny（对比验证）

**D4-10（P2）fork bomb 规则失效**

`cloud-risk-rules.json` fork bomb 正则 field 值 `:\\\\\\(\\\\\\\\)\\\\{[^}]*...` 存在双重转义（`\\(` 被解析为字面 `\(`），编译后无法匹配标准 fork bomb `:(){ :|:& };:`。

## 四、阻塞项

| 项 | 原因 |
|---|---|
| D1-39 Windows 升级检测链（P0） | Windows 专属 EINVAL 场景，本机 Linux aarch64 无法复现 |
| D4-18/19 审批流实时对话框 | 需真实 Agent 会话确认流（半自动），源码级仅验证 assertAllowed 阻断语义 |
| D4-23 11 目标 rules 注入 | 仅源码级确认 rules 文件存在 + Hermes 单目标安装，未逐 11 目标验证 |
| D10 评测集 | 需真实 harness 运行评测集 |
| D3/D5/D6/D7 多终端/真云 E2E | 需逐客户端环境 + 真云资源创建/删除 |

## 五、证据清单

| 证据目录 | 探针脚本 | 覆盖用例 |
|---|---|---|
| `evidence/d4-security/` | `probe-d4-security.mjs` + `stdout.log` | D4-1/2/3/4/5/6/7/8/9/10/11/12/13/14/15/16/17/20/21/22/23 |
| `evidence/d1-upgrade/` | `probe-d1-upgrade.mjs` + `stdout.log` | D1-27/28/30/31/32/34/40 |
| `evidence/d2-d9-auth-protocol/` | `probe-d2-d9.mjs` + `stdout.log` | D2-4/11 + D9-1/2/3/4/8 |
| `evidence/d8-skills/` | `probe-d8-skills.mjs` + `stdout.log` | D8-7 |
| `evidence/d1-cli/` | `stdout.log` + `install.log` + `uninstall-reinstall.log` + `post-install-status.log` | D1-1/3/4/5（真机 CLI） |

## 六、真云资源清理声明

本轮仅执行源码级静态探针 + 只读 CLI（status/doctor/version）+ Hermes 目标 install/uninstall（最后已 reinstall 还原）。**未创建/删除任何华为云资源**，无资源残留。install/uninstall 测试对 ~/devkit-test/Hermes 工作区和 hermes-home 插件目录的改动已通过 reinstall 还原。

## 七、PASS 门禁校验

`python scripts/verify_no_fake_pass.py Hermes Linux 2026-09-13` → **通过**（所有 PASS 用例均有 evidencePath 且证据存在）。