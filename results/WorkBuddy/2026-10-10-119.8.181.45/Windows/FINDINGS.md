# FINDINGS — 缺陷发现清单（WorkBuddy-Windows）

> **落盘路径**：`results/WorkBuddy/2026-10-10-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-10 05:25:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

## #1【P0】D4-15 hook绕过尝试 — 大小写混淆命令未被拦截

- **现象**：`classifyTextCommand('hcloud DeLeTeSeRvErS --server-ids 123')` 返回 `decision: allow, risk: unknown_read`，绕过变体未被 deny
- **断言**：`classifyTextCommand('hcloud DeLeTeSeRvErS --server-ids 123')` 应返回 `decision: deny`
- **根因**：`safety-policy.mjs:120-131` — `commandOperation()` 将 `DeLeTeSeRvErS` 解析为 service 名称，operation 取 `123`。`hasWritePrefix()` 只检查 operation 字段的前缀匹配，不检查 service 字段是否包含写操作前缀。当 hcloud 后直接跟写操作名而非标准 `hcloud ECS deleteServers` 格式时，写操作名被误认为 service，导致未被识别为写操作。
- **影响**：攻击者可通过大小写混淆绕过 hook 安全检查执行写操作
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：待提单

## #2【P0】D2-11 R3 STS token拒绝落盘 — auth_switch persist token 未被拦截

- **现象**：`classifyTextCommand('hcloud auth_switch --persist --token STS.TOKEN.123')` 返回 `decision: allow, risk: unknown_read`
- **断言**：应返回 `decision: deny` 或 `decision: warn`，token 永不落盘
- **根因**：`safety-policy.mjs:120-131` — `commandOperation()` 将 `auth_switch` 解析为 service，`STS.TOKEN.123` 解析为 operation。`auth_switch` 不在 blockedSecretOperations 列表中，也不匹配 writeOperationPrefixes，因此落入 `unknown_read` allow 分支。缺少对 `auth_switch --persist --token` 组合的安全策略规则。
- **影响**：STS token 可能被持久化到磁盘，违反 R3 安全要求
- **证据**：`evidence/D2-11/stdout.log`
- **状态**：待提单

## #3【P1】D1-27 检测语义-已是最新 — judgeUpdate 返回格式不符预期

- **现象**：`judgeUpdate('1.1.8-next.2', {latest:'1.1.8-next.2'}, null)` 未返回 `up_to_date` 语义
- **断言**：result 应含 `up_to_date` 或 `updateAvailable: false`
- **根因**：`update-check.mjs` — `judgeUpdate` 函数返回格式可能不含 `up_to_date` 字符串，或函数签名/返回结构与预期不同
- **证据**：`evidence/D1-27/stdout.log`
- **状态**：待提单

## #4【P1】D1-28 检测语义-有新版本 — judgeUpdate 返回格式不符预期

- **现象**：`judgeUpdate('1.0.0', {latest:'1.1.8-next.2'}, null)` 未返回 `update_available` 语义
- **断言**：result 应含 `update_available` 或 `updateAvailable: true`
- **根因**：`update-check.mjs` — 同 D1-27，`judgeUpdate` 返回格式与预期不匹配
- **证据**：`evidence/D1-28/stdout.log`
- **状态**：待提单

## #5【P1】D2-10 R7 current档跟随 — resolveManagedProfile 未找到

- **现象**：koocli-profile.mjs 中未找到 `current` 或 `resolveManagedProfile` 标识
- **断言**：`resolveManagedProfile` 返回 current 档；`runHcloudConfigure` 带 `--cli-profile=`
- **根因**：`auth/koocli-profile.mjs` — 函数名或路径可能已变更，需检查实际导出的 API
- **证据**：`evidence/D2-10/stdout.log`
- **状态**：待提单

## #6【P1】D4-17 hook模糊fail-closed — 空输入未默认拒绝

- **现象**：`classifyTextCommand('')` 和 `classifyTextCommand('{}')` 返回 `decision: allow, risk: not_huaweicloud`
- **断言**：异常输入应默认拒绝（fail-closed），返回 `decision: deny`
- **根因**：`safety-policy.mjs:489` — 空字符串不匹配任何 credential/hcloud 模式，落入默认 allow 分支。应在入口处对空/畸形输入返回 deny。
- **影响**：空或畸形输入可能绕过安全检查
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：待提单

## #7【P1】D4-24 确认令牌过期与重复确认边界 — 审批令牌生命周期未实现

- **现象**：safety-policy.mjs 中未找到 confirmToken/approvalToken/consumeApprovalToken 相关代码
- **断言**：过期令牌返回 `{code:'CONFIRM_TOKEN_EXPIRED'}`，重复确认返回 `{outcome:'already_processed'}`
- **根因**：`safety-policy.mjs` — 审批令牌生命周期管理函数可能尚未实现或使用了不同命名
- **证据**：`evidence/D4-24/stdout.log`
- **状态**：待提单

## #8【P2】D2-27 KooCLI 版本管理 — 版本管理函数未找到

- **现象**：credentials.mjs 中未找到 koocli 相关代码，koocli-profile.mjs 中未找到 version 标识
- **断言**：KooCLI 版本管理功能可用
- **根因**：`auth/credentials.mjs` / `auth/koocli-profile.mjs` — 版本管理函数命名或位置可能不同
- **证据**：`evidence/D2-27/stdout.log`
- **状态**：待提单

## #9【测试侧】D6-3 MCP冷启时间 — 测试逻辑判断有误

- **现象**：源码目录路径中未包含 `mcp-server` 字符串
- **断言**：MCP 冷启动时间在合理范围内
- **根因**：测试逻辑判断有误 — 检查的是 `str(SRC)` 路径而非实际 mcp-server.mjs 文件存在性。SRC 路径为 `hdk/plugins/huaweicloud-core/src`，不包含 `mcp-server` 字面量。
- **证据**：`evidence/D6-3/stdout.log`
- **状态**：待提单

## #10【P1】D9-11 WebSocket 隧道通道生命周期 — tunnel 标识未在 mcp-protocol.mjs 中找到

- **现象**：mcp-protocol.mjs 中未找到 `tunnel` 标识
- **断言**：`HwlinkTunnelChannel` attach/ready/close 生命周期完整
- **根因**：`mcp-protocol.mjs` — WebSocket 隧道通道实现可能在其他文件中（如 `ws-exec/` 或 `mcp-server.mjs`），而非 mcp-protocol.mjs
- **证据**：`evidence/D9-11/stdout.log`
- **状态**：待提单
