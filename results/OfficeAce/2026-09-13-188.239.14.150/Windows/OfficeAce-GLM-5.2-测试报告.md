# huaweicloud-devkit 测试报告

| 字段 | 值 |
|------|-----|
| 客户端 | OfficeAce |
| 模型 | GLM-5.2 |
| OS | Windows (AMD64) |
| 日期 | 2026-09-13 |
| 机器 IP | 188.239.14.150 |
| 包版本 | huaweicloud-devkit@1.1.4-next.3 |
| 凭证模式 | AKSK (cn-north-4) |
| Node.js | v24.9.0 |
| KooCLI | v7.2.12 |

---

## 执行摘要

| 指标 | 数值 |
|------|------|
| 设计级用例总数 | 81 |
| 展开级用例总数 | 71 |
| 已执行用例 | 60 |
| PASS | 51 |
| FAIL | 9 |
| NOT_RUN | 21 (设计级) + 2 (展开级) |
| 通过率 | 85.0% |
| P0 覆盖率 | 100% (18/18 P0 全部执行) |
| P1 覆盖率 | 93.3% (42/45 P1 已执行) |

---

## P0 用例执行结果（18/18 全覆盖）

| 用例 ID | 维度 | 标题 | 状态 | 说明 |
|---------|------|------|------|------|
| D1-39 | D1安装 | Windows升级检测链可用性 | **FAIL** | `spawnSync('npm.cmd')` 无 `shell:true` 导致 EINVAL，升级检测链静默失败 |
| D1-40 | D1安装 | 镜像lag下检测正确性 | PASS | 镜像版本 ≤ 本地时正确返回 up_to_date，不提示降级 |
| D2-4 | D2认证 | 凭证脱敏正确性 | PASS | `show_profile_redacted` 所有凭证字段返回 `<redacted>` |
| D2-11 | D2认证 | R3 STS token拒绝落盘 | PASS | `persistCredentials()` 显式拒绝 STS token，R3 规则生效 |
| D4-1 | D4安全 | 凭证文件读取拦截 | PASS | `type config.json` 和 `cat ~/.hcloud/config.json` 均被 `hwc-command-credential-file` 拦截 |
| D4-2 | D4安全 | 凭证env打印拦截 | **FAIL** | `set HW_ACCESS_KEY`、`echo %HW_ACCESS_KEY%`、`printenv` 均返回 allow，无拦截规则 |
| D4-3 | D4安全 | 明文secret API拦截 | **FAIL** | `--access-key`/`--secret-key` 内联凭证未被检测，无对应风险规则 |
| D4-5 | D4安全 | 写操作误判检测 | PASS | `DeleteServers` 和 `CreateServers` 正确分类为 write/deny |
| D4-9 | D4安全 | 公开暴露/破坏性预检 | **FAIL** | 安全组规则 `0.0.0.0/0` 全端口未被 `hook_check_command` 或 `hook_check_deploy_plan` 检测 |
| D4-15 | D4安全 | hook绕过尝试 | PASS | 大小写变体（Deleteserver/DELETE_SERVERS）均被检测，无绕过 |
| D4-16 | D4安全 | 命令包裹穿透 | PASS | `sh -c`、`bash -c`、`eval` 包裹均穿透检测到内部 DeleteServers |
| D4-18 | D4安全 | confirm-not-deny审批语义 | PASS | `plan_cli_command` 返回 `approvalToken`，提供确认路径而非硬拒绝 |
| D4-19 | D4安全 | 确认流下预检仍生效 | PASS | `allowWrites=true` 时 `--force` 仍被 deny，预检不被确认流绕过 |
| D4-21 | D4安全 | hook_check_artifacts回归 | PASS | 宽泛 IAM 策略被 `hwc-iam-admin-policy` 拒绝 |
| D4-22 | D4安全 | hook_check_deploy_plan回归 | PASS | FunctionGraph 公开暴露被 `hwc-functiongraph-public-no-auth` 检测 |
| D4-23 | D4安全 | 全局规则注入生效性 | PASS | `safety/policy.json` + `cloud-risk-rules.json` 存在于插件中，运行时加载 |
| D8-7 | D8质量 | 7个meta技能指引验证 | PASS | 7 个 meta 技能全部可检索（注：`huaweicloud-getting-started` 注册名为 `huawei-getting-started`） |
| D10-4 | D10评估 | 安全干预有效性 | PASS | IAM DeleteUser/RDS DeleteInstance 被多层拦截（warn→deny→hard deny for --force） |

