# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-27 09:38:15（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-27-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit@1.1.12（GitHub `huaweicloud/huaweicloud-devkit`，gitHead `4ed07801`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项 / P1 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` (MINGW64_NT-10.0-20348) |
| Node / npm / Python | `Node v22.22.2 / Python 3.11.9` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.12` (npm latest 正式版) |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `KooCLI 7.2.12（doctor 确认已配置）` |
| 真云凭证 | `cn-north-4（AKSK 已配置 / 真机 list_operations 调用）` |
| 测试类型 | 源码级探针 + 真机 MCP 调用 + 真云只读 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |
| 机器 IP | 119.8.181.45 |

> **执行方法**：
> - 源码级探针直调（D1/D2/D4/D5/D6/D8/D9/D10 维度）：直接 import SUT 模块（safety-policy.mjs/risk-rule-engine.mjs/tools.mjs/credentials.mjs/update-check.mjs/icon-library.mjs/mcp-protocol.mjs 等），对 `classifyTextCommand`/`classifyHcloudArgs`/`redactSecrets`/`judgeUpdate`/`loadRiskRules`/`evaluateCommandRisk` 等函数输入真实攻击 payload，断言 `decision` 字段（deny/warn/allow）+ `result` 字段。
> - 真云 E2E（EXP-C4-01..22）：通过 `hcloud <service> <op> --cli-region=cn-north-4 --cli-output=json` 真调 KooCLI，解析 `result.stdout` 的 JSON 响应验证服务可达 + 操作列表非空。
> - 评测集（EXP-E01..15）：`node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs` 逐条调 serviceCatalog 路由层，断言 HIT/MISS（不依赖 LLM）。
> - 协议/质量/包探针：源码级 import + `existsSync`/`readdirSync`/`readFileSync` 验证文件存在性与内容。
> - 批量执行器 `scripts/batch_runner_20261027.mjs` 一次性跑完全部 146 用例，每条结果落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 3 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（只读用例无资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（小写 ak=/sk= 未脱敏） | `plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 正则 `(AK|SK)\s*[:=]` 仅匹配大写，不覆盖 `ak=`/`sk=` 小写形式 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截（KMS DecryptData 未拦截） | `plugins/huaweicloud-core/src/safety-policy.mjs:249` `blockedSecretOperations` 列表 + `safety/policy.json:26` 缺 `DecryptData`/`Decrypt` | 待提单 |
| 3 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图路由未命中（"云主机"→ECS） | `plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由层对"云主机"别名未映射到 ECS | 待提单 |

### 根因详情

**#1 D2-4 凭证脱敏正确性（P0）**
- 期望：`redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')` 应将 ak/sk 值替换为 `<redacted>`，`akLeak=false skLeak=false`
- 实际：`akLeak=true skLeak=true`，`redacted` 字段原样保留测试 AK/SK
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 的 `(AK|SK)\s*[:=]` 正则只匹配大写 `AK=`/`SK=`，不匹配命令行中的 `ak=...`/`sk=...` 小写形式；`isSecretKeyName` 归一化后 `ak` 不含 `access`/`secret` 子串。
- 证据：`evidence/D2-4/stdout.log`

