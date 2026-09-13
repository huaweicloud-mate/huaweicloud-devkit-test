# FINDINGS — 缺陷发现清单（OpenCode-GLM-5.2）

> **落盘路径**：`results/OpenCode/2026-09-13-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-13
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】Windows 升级检测链 spawnSync npm.cmd EINVAL 静默失败

- **现象**：`spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { encoding: 'utf8', windowsHide: true })` 在 Windows 上抛出 `EINVAL`（errno -4071），被 catch 块静默捕获返回 `null`，导致 `queryDistTagsSync` 返回 null。`spawn('npm.cmd', ...)` 异步路径同样抛出 EINVAL。`queryDistTagsFetch`（fetch 方式）可正常工作，但 MCP `check_update` 流程默认使用 `queryDistTags`（spawn 方式），无 fetch fallback。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:234` + `:255` — `spawnSync/spawn` 调用 `npm.cmd`（Windows 批处理文件）时未设置 `shell: true`，Node.js v22.22.2 对批处理文件仍抛 EINVAL。`getCachedUpdateInfo`（line 312）默认 `doQuery = queryDistTags`（spawn），`tools.mjs:1471` 调用时未覆盖为 `queryDistTagsFetch`。
- **影响**：Windows 用户 `check_update` MCP 工具返回 `check_failed`，无法获取版本更新提醒；升级检测链在 Windows 上完全不可用。
- **证据**：`evidence/D1-39/stdout.log` + `evidence/D1-39/probe.mjs`
- **状态**：待提单

## #2【P0】hook_check_command 未拦截明文 secret 返回 API（ShowServerPassword）

- **现象**：`hcloud ECS ShowServerPassword --server_id=test-12345` 经 `hook_check_command` 检查返回 `decision: allow, findings: []`，未被拦截。该 API 返回 ECS 实例的明文初始密码，属于安全模型 Blocked#3「明文 secret API」类别。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — 规则库缺少对 `ShowServerPassword` 等返回明文 secret 的只读 API 的拦截规则。`policy.json:26` 的 `blockedSecretOperations` 仅包含 `["ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，未覆盖 `ShowServerPassword`。
- **影响**：Agent 可调用返回明文密码的 API，密码可能进入上下文/日志，违反安全模型「明文 secret API 拦截」承诺。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P0】hook_check_artifacts 未检测 IaC 中的硬编码密码和公网暴露

- **现象**：向 `hook_check_artifacts` 提交包含 `admin_pass = "Huawei@123456"` 和 `cidr = "0.0.0.0/0"` + `port_range_min = 0, port_range_max = 65535` 的 Terraform 文件，返回 `decision: allow, findings: []`，两个安全风险均未被检测。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — artifact 检查规则不扫描 IaC 内容中的硬编码密码和公网暴露模式。规则仅检查 artifact 路径/元数据，不检查内容模式（如 `admin_pass`、`password`、`0.0.0.0/0` 等）。
- **影响**：包含硬编码密码和全端口公网暴露的 IaC 制品（Terraform/CloudFormation）可绕过安全检查被部署，导致凭证泄漏和公网暴露风险。
- **证据**：`evidence/D4-21/stdout.log`
- **状态**：待提单

## #4【非产品缺陷】gh CLI 未安装，影响 push 流程

- **现象**：`gh` 命令未安装，`prepare_env.py` 报告 `gh 未登录`
- **说明**：环境侧缺失，非产品缺陷。Step 6 push 需使用 `HDK_GH_TOKEN` 环境变量或安装 gh CLI。