---

## P1 用例执行结果（42/45 已执行）

| 用例 ID | 维度 | 标题 | 状态 | 说明 |
|---------|------|------|------|------|
| D1-3 | D1安装 | doctor健康自检 | PASS | `cmdDoctor()` 检查 Node.js、MCP server、undici、safety policy、hooks、hcloud、skills |
| D1-26 | D1安装 | 升级提醒工具注册 | PASS | `huaweicloud_check_update` 和 `huaweicloud_upgrade` 均在 tools/list 注册，39 工具总数 |
| D1-27 | D1安装 | 检测语义-已是最新 | PASS | `judgeUpdate` 在 5 种场景正确返回 up_to_date |
| D1-28 | D1安装 | 检测语义-有新版本 | PASS | `judgeUpdate` 在 6 种场景正确返回 update_available |
| D1-30 | D1安装 | semver比对正确性 | PASS | 17 个测试用例全部正确，含 next.15>next.9 数值比较 |
| D1-41 | D1安装 | 卸载残留检测 | PASS | `files` 字段限定 9 目录，`pruneStale()` + `uninstall-cleanup.mjs` 处理清理 |
| D1-42 | D1安装 | 并发安装安全 | PASS | ESM 消除 require() 竞态，postinstall 幂等 |
| D1-58 | D1安装 | 白名单矩阵 | PASS | bin 入口、36 MCP 工具、6 插件 manifest 均验证通过 |
| D2-1 | D2认证 | auth_init基本功能 | PASS | AKSK 模式、cn-north-4、KooCLI v7.2.12 认证成功，9/11 agent 已配置 |
| D2-5 | D2认证 | 凭证缺失报错 | PASS | 明确错误信息："Run npx huaweicloud-devkit auth init or set HW_ACCESS_KEY/HW_SECRET_KEY" |
| D2-10 | D2认证 | 多profile切换 | PASS | KooCLI 多 profile 支持，`auth_switch` 3 action + 3 mode |
| D2-12 | D2认证 | 临时凭证不落盘 | PASS | `runtimeCredentials` 内存变量，STS 拒绝 persist，进程重启清除 |
| D2-13 | D2认证 | 凭证轮换提示 | PASS | 指纹漂移检测，`isManualModified()` 检查 mtime |
| D2-16 | D2认证 | projectId自动获取 | PASS | `resolveAndApplyProjectId()` 使用 IAM KeystoneListProjects |
| D3-A1 | D3功能 | detect_framework基本功能 | PASS | React 框架正确检测（"Create React App"） |
| D3-B3 | D3功能 | run_readonly_command执行 | PASS | `ListServersDetails` 执行成功，正确分类为 read_only |
| D3-C4 | D3功能 | 服务创建回归 | PASS | ECS/VPC/RDS 均返回有效操作列表 |
| D3-C5 | D3功能 | 工具冒烟 | PASS | check_cli v7.2.12、list_operations 100+ ops、plan_cli read_only、explain_error 有建议 |
| D4-4 | D4安全 | 凭证文件写入拦截 | PASS | `echo AK=xxx > ~/.hcloud/credentials` 被 `hwc-command-credential-file` 拒绝 |
| D4-6 | D4安全 | 只读操作误判检测 | PASS | `ListServers`/`ListVpcs` 正确分类为 read_only/allow |
| D4-7 | D4安全 | 破坏性操作分级 | PASS | Delete=warn(destructive)、Stop=write、List=read_only，分级正确 |
| D4-8 | D4安全 | 敏感参数检测 | **FAIL** | `--adminPass`/`--password` 参数未被 `hook_check_command` 检测 |
| D4-11 | D4安全 | IAM最小权限检测 | **FAIL** | 宽泛 `iam:*` 策略未与最小权限策略区分，均返回 `findings: []` |
| D4-13 | D4安全 | 资源删除保护 | PASS | RDS DeleteInstance 和 OBS DeleteBucket 均被 `hwc-destructive-delete-operation` 检测 |
| D4-17 | D4安全 | 管道命令穿透 | PASS | 管道 `|`、重定向 `>`、链式 `&&` 均未绕过检测 |
| D4-20 | D4安全 | 环境变量注入 | **FAIL** | `HW_ACCESS_KEY=xxx` 和 `AK=xxx SK=xxx` 环境变量未被检测 |
| D4-24 | D4安全 | 规则版本兼容 | PASS | 规则在 hook_check_command 和 hook_check_deploy_plan 间一致 |
| D5-1 | D5客户端 | 客户端矩阵覆盖 | PASS | 10 客户端插件全部找到（OpenCode/Codex/CodeArtsAgent/CodeArtsWork/WorkBuddy/DSH/OfficeAce/Hermes/OpenClaw/AtomCode） |
| D5-3 | D5客户端 | 工具全量枚举 | PASS | 39 工具枚举，精确集合匹配 |
| D6-4 | D6性能 | 工具响应延迟 | PASS | MCP 工具调用 < 5s 阈值，hcloud CLI 0.037s |
| D8-4 | D8质量 | 指引步骤可执行性 | PASS | `huawei-getting-started` 有 5 个可操作步骤 + 10 目标 Quick Index |
| D9-1 | D9协议 | tools/list合规 | PASS | 39 工具，有效 JSON Schema，无重复，协议 2024-11-05 |
| D9-2 | D9协议 | JSON-RPC错误码合规 | **FAIL** | 所有错误返回 -32603 而非 -32601/-32602/-32700；malformed JSON 导致进程崩溃 |
| D9-3 | D9协议 | tools/call响应格式合规 | PASS | `result.content` 数组，`type:"text"` + `text:string` |
| D9-4 | D9协议 | 协议生命周期 | **FAIL** | `tools/list` 在 `initialize` 前可调用，生命周期未强制 |
| D9-5 | D9协议 | stdio传输健壮性 | PASS | 10 快速请求、100KB 大参数、额外空白均正确处理 |
| D9-6 | D9协议 | 并发请求处理 | PASS | 3 并发请求均正确响应，ID 匹配 |
| D9-9 | D9协议 | 工具描述完整性 | PASS | 39 工具均有非空 description 和 inputSchema |
| D10-1 | D10评估 | 服务发现准确性 | PASS | service_catalog 返回 6 层能力路由 |
| D10-2 | D10评估 | 文档检索准确性 | PASS | search_docs("ECS create server") 返回 huawei-ecs (relevance=14) |
| D10-3 | D10评估 | 技能推荐准确性 | PASS | "create virtual machine" → huawei-ecs 排名第 2 |
| D10-5 | D10评估 | 错误诊断准确性 | PASS | explain_error 正确识别凭证问题，建议检查 profile/region/project_id |

