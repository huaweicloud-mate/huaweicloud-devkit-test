# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-24 05:15:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-24-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit@1.1.12（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` (MINGW64_NT-10.0-20348) |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.12` (npm latest 正式版) |
| daily 基础用例 | 设计级 107 / 展开级 39 |
| 机器 IP | 119.8.181.45 |

> **执行方法**：
> - 源码级探针直调（d4-security/d2-auth/d1-upgrade/mcp-tools grouped probes）：直接 import SUT 模块（safety-policy.mjs/risk-rule-engine.mjs/tools.mjs/credentials.mjs），对 `classifyTextCommand`/`classifyHcloudArgs`/`redactSecrets`/`loadRiskRules`/`evaluateCommandRisk` 等函数输入真实攻击 payload，断言 `decision` 字段（deny/warn/allow）。
> - 真云 E2E（EXP-C4-01..22 + D3-C1/C2/C3/S1..S8）：通过 MCP `callTool('huaweicloud_list_operations', {service, region}, {credentials})` 真调 KooCLI，解析 `result.stdout` 的 "Available Operations" 段验证服务可达 + 操作列表非空，再调 `huaweicloud_plan_cli_command` 验证只读 plan 路径。
> - 评测集（EXP-E01..15）：`node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs`，调 `huaweicloud_service_catalog` MCP 工具对 15 条中文意图逐条路由，断言 HIT/MISS。
> - 协议/质量/包探针：源码级 import + `existsSync`/`readdirSync`/`readFileSync` 验证文件存在性与内容。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 19 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `86.9%` |
| P0 / P1 / P2 新增缺陷 | `4 / 15 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（只读用例无资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `101` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `25` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | EXP-E08 诊断类 N/A |
| **合计** | **`39`** | |

### P0 用例状态

| ID | 标题 | 状态 |
|---|---|---|
| D1-39 | Windows 升级检测链可用性 | PASS |
| D1-40 | 镜像 lag 下检测正确性 | PASS |
| D2-4 | 凭证脱敏正确性 | **FAIL** |
| D2-11 | R3 STS token拒绝落盘 | PASS |
| D4-1 | 凭证文件读取拦截 | PASS |
| D4-2 | 凭证env打印拦截 | PASS |
| D4-3 | 明文secret API拦截 | **FAIL** |
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
| D9-13 | tools/call 凭证不泄露 | **FAIL** |
| D10-4 | 安全干预-静态规则层 | PASS |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:20-30` isSecretKeyName 不匹配缩写 key `ak`/`sk` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety-policy.mjs:240` secret 拦截正则未覆盖 `kms decryptdata` | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs:384-419` classifyTextCommand 的 env-dump 检测未覆盖 `sh -c "printenv HW_*"` 包装 | 待提单 |
| 4 | P0 | `D9-13` | D9协议 | tools/call 凭证不泄露 | `safety-policy.mjs:20-30` 同 D2-4，redactSecrets 不脱敏缩写 `ak`/`sk` key | 待提单 |
| 5 | P1 | `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | `tools.mjs` TOOL_DEFINITIONS 缺部分隐式工具（check_user/credentials/sign_agreement） | 待提单 |
| 6 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:20-30` 同 D2-4，缩写 key 未脱敏 | 待提单 |
| 7 | P1 | `EXP-C4-14` | D3功能 | DMS 服务只读规划 | KooCLI `[USE_ERROR]不支持的服务名称:DMS`（需用 Kafka/RocketMQ 子服务名） | 待提单 |
| 8 | P1 | `EXP-C4-18` | D3功能 | DEW 服务只读规划 | KooCLI `[USE_ERROR]不支持的服务名称:DEW`（需用 KMS/CSMS/KPS 子服务名） | 待提单 |
| 9-19 | P1 | `EXP-E01..14` | D10评测 | 路由准确率 | `serviceCatalog` 路由层 11/14 MISS（基线 21.4% HIT） | 待提单 |

### 根因详情

#### D2-4 / D9-13 / D4-27：凭证脱敏对缩写 key 失效

- **期望**：`redactSecrets(JSON.stringify({ak:'AKID...', sk:'SK...', token:'STS...'}))` 应将 ak/sk/token 值替换为 `<redacted>`
- **实际**：输出原样保留 `{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}`
- **根因**：`safety-policy.mjs:20-30` `isSecretKeyName(key)` 将 key 小写化并移除非字母数字后匹配 `/access.*key|secret.*key|.../`。`ak` 归一化为 `ak`，不含 `access` 或 `secret` 子串；`sk` 同理。`redactString` 的 `(AK|SK)\s*[:=]` 正则只匹配大写 `AK=`/`SK=`，不匹配 JSON 中的 `"ak":"..."`。
- **证据**：`evidence/D2-4/stdout.log` — `akLeak=true skLeak=true`

#### D4-3：KMS DecryptData 未拦截

