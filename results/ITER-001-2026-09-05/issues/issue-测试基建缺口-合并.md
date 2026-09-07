## 背景

社区测试团队在 `dev` 分支（`02fa79b` / v1.1.1-next.15）执行测试时发现三方面缺口：**dev 分支 CI 从未运行**、**测试套件在 Windows 不兼容**、以及**hook 规则引擎对高危操作判定放行**。合并上报便于统一排查。

---

## 1. 基建缺口 A：dev 分支 CI 从未运行

- GitHub Actions 在 `dev` 分支上**无任何运行记录**（API 查询 0 次，`repos/huaweicloud/huaweicloud-devkit/actions/runs?branch=dev` 为空）
- 影响：dev 新增代码（如 PR #498 凭证整改 28 文件 +2621/−65）从未经 CI 验证；跨平台问题被掩盖
- 建议：为 `dev` 分支启用 CI（至少 `ubuntu-24.04` 全量 `npm test` + lint/validate），并在 PR 合并门禁中引用

## 2. 基建缺口 B：测试套件 Windows 不兼容（npm test 250 测 / 5 失败）

本机 Windows 11（Node 22）运行 `npm test`：**245 通过 / 5 失败**，其中 4 个根因相同：

| 失败用例 | 位置 |
|---|---|
| preflightSecurityGroupCheck 危险 SG 检测（B1+B2 fix） | test/issue-443-fix.test.mjs:15 |
| preflightSecurityGroupCheck 旧格式向后兼容 | test/issue-443-fix.test.mjs:121 |
| auth sync writes OBS and reports all agent registration targets | test/auth-credentials.test.mjs:106 |
| auth_switch clear empties runtime and lets syncAuth run again | test/cred-reconcile-e2e.test.mjs:276 |

**根因**：测试 fake-hcloud 为 `#!/bin/bash` shim（`mkShim` / `test/fixtures/fake-hcloud.mjs`），经 `HCLOUD_BIN` 注入后被 `hcloud-cli.mjs` 以 `spawnSync(hcloudBin, {shell: false})` 调用——**Windows 结构上无法执行非 PE 可执行文件**（无 bash、无 shell）→ 命令行必然失败 → 断言必然失败。

另外 1 个失败（`hermes install creates skills...`，test/agent-install.test.mjs:263，断言 `~/.hermes/skills` 技能数 ≥6）疑为 Hermes 目录约定漂移（Hermes CN Desktop 使用 `hermes-home` 目录；本机真实 `install --target hermes` 成功，29 技能落位）。

**建议**：① fake-hcloud shim 改平台无关（Node 可执行包装，或 `process.platform === 'win32'` 时条件跳过）② 在 CI Linux 跑全量确认全绿（该环境有 bash）③ 同步修正 Hermes 安装测试的目录断言。

## 3. 安全缺陷 C（测试暴露，优先级最高）：hook 规则引擎对高危操作判定 allow

以下**破坏性操作**经 `evaluateCommandRisk` / `hook_check_command` 判定 **`decision: allow`（无规则匹配）**：

```
hcloud ECS NovaDeleteServer --server_id=x          → allow  ❌ 删除单台 ECS
hcloud ECS NovaDeleteKeypair --keypair_name=test    → allow  ❌ 删除密钥对
hcloud ECS NovaDeleteServerGroup --server_group_id=g → allow  ❌ 删除云服务器组（Nova 系）
hcloud ECS ResetServerPassword --server_id=x ...    → allow  ❌ 重置密码
```

**对照（证明规则引擎本身正常，仅覆盖不全）**：

```
hcloud ECS DeleteServers --server_ids=test1    → warn ✅ hwc-destructive-delete-operation
hcloud ECS DeleteServerGroup --server_group_id=g → warn ✅ 同规则
hcloud ECS CreateServers ...                   → warn ✅ hwc-cost-unbounded-scale
hcloud ECS NovaListServers --limit=1           → allow ✅ 只读正确放行
```

- **位置**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 的 `hwc-destructive-delete-operation` 规则漏覆盖 `Nova*` 前缀族与 `ResetServerPassword`；`risk-rule-engine.mjs` 无"操作名前缀族匹配"
- **兜底现状**：Node 策略层 `plan_cli_command` 对上述操作正确返回 `deny / risk: write`（写路径审批门有效）——**缺口在 L4 执行前 hook 预检层**（hook-capable 客户端上"执行前拦截"失效）
- **最小复现**：

```js
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
console.log(evaluateCommandRisk('hcloud ECS NovaDeleteServer --server_id=x'));
// → { decision: 'allow', findings: [] }   ❌ 期望 warn/deny
console.log(evaluateCommandRisk('hcloud ECS DeleteServers --server_ids=test1'));
// → { decision: 'warn', findings: [hwc-destructive-delete-operation] }  ✅ 对照
```

- **建议**：① `hwc-destructive-delete-operation` 扩充操作名清单（`NovaDeleteServer` / `NovaDeleteKeypair` / `NovaDeleteServerGroup` / `NovaDeleteServerMetadataItem` / `ResetServerPassword` / `DeleteServerPassword` 等）② 规则引擎增加前缀族匹配（`Nova*` / `Reset*` / `Delete*`）防止同类盲区 ③ 补充规则回归用例（执行前 hook 层）

---

## 环境

- huaweicloud-devkit `dev` @ `02fa79b`（= npm `1.1.1-next.15`）
- KooCLI 7.2.12 / Node 22 / Windows 11（`npm test` 本机结果）；MCP `hook_check_command` 与规则引擎直调双重确认

## 价值说明

这三项互为因果：**CI 未跑 → Windows 兼容问题未暴露 → 规则盲区只能靠人工测试发现**。修复 A/B 后，C 类安全回归可以进自动化门禁，防止再次漏网。测试细节归档位于我方私有仓库 `huaweicloud-mate/huaweicloud-devkit-test`（results/ITER-001-2026-09-05/），需要完整证据可联系。