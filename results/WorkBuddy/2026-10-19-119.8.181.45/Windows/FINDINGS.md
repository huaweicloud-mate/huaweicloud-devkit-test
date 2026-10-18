# FINDINGS — WorkBuddy/glm-5.2 Windows 每日测试 2026-10-19

## 缺陷清单（FAIL + SPEC-MISMATCH，共 6 条）

---

### F-1: D4-2 凭证 env 打印拦截不完整（FAIL，P0）

- **级别**: P0
- **用例**: D4-2 凭证env打印拦截
- **描述（现象）**: `huaweicloud_hook_check_command` 对 `bash -c "echo $HW_ACCESS_KEY"` 返回 `allow`，未拦截。`sh -c "env | grep HUAWEICLOUD"` 同样返回 `allow`。
- **断言（唯一可判定）**: `classifyTextCommand('bash -c "echo $HW_ACCESS_KEY"').decision === 'deny'`
- **根因（文件:行号）**: `plugins/huaweicloud-core/src/safety-policy.mjs:536-543` — `extractInnerCommand` 对 `bash -c "..."` 的内层命令提取后，env-dump 检测的正则 `/(^|\s)(env|printenv|...)/i` 只匹配命令名开头，而 `echo $HW_ACCESS_KEY` 不在 env-dump 检测范围；`$HW_ACCESS_KEY` 变量引用检测的正则 `/(?<!['\\])\$\{?(?:HUAWEICLOUD|HWC|HW|OS)_(?:SECRET_ACCESS_KEY|ACCESS_KEY|SECRET_KEY|SECURITY_TOKEN)/i` 只覆盖了 `HW_ACCESS_KEY` 但 `bash -c` 包裹后 `extractInnerCommand` 提取出的候选可能未正确触发。
- **证据**: `evidence/D4-2/stdout.log` — `r3.decision=allow`（bash -c echo $HW_ACCESS_KEY）
- **实际返回**: `decision=allow, findings=0`（应 deny）

---

### F-2: D4-3 明文 secret API 未拦截（FAIL，P0）

- **级别**: P0
- **用例**: D4-3 明文secret API拦截
- **描述（现象）**: `huaweicloud_hook_check_command` 对 `hcloud kms decrypt-data --plaintext-in-base64` 和 `hcloud csms show-secret --secret-id test` 均返回 `allow`，未拦截。
- **断言（唯一可判定）**: `evaluateCommandRisk('hcloud kms decrypt-data --plaintext-in-base64').decision !== 'allow'`
- **根因（文件:行号）**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — 规则库中无针对 `kms decrypt-data` 和 `csms show-secret` 的 deny/warn 规则。`hwc-command-secret-value-read` 规则的正则不匹配 `decrypt-data` 命令名。agent-rules.md 有 `MUST NOT call hcloud kms decrypt` 约束，但规则引擎未将其转化为可执行规则。
- **证据**: `evidence/D4-3/stdout.log` — `r1.decision=allow, r2.decision=allow`
- **实际返回**: `decision=allow, findings=0`（应 deny 或 warn）

---

### F-3: D4-16 命令包裹穿透（FAIL，P0）

- **级别**: P0
- **用例**: D4-16 命令包裹穿透
- **描述（现象）**: `sh -c "env | grep HUAWEICLOUD"` 和 `bash -c "echo $HW_SECRET_ACCESS_KEY"` 均返回 `allow`，hook 未提取内层命令并拦截。
- **断言（唯一可判定）**: `classifyTextCommand('sh -c "env | grep HUAWEICLOUD"').decision === 'deny'`
- **根因（文件:行号）**: `plugins/huaweicloud-core/src/safety-policy.mjs:489-497` — `extractInnerCommand` 对 `sh -c "..."` 提取的内层命令候选，env-dump 检测和 `$HW_*` 变量检测未正确触发。与 F-1 同根因。
- **证据**: `evidence/D4-16/stdout.log` — `sh -c env -> allow, bash -c echo $HW_SECRET_ACCESS_KEY -> allow`
- **实际返回**: 2/5 攻击返回 `allow`（应全部 deny）

---

### F-4: D4-19 确认流下预检未拦截破坏性 deploy plan（FAIL，P0）

- **级别**: P0
- **用例**: D4-19 确认流下预检仍生效
- **描述（现象）**: `huaweicloud_hook_check_deploy_plan` 对 `Force delete production ECS servers with cascade` 返回 `allow`，未拦截。
- **断言（唯一可判定）**: `evaluateDeployPlan('Force delete production ECS servers with cascade').decision !== 'allow'`
- **根因（文件:行号）**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — `hwc-destructive-delete-operation` 规则的正则只匹配 `hcloud` 命令格式，不匹配自然语言描述的 deploy plan 文本。deploy_plan 阶段的规则覆盖不足。
- **证据**: `evidence/D4-19/stdout.log` — `r2.decision=allow`（force-delete deploy plan）
- **实际返回**: `decision=allow, findings=0`（应 deny 或 warn）

---

### F-5: D10-4 规则库 warn 数量与设计契约不符（SPEC-MISMATCH，P0）

- **级别**: P0
- **用例**: D10-4 安全干预-静态规则层
- **描述（现象）**: 设计契约预期规则库 `9 deny + 7 warn`，实际 `9 deny + 10 warn`（共 19 条，非 16 条）。
- **断言（唯一可判定）**: `loadRiskRules().rules.filter(r => r.severity === 'warn').length === 7`
- **根因（文件:行号）**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — 规则库新增了 3 条 warn 规则（`hwc-command-adminpass-exposure`、`hwc-command-sts-credential`、`hwc-sandbox-missing-ttl` 等），但设计用例 D10-4 的预期未同步更新。
- **证据**: `evidence/D10-4/stdout.log` — `denyCount=9, warnCount=10`
- **实际返回**: `deny=9, warn=10`（spec 预期 deny=9, warn=7）

---

### F-6: D2-11 STS token 持久化未在冲突路径前置拒绝（SPEC-MISMATCH，P0）

- **级别**: P0
- **用例**: D2-11 R3 STS token拒绝落盘
- **描述（现象）**: `huaweicloud_auth_switch` action=persist + securityToken 在已有凭证冲突时返回 `needs_confirmation`，而非直接 `rejected`。R3 规范要求 STS token 永不落盘，应在冲突检测之前拒绝。
- **断言（唯一可判定）**: `callTool('huaweicloud_auth_switch', { action: 'persist', securityToken: 'STS', ... }).scope === 'rejected'`
- **根因（文件:行号）**: `plugins/huaweicloud-core/src/tools.mjs:1283-1306` — `auth_switch` persist 分支先执行冲突检测（`prev?.ak && prev.ak !== ak`），返回 `needs_confirmation`，之后才调用 `persistCredentials:1070` 的 STS 拒绝逻辑。STS 检查应在冲突检测之前。
- **证据**: `evidence/D2-11/stdout.log` — `status=needs_confirmation, scope=undefined`
- **实际返回**: `status=needs_confirmation`（应 `status=error, scope=rejected`）

---

## BLOCKED 用例（4 条，真·外部依赖）

| ID | 原因 | 解除条件 |
|---|---|---|
| D3-C3 | Sandbox E2E 需要 DevStation 上游连接 | DevStation 部署到本机 |
| D3-C14 | Sandbox HDKit 服务需要 DevStation | 同上 |
| D3-S3 | Sandbox 预览需要 DevStation | 同上 |
| D3-S7 | 跨服务交付需要 sandbox DevStation | 同上 |

> 这 4 条均为 sandbox 类用例，本机无 DevStation 上游连接，属真·外部依赖阻塞。
