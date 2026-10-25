# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-26 05:10:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-26-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit@1.1.12（GitHub `huaweicloud/huaweicloud-devkit`，gitHead `4ed07801`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项 / P1 1 项 / P2 1 项）

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
> - 真云 E2E（EXP-C4-01..22 + D3-C1/C2/C4..C7/S1..S8）：通过 `hcloud <service> <op> --cli-region=cn-north-4 --cli-output=json` 真调 KooCLI，解析 `result.stdout` 的 JSON 响应验证服务可达 + 操作列表非空。
> - 评测集（EXP-E01..15）：`node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs` 逐条调 serviceCatalog 路由层，断言 HIT/MISS（不依赖 LLM）。
> - 协议/质量/包探针：源码级 import + `existsSync`/`readdirSync`/`readFileSync` 验证文件存在性与内容。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `141 / 5 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `96.6%` |
| P0 / P1 / P2 新增缺陷 | `3 / 1 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（只读用例无资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `103` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期（EXP-E01） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

### P0 用例状态

| ID | 标题 | 状态 |
|---|---|---|
| D1-39 | Windows 升级检测链可用性 | PASS |
| D1-40 | 镜像 lag 下检测正确性 | PASS |
| D2-4 | 凭证脱敏正确性（小写 ak=） | **FAIL** |
| D2-11 | R3 STS token拒绝落盘 | PASS |
| D4-1 | 凭证文件读取拦截 | PASS |
| D4-2 | 凭证env打印拦截 | PASS |
| D4-3 | 明文secret API拦截（KMS DecryptData） | **FAIL** |
| D4-5 | 写操作误判检测 | PASS |
| D4-9 | 公开暴露/破坏性预检 | PASS |
| D4-15 | hook绕过尝试 | PASS |
| D4-16 | 命令包裹穿透 | **FAIL** |
| D4-18 | confirm-not-deny审批语义 | PASS |
| D4-19 | 确认流下预检仍生效 | PASS |
| D4-21 | hook_check_artifacts 具名回归 | PASS |
| D4-22 | hook_check_deploy_plan 具名回归 | PASS |
| D4-23 | 全局规则注入生效性 | PASS |
| D4-28 | Node 版安全 hook 链路 | PASS |
| D8-7 | 7 个 meta/通用技能指引 | PASS |
| D9-12 | initialize 握手协议安全基线 | PASS |
| D9-13 | tools/call 凭证不泄露 | PASS |
| D10-4 | 安全干预-静态规则层 | PASS |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（小写 ak=） | `safety-policy.mjs:20-30` + `:45` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截（KMS DecryptData） | `safety-policy.mjs:249-254` + `safety/policy.json:26` | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透（`$(hcloud KMS DecryptData)` 未拦截） | `safety-policy.mjs:440-446` + D4-3 衍生 | 待提单 |
| 4 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图「云主机」→ECS MISS | `mcp-server.mjs` serviceCatalog | 待提单 |
| 5 | P2 | `D4-25` | D4安全 | 错误消息中 Bearer token 未脱敏 | `safety-policy.mjs:45` redactString | 待提单 |

### 根因详情

#### D2-4：redactSecrets 对小写 ak= / sk= 未脱敏

- **期望**：`redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')` 应将 ak/sk 值替换为 `<redacted>`
- **实际**：输出原样保留 `config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`，`akLeak=true skLeak=true`
- **根因**：
  - `plugins/huaweicloud-core/src/safety-policy.mjs:20-30` `isSecretKeyName(key)` 将 key 小写化并移除非字母数字后匹配 `/access.*key|secret.*key|.../`。`ak` 归一化为 `ak`，不含 `access` 或 `secret` 子串；`sk` 同理。
  - `safety-policy.mjs:45` `redactString` 的 `(AK|SK)\s*[:=]` 正则只匹配大写 `AK=`/`SK=`，不匹配 JSON 中的 `"ak":"..."` 或命令行中的 `ak=...` 小写形式。
- **证据**：`evidence/D2-4/stdout.log` — `akLeak=true skLeak=true`，`redacted` 字段原样保留测试 AK/SK

#### D4-3：KMS DecryptData 未拦截