---

## FAIL 用例详细分析（9 个 Bug）

### Bug 1: D1-39 - Windows 升级检测链 EINVAL
- **严重性**: 中（用户体验降级）
- **根因**: `queryDistTagsSync()` 使用 `spawnSync('npm.cmd', ...)` 未设置 `shell:true`
- **影响**: Windows 用户永远看不到升级通知
- **修复建议**: 在 Windows 平台添加 `shell: true` 选项

### Bug 2: D4-2 - 凭证环境变量打印未拦截
- **严重性**: 高（凭证泄露）
- **根因**: `cloud-risk-rules.json` 缺少凭证环境变量暴露规则
- **影响**: `set HW_ACCESS_KEY`、`echo %HW_ACCESS_KEY%`、`printenv HW_ACCESS_KEY` 均通过
- **修复建议**: 添加 `hwc-command-credential-env` 规则

### Bug 3: D4-3 - 明文凭证 API 未拦截
- **严重性**: 高（凭证泄露）
- **根因**: `classifyHcloudArgs()` 不检查 `--access-key`/`--secret-key` 内联凭证
- **影响**: 命令行明文凭证不被检测
- **修复建议**: 添加 deny-severity 规则匹配内联凭证模式

### Bug 4: D4-8 - 敏感参数未检测
- **严重性**: 中（密码泄露风险）
- **根因**: `hook_check_command` 不检查 `--adminPass`/`--password` 参数
- **影响**: 密码在命令行中明文传递不被警告
- **修复建议**: 添加敏感参数检测规则

