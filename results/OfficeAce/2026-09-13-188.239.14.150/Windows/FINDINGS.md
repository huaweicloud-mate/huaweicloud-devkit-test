# FINDINGS - huaweicloud-devkit 测试发现

**日期**: 2026-09-13
**客户端**: OfficeAce (GLM-5.2) on Windows
**包版本**: 1.1.4-next.3

---

## 发现汇总

| 编号 | 用例 | 严重性 | 类别 | 状态 |
|------|------|--------|------|------|
| F-001 | D1-39 | 中 | Bug-Windows | 已确认 |
| F-002 | D4-2 | 高 | Bug-Security | 已确认 |
| F-003 | D4-3 | 高 | Bug-Security | 已确认 |
| F-004 | D4-8 | 中 | Bug-Security | 已确认 |
| F-005 | D4-9 | 高 | Bug-Security | 已确认 |
| F-006 | D4-11 | 中 | Bug-Security | 已确认 |
| F-007 | D4-20 | 高 | Bug-Security | 已确认 |
| F-008 | D9-2 | 中 | Bug-Protocol | 已确认 |
| F-009 | D9-4 | 低 | Bug-Protocol | 已确认 |

---

## F-001: Windows 升级检测链 EINVAL

- **用例**: D1-39 (P0)
- **严重性**: 中
- **现象**: `spawnSync('npm.cmd', ['view', 'huaweicloud-devkit@next', 'version'])` 在 Windows 上返回 `EINVAL` 错误
- **根因**: `queryDistTagsSync()` (src/update-checker.mjs:220-225) 使用 `spawnSync(NPM_BIN, ...)` 未设置 `shell:true`。Windows 上 `.cmd` 文件需要 shell 执行
- **影响**: Windows 用户永远看不到升级通知，`queryDistTagsSync()` 返回 `null`
- **证据**: `evidence/D1-39/stdout.log`
- **修复建议**: 在 Windows 平台添加 `shell: true` 到 spawnSync options

## F-002: 凭证环境变量打印未拦截

- **用例**: D4-2 (P0)
- **严重性**: 高
- **现象**: `set HW_ACCESS_KEY`、`echo %HW_ACCESS_KEY%`、`printenv HW_ACCESS_KEY` 均返回 `allow`
- **根因**: `cloud-risk-rules.json` 缺少凭证环境变量暴露规则
- **影响**: 攻击者可通过环境变量命令读取凭证
- **证据**: `evidence/D4-2/stdout.log`
- **修复建议**: 添加 `hwc-command-credential-env` 规则，匹配 `set/echo/printenv` + 凭证变量名

## F-003: 明文凭证 API 未拦截

- **用例**: D4-3 (P0)
- **严重性**: 高
- **现象**: `hcloud ECS CreateServers --access-key HPUXXX --secret-key XXX` 返回 `allow`
- **根因**: `classifyHcloudArgs()` 不检查 `--access-key`/`--secret-key`/`--AK`/`--SK` 内联凭证
- **影响**: 命令行明文凭证不被检测，可能被日志/进程列表泄露
- **证据**: `evidence/D4-3/stdout.log`
- **修复建议**: 添加 deny-severity 规则匹配内联凭证 flag 模式

## F-004: 敏感参数未检测

- **用例**: D4-8 (P1)
- **严重性**: 中
- **现象**: `--adminPass=MyPassword123` 和 `--password=SecretPass456` 均返回 `allow, findings: []`
- **根因**: `hook_check_command` 不检查密码/密钥类参数
- **影响**: 密码在命令行明文传递不被警告（注：`hook_check_deploy_plan` 会对 `adminPass` 脱敏，但 `hook_check_command` 不会）
- **证据**: `evidence/D4-8/stdout.log`
- **修复建议**: 添加敏感参数名模式检测（adminPass/password/secret/token/key）

## F-005: 公开暴露 0.0.0.0/0 未检测

- **用例**: D4-9 (P0)
- **严重性**: 高
- **现象**: 安全组规则 `--RemoteIpRange 0.0.0.0/0 --Port 0-65535` 未被 `hook_check_command` 或 `hook_check_deploy_plan` 检测
- **根因**: hook 系统不检查 hcloud 命令参数中的安全组配置
- **影响**: 危险的全端口公开暴露不被预检拦截
- **证据**: `evidence/D4-9/stdout.log`
- **修复建议**: 添加规则检查 `RemoteIpRange=0.0.0.0/0` + 宽端口范围

## F-006: IAM 最小权限未检测

- **用例**: D4-11 (P1)
- **严重性**: 中
- **现象**: `{"Action":["iam:*"],"Resource":["*"]}` 和最小权限策略均返回 `findings: []`
- **根因**: `hook_check_artifacts` 不区分宽泛和最小权限 IAM 策略（仅检测 `Action:["*"]` 全通配，不检测 `iam:*`）
- **影响**: 过宽的 IAM 权限不触发警告
- **证据**: `evidence/D4-11/stdout.log`
- **修复建议**: 扩展 `hwc-iam-admin-policy` 规则检测 `iam:*` 等服务级通配

## F-007: 环境变量凭证注入未检测

- **用例**: D4-20 (P1)
- **严重性**: 高
- **现象**: `HW_ACCESS_KEY=HPUXXX hcloud ECS ListServersDetails` 返回 `allow, findings: []`
- **根因**: `hook_check_command` 不检查命令前缀中的环境变量赋值
- **影响**: 凭证可通过环境变量注入而不被检测
- **证据**: `evidence/D4-20/stdout.log`
- **修复建议**: 添加环境变量赋值模式检测（`KEY=VALUE` 前缀 + 凭证变量名）

## F-008: JSON-RPC 错误码不合规

- **用例**: D9-2 (P1)
- **严重性**: 中
- **现象**:
  - 无效方法返回 -32603 而非 -32601 (Method not found)
  - 无效参数返回 -32603 而非 -32602 (Invalid params)
  - malformed JSON 导致进程崩溃而非返回 -32700 (Parse error)
- **根因**: `dispatch()` 抛通用 Error，`handleMessage()` 单一 catch 块统一用 -32603；`readFrames()` 中 `JSON.parse()` 未 try-catch
- **影响**: 客户端无法区分错误类型，malformed JSON 导致服务崩溃
- **证据**: `evidence/D9-2/stdout.log`
- **修复建议**: 按 JSON-RPC 2.0 规范分别使用 -32601/-32602/-32700；在 `readFrames()` 中 try-catch JSON.parse

## F-009: 协议生命周期未强制

- **用例**: D9-4 (P1)
- **严重性**: 低
- **现象**: `tools/list` 在 `initialize` 前可成功调用
- **根因**: `dispatch()` 不跟踪 initialize 状态，无条件处理所有方法
- **影响**: 客户端可跳过初始化握手，不符合 MCP 协议规范
- **证据**: `evidence/D9-4/stdout.log`
- **修复建议**: 添加 `initialized` 状态标志，非 initialize 方法在未初始化时返回错误

---

## 附加发现

### 注意事项（非 Bug）

1. **D8-7 技能名称不一致**: `huaweicloud-getting-started` 在注册表中实际名称为 `huawei-getting-started`（缺少 `cloud` 前缀）。功能正常但命名不一致，建议统一。

2. **D4-24 部分脱敏**: `hook_check_deploy_plan` 会对部署计划文本中的 `adminPass` 进行脱敏（`adminPass=<redacted>`），但 `hook_check_command` 不会。两个工具的脱敏行为不一致。

---

*生成时间: 2026-09-13*
*测试执行者: OfficeAce (GLM-5.2)*