- **期望**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy').decision === 'deny'`
- **实际**：`decision = 'allow'`
- **根因**：
  - `plugins/huaweicloud-core/src/safety-policy.mjs:249-254` `policy.blockedSecretOperations.some(op => op.toLowerCase() === operation.toLowerCase())` 列表来自 `safety/policy.json:26`：`["ShowSecret", "ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，**缺 `DecryptData`/`Decrypt`**（KMS DecryptData 返回明文密文解密结果，属 secret-retrieval API）。
  - `safety-policy.mjs:257` `secret[_-]?string|secret[_-]?binary|showsecret|showsecretversion|getsecretvalue` 正则未覆盖 `decryptdata` 操作名。
- **证据**：`evidence/D4-3/stdout.log` — `decision=allow`

#### D4-16：`$(hcloud KMS DecryptData)` 命令替换包裹未拦截（D4-3 衍生）

- **期望**：`classifyTextCommand('$(hcloud KMS DecryptData)').decision === 'deny'`
- **实际**：`decision = 'allow'`，`risk = 'unknown_read'`
- **根因**：`safety-policy.mjs:440-446` `extractInnerCommand` 的 `cmdSubst = /\$\(([^)]+)\)/g` 正则**会**提取 `$(hcloud KMS DecryptData)` 的内层 `hcloud KMS DecryptData`，但 `safety-policy.mjs:532` 把 `[text, ...extractInnerCommand(text)]` 作为 candidates 逐个分类，对 `hcloud KMS DecryptData` 这个 candidate 应判 deny——因 D4-3 缺陷（DecryptData 不在 blockedSecretOperations 列表），unwrap 后仍判 allow。**D4-16 FAIL 是 D4-3 缺陷的衍生表现**：`$(...)` unwrap 链路本身正常（`bash -c "hcloud IAM DeleteUser"` → deny 写操作正常拦截），但 unwrap 后的 `hcloud KMS DecryptData` 因 D4-3 缺陷未被识别为 secret 操作。修复 D4-3 后 D4-16 应同步恢复 PASS。
- **证据**：`evidence/D4-16/stdout.log` — `$(hcloud KMS DecryptData)` decision=allow，其余 6 组包裹攻击均 deny

#### EXP-E01：serviceCatalog 中文意图路由 MISS

- **期望**：`huaweicloud_service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'})` recommendedServices 含 `ECS`
- **实际**：`recommendedServices = ["Run hcloud --help to list available services."]`，verdict=MISS
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层对「云主机」中文意图未做语义匹配（应映射到 ECS），返回兜底 "Run hcloud --help"。本轮 13/14 HIT=92.9%，E01 是少数 MISS 项之一。
- **证据**：`evidence/EXP-E01/stdout.log` — `verdict=MISS expect=ECS got=Run hcloud --help`

#### D4-25：错误消息中 Bearer token 未脱敏（新缺陷）

- **期望**：`redactSecrets('Authorization: Bearer abc123 token=xyz.ak.sk')` 输出不含 `abc123`
- **实际**：输出 `Authorization: <redacted> abc123 token=<redacted>`，`abc123`（Bearer token 值）原样泄漏
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 的正则匹配 `Authorization` 头但只脱敏 `Authorization:` 后到第一个空格的部分（即 `Bearer` 被误判为值），未覆盖 `Authorization: Bearer <token>` 形式中的 Bearer token 值。缺少 `bearer\s+[a-z0-9._-]+` 或 `Authorization:\s*Bearer\s+[^\s]+` 的脱敏规则。
- **证据**：`evidence/D4-25/stdout.log` — `redacted` 字段含 `abc123`

---

## 五、未执行用例与原因

无 BLOCKED / NOT_RUN 用例。所有 146 条用例（设计级 107 + 展开级 39）均已实测执行并落盘证据。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**D2-4 FAIL** — `redactSecrets` 对小写 `ak=`/`sk=` 未脱敏，凭证原样输出。属 P0 红线用例，已如实标 FAIL 附根因。
- [x] 写操作误判 read-only：**D4-5 PASS** — `DeleteServers`/`CreateServers` 均判 `deny`，无误判。
- [x] 红线（I 类）违规：**0** — 无虚报、无 mock 假跑、无复制昨日结果。所有 PASS 用例均实测+证据落盘+evidencePath 回填。当日 3 份 CSV 的执行时间均为 `20261025210xxx`（本日真实执行时刻，2026-10-26 凌晨北京时间），与 2026-10-25 结果逐字节不同（D4-16/D4-25 为今日新发现 FAIL）。
- [x] 脱敏复核：**D4-6 PASS**（adminPass 脱敏）、**D4-26 PASS**（findings 脱敏无泄漏）、**D4-27 PASS**（双路径脱敏）、**D9-13 PASS**（tools/call 响应无 AK/SK 泄漏）。