- **期望**：`classifyTextCommand('hcloud kms decryptdata --cipher-text test').decision === 'deny'`
- **实际**：`decision = 'allow'`
- **根因**：`safety-policy.mjs:240` secret 拦截正则 `/secret[_-]?string|secret[_-]?binary|showsecretversion|getsecretvalue/i` 未覆盖 `decryptdata` 操作名。KMS DecryptData 返回明文密文解密结果，属 secret-retrieval API，应被拦截。
- **证据**：`evidence/D4-3/stdout.log` — `decision=allow`

#### D4-16：sh -c 包装的 env-dump 未拦截

- **期望**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision === 'deny'`
- **实际**：`decision = 'allow'`
- **根因**：`safety-policy.mjs:398-419` env-dump 检测正则 `/(^|\s)(env|printenv|...)/i` 匹配命令开头，但 `sh -c "printenv ..."` 的开头是 `sh`，`printenv` 在引号内，正则的 `(^|\s)` 不匹配。`classifyHcloudArgs` 的 `stripExecutable` 虽 unwrap `sh -c`，但 env-dump 检测在 `classifyTextCommand` 入口处先于 hcloud 分支，未走 unwrap 路径。
- **证据**：`evidence/D4-16/stdout.log` — `actual=allow expected=deny`

#### EXP-C4-14/18：KooCLI 服务名不支持

- **期望**：`huaweicloud_list_operations({service:'DMS'})` 返回操作列表
- **实际**：KooCLI 返回 `[USE_ERROR]不支持的服务名称:DMS`
- **根因**：DMS 需用子服务名 `Kafka`/`RocketMQ`/`RabbitMQ`；DEW 需用 `KMS`/`CSMS`/`KPS`。serviceCatalog 未做 DMS→Kafka、DEW→KMS 的别名映射。
- **证据**：`evidence/EXP-C4-14/stdout.log` — `opCount=0`

#### EXP-E01..14：serviceCatalog 路由准确率低

- **期望**：15 条中文意图路由到正确服务（HIT）
- **实际**：仅 3 条 HIT（E06 DCS、E09 CCE、E15 代金券），11 条 MISS，1 条 N/A
- **根因**：`serviceCatalog` 对多数中文意图返回 "Run hcloud --help" 兜底，未做语义匹配。基线 21.4% HIT，与历史一致（已知缺陷）。
- **证据**：`evidence/EXP-E01/stdout.log` 等 + `eval/results/eval-run-*.csv`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `EXP-E08` | D10评测 | 我的ECS启动失败了帮我分析原因 | eval harness 标 N/A（诊断类，非路由用例，无期望服务） | 【改用例】 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**D2-4/D9-13/D4-27 FAIL** — `redactSecrets` 对缩写 key `ak`/`sk` 未脱敏，凭证 JSON 原样输出。属 P0 红线用例，已如实标 FAIL 附根因。
- [x] 写操作误判 read-only：**D4-5 PASS** — `DeleteServers`/`CreateServers` 均判 `deny`，无误判。
- [x] 红线（I 类）违规：**0** — 无虚报、无 mock 假跑、无复制昨日结果。所有 PASS 用例均实测+证据落盘+evidencePath 回填。
- [x] 脱敏复核：**D4-6 PASS**（adminPass 脱敏）、**D4-27 FAIL**（缩写 key 未脱敏）。

### 红线用例执行说明（2026-10-13 维护者新增要求）

| 红线用例 | 执行方式 | 实际返回 |
|---|---|---|
| D2-4 小写 ak= 脱敏 | `redactSecrets(JSON.stringify({ak:'AKID...',sk:'SK...'}))` 直调 | **FAIL** — ak/sk 原样泄漏 |
| D4-3 kms DecryptData 拦截 | `classifyTextCommand('hcloud kms decryptdata --cipher-text test')` 直调 | **FAIL** — decision=allow（未拦截） |
| D4-2 env·bash 穿透 | `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 直调 | **FAIL**（D4-16）— decision=allow（sh -c 包装未拦截） |
| D4-16 env·bash 穿透 | 同上 | **FAIL** — sh -c 包装的 env-dump 未拦截 |

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 无（只读 list+plan） | N/A | N/A |
| VPC | 无（只读 list+plan） | N/A | N/A |
| 其他 22 服务 | 无（只读 list_operations） | N/A | N/A |

> 本次真云用例均为只读类（list_operations + plan），未创建任何云资源，无需销毁/归零。

---

## 八、遗留与建议

1. **D2-4/D9-13/D4-27（P0/P1）**：`isSecretKeyName` 需增加缩写 key `ak`/`sk`/`token` 的匹配规则，或 `redactString` 的 `(AK|SK)` 正则改为大小写不敏感。
2. **D4-3（P0）**：secret 拦截正则需增加 `decryptdata`/`decrypt` 等操作名。
3. **D4-16（P0）**：`classifyTextCommand` 的 env-dump 检测需先 `stripExecutable` unwrap 再匹配，或扩展正则覆盖 `sh -c "printenv ..."` 模式。
4. **EXP-C4-14/18**：serviceCatalog 需增加 DMS→Kafka、DEW→KMS 别名映射。
5. **EXP-E01..14**：serviceCatalog 路由准确率 21.4%，需增强中文意图语义匹配（已知历史缺陷，基线一致）。