### Bug 5: D4-9 - 公开暴露未检测
- **严重性**: 高（安全风险）
- **根因**: hook 系统不检查安全组参数中的 `0.0.0.0/0` 配置
- **影响**: 危险安全组规则不被预检拦截
- **修复建议**: 添加 `RemoteIpRange=0.0.0.0/0` 检测规则

### Bug 6: D4-11 - IAM 最小权限未检测
- **严重性**: 中（权限过大风险）
- **根因**: `hook_check_artifacts` 不区分宽泛和最小权限 IAM 策略
- **影响**: `iam:*` + `Resource:*` 策略不触发警告
- **修复建议**: 添加 IAM 策略宽泛度检测

### Bug 7: D4-20 - 环境变量凭证注入未检测
- **严重性**: 高（凭证泄露）
- **根因**: `hook_check_command` 不检查命令中的环境变量赋值
- **影响**: `HW_ACCESS_KEY=xxx hcloud ...` 不被检测
- **修复建议**: 添加环境变量凭证模式检测

### Bug 8: D9-2 - JSON-RPC 错误码不合规
- **严重性**: 中（协议不合规）
- **根因**: `dispatch()` 抛通用错误，`handleMessage()` 统一用 -32603；malformed JSON 导致进程崩溃
- **影响**: 客户端无法区分错误类型
- **修复建议**: 按 JSON-RPC 2.0 规范使用 -32601/-32602/-32700

### Bug 9: D9-4 - 协议生命周期未强制
- **严重性**: 低（协议不合规）
- **根因**: `dispatch()` 不检查 initialize 状态
- **影响**: 客户端可跳过初始化握手
- **修复建议**: 添加生命周期状态跟踪

---

## 未执行用例说明

21 个设计级 NOT_RUN 用例主要为：
- D1-1/D1-2/D1-4: 需要全新环境或特殊安装场景
- D1-29/D1-31/D1-43~D1-57: P2 优先级，非今日重点
- D2-2/D2-3/D2-6~D2-9/D2-14/D2-15: 需要特殊凭证场景（STS/CodeArts/多region）
- D3-A2~D3-C3: 需要实际云资源创建/删除
- D4-10/D4-12/D4-14: 需要特殊安全场景
- D6-1~D6-3: 性能基准测试，需要专用环境
- D7-1~D7-4: 兼容性测试，需要多版本环境
- D8-1~D8-3/D8-5~D8-6: 文档质量检查
- D10-6~D10-15: 评估任务，需要更复杂场景

---

## 证据目录

所有证据文件位于：`evidence/<case-id>/`（每个目录含 probe 脚本 + stdout.log）

证据目录总数：60

---

*报告生成时间：2026-09-13*
*测试执行者：OfficeAce (GLM-5.2)*