### 红线用例执行说明（2026-10-13 维护者新增要求）

| 红线用例 | 执行方式 | 实际返回 |
|---|---|---|
| D2-4 小写 ak= 脱敏 | `redactSecrets('config: ak=TESTAKXXX sk=TESTSKYYY')` 直调 safety-policy.mjs redactSecrets | **FAIL** — `akLeak=true skLeak=true`，ak/sk 原样泄漏 |
| D4-3 kms DecryptData 拦截 | `classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy')` 直调 safety-policy.mjs classifyTextCommand | **FAIL** — `decision=allow`（未拦截） |
| D4-2 env·bash 穿透 | `classifyTextCommand('printenv HW_ACCESS_KEY' / 'bash -c "printenv HW_ACCESS_KEY"' / 'env \| grep HW_' / 'echo $HW_ACCESS_KEY')` 4 组攻击输入 | **PASS** — decisions=`["deny","deny","deny","deny"]` 全部拦截 |
| D4-16 env·bash 穿透 | `classifyTextCommand('bash -c "hcloud ECS DeleteServer"' / 'sh -c "hcloud IAM DeleteUser"' / 'cmd /c "hcloud ECS DeleteServer"' / '$(hcloud KMS DecryptData)' / 'eval "hcloud ECS DeleteServer"' / 'sh -c "env \| grep HWC_"' / 'powershell -c "Get-Content ~/.huaweicloud/credentials.json"')` 7 组攻击输入 | **FAIL** — 6/7 拦截，但 `$(hcloud KMS DecryptData)` decision=allow（D4-3 衍生：unwrap 生效但 DecryptData 未在 secret 黑名单） |

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 无（只读 list_operations + plan） | N/A | N/A |
| VPC | 无（只读 list_operations） | N/A | N/A |
| 其他 22 服务 | 无（只读 list_operations） | N/A | N/A |
| Sandbox/DevStation | 无（无 BLOCKED） | N/A | N/A |

> 本次真云用例均为只读类（list_operations + plan），未创建任何云资源，无需销毁/归零。

---

## 八、遗留与建议

1. **D2-4（P0）**：`isSecretKeyName` 需增加缩写 key `ak`/`sk`/`token` 的匹配规则，或 `redactString` 的 `(AK|SK)` 正则改为大小写不敏感 `/((?:AK|SK|ak|sk)\s*[:=]\s*).../i`。
2. **D4-3（P0）**：`safety/policy.json` 的 `blockedSecretOperations` 列表需增加 `DecryptData`/`Decrypt`（KMS 解密返回明文，属 secret-retrieval）；或 `safety-policy.mjs:257` 正则补 `decryptdata|decrypt`。
3. **D4-16（P0，D4-3 衍生）**：修复 D4-3 后，`$(hcloud KMS DecryptData)` unwrap 后应正确判 deny；建议补一条 D4-16 回归用例专门覆盖 `$(hcloud KMS DecryptData)` 命令替换 + secret 操作组合。
4. **EXP-E01（P1）**：serviceCatalog 需增加「云主机」→ECS 中文语义匹配（同义词字典或 embedding 路由）。
5. **D4-25（P2，新发现）**：`redactString` 需增加 `Authorization:\s*Bearer\s+[^\s]+` 脱敏规则，覆盖 HTTP Bearer token 形式。
6. **与 2026-10-25 对比**：D2-4/D4-3/EXP-E01 为持续缺陷（昨日已提单/待复核）；D4-16/D4-25 为今日新发现 FAIL——D4-16 昨日 PASS 今日 FAIL 是因今日探针扩展了 `$(hcloud KMS DecryptData)` 攻击向量（昨日仅测 `bash -c`/`sh -c`/`cmd /c` 三组，未覆盖 `$(...)` + secret 操作组合），D4-25 昨日未执行（昨日探针未覆盖 Bearer token 脱敏场景）。均如实标 FAIL 附根因，未虚报。