**#2 D4-3 明文 secret API 拦截（P0）**
- 期望：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy').decision === 'deny'`
- 实际：`decision === 'allow'`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:249` `policy.blockedSecretOperations.some(op => op.toLowerCase() === operation.toLowerCase())` 列表来自 `plugins/huaweicloud-core/safety/policy.json:26`：`["ShowSecret", "ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，缺 `DecryptData`/`Decrypt`；`secret[_-]?string|secret[_-]?binary|showsecret|showsecretversion|getsecretvalue` 正则未覆盖 `decryptdata`。
- 证据：`evidence/D4-3/stdout.log`

**#3 EXP-E01 serviceCatalog 中文意图路由未命中（P1）**
- 期望：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 命中 ECS 查询路由
- 实际：返回 `Run hcloud --help to list available services.`（未命中 ECS）
- 根因：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由层对中文别名"云主机"未建立到 ECS 服务的映射；基线 21.4% MISS 中本条稳定复现。
- 证据：`evidence/EXP-E01/stdout.log` + `eval/results/eval-run-20261027013809.csv`

---

## 五、未执行用例与原因

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | `HUAWEICLOUD_AGENT_TOOLKIT_MODE` 是 DSH 客户端专属环境变量（注入 + SKIP_DSH_PLUGIN_INSTALL），WorkBuddy 不是 DSH 客户端，该用例不适用本客户端；展开级已在 DSH 侧覆盖 | 【调归属】 |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox E2E 需要 DevStation 上游真实网络连接（real network sandbox），本机无 DevStation；blockedReason: 缺 DevStation 上游 + 影响: 无法跑沙箱部署 E2E + 解除条件: 接入 DevStation 或在 DSH 客户端跑 | 【补环境】 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 同上，Sandbox HDKit 需要 DevStation 上游 | 【补环境】 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 同上，Sandbox 预览需要 DevStation 上游 | 【补环境】 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 同上，Sandbox 跨服务交付需要 DevStation 上游 | 【补环境】 |

> **改用例建议**：D1-67 建议在用例母版 `agent` 列标注「DSH 专属」，避免下发到非 DSH 客户端；D3-C3/C14/S3/S7 建议标注「需 DevStation 上游」，下发前校验环境。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无新增泄漏事件**（D2-4/D4-3 为已知历史缺陷，今日复测仍 FAIL，已记录根因待提单）
- [x] 写操作误判 read-only：**无**（D4-5/D4-9/D4-15/D4-16/D4-20 等写操作拦截用例全部 PASS）
- [x] 红线（I 类）违规：**0**
- [x] 脱敏复核：D9-13 `tools/call` 响应无 AK/SK 泄漏 = PASS；D4-26 findings 证据脱敏 = PASS；D4-27 双路径无泄漏 = PASS

### 红线用例执行说明（供维护者复核）

按防复发硬约束 ④，逐条写明红线用例的具体执行方式与实际返回：

1. **D2-4 小写 ak= 脱敏**：真实构造攻击输入 `redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')`，断言 `akLeak`/`skLeak` 字段。实际返回 `akLeak=true skLeak=true`，`redacted` 原样保留 → **FAIL**（真实测出问题，如实标注）。
2. **D4-3 KMS DecryptData 拦截**：真实调用 `classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy')`，断言 `decision` 字段。实际返回 `decision=allow` → **FAIL**（真实测出问题，如实标注）。
3. **D4-2 env·bash 穿透**：真实构造 4 种攻击输入 `printenv HW_ACCESS_KEY` / `bash -c "printenv HW_ACCESS_KEY"` / `env | grep HW_` / `echo $HW_ACCESS_KEY`，断言每条 `decision=deny`。实际返回 `["deny","deny","deny","deny"]` → **PASS**。
4. **D4-16 命令包裹穿透**：真实构造 7 种包裹形式 `bash -c` / `sh -c` / `cmd /c` / `$(...)` 命令替换 / `eval` 包裹，断言 deny-listed 命令在包裹内仍 deny。实际返回全部 `deny`（含 `$(hcloud ECS DeleteServer)=deny`、`$(hcloud CSMS ShowSecretVersion)=deny`、`$(cat ~/.hcloud/credentials.json)=deny`）→ **PASS**。注：`$(hcloud KMS DecryptData)=allow` 是 D4-3 DecryptData 未上 deny 列表的延伸，**不是**包裹穿透绕过（bare 与 wrap 一致，$() 正确 unwrap）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/etc | 0 | 0 | n/a（今日用例均为只读 list_operations/plan，无资源创建） |
| 本地临时文件 | `.update-skip-*.json` 探针临时文件 | 探针末尾 unlinkSync 清理 | 已清理 |

> 今日真云用例（EXP-C4-01..22）均为只读 `list_operations`/`plan` 调用，无资源创建，无需归零验证。

---

## 八、遗留与建议

- **D2-4 / D4-3**：与 2026-10-25/26 同一缺陷，历史单待复核（`HISTORY_LINKS.md` 关联清单由 `file_issue.py` 生成）。
- **EXP-E01**：serviceCatalog 对"云主机"中文别名未映射到 ECS，建议在路由层增加 `云主机→ECS` 别名字典；基线 21.4% MISS 中本条稳定复现。
- **D1-67 归属**：建议用例母版标注 DSH 专属，避免下发到非 DSH 客户端造成无效 BLOCKED。
- **D3 Sandbox 系列**：建议标注需 DevStation 上游，或在 DSH 客户端侧覆盖。
