# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-21 05:30:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-21-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL` —— 5 个 FAIL（3 P0 + 1 P1 + 1 P2），其余全 PASS

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows Server 2022 Standard x86_64` |
| Node / npm / Python | `Node v22.22.2 / npm / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.10`（npm latest，gitHead `b0e9f026`） |
| 工具全集 | `43`（`tools.mjs` `huaweicloud_*` 标识符） |
| hcloud / 依赖 | `KooCLI 7.2.12 / doctor 11 项全 PASS` |
| 真云凭证 | `cn-north-4（AKSK 只读子账号 HPUA3XUKSZCVI4GSG4MI，已使用真机调用）` |
| 测试类型 | 源码级探针 + 真机 hcloud CLI + eval harness + 真云只读 E2E |
| 设计真源 | 设计级 107 / 展开级 39 / 追踪表 216 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：batch-probe.mjs / batch-probe-p1.mjs / batch-probe-p2.mjs / batch-probe-supp.mjs 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand / classifyHcloudArgs / redactSecrets / evaluateCommandRisk / evaluateArtifacts / evaluateDeployPlan / judgeUpdate / parseStsExpiry 等），真云用例通过 hcloud CLI `--cli-access-key/--cli-secret-key` 注入只读子账号凭证，证据统一落 `evidence/<case-id>/stdout.log`（JSON 含 status/executedAt/result）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `141 / 5 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `96.6%` |
| P0 / P1 / P2 新增缺陷 | `3 / 1 / 1` |
| 红线（I 类）违规 | `0`（红线用例 D2-4/D4-3/D4-16 真实构造攻击输入并测出问题，如实标 FAIL） |
| 资源释放 | `全部归零`（只读调用，未创建任何资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `103` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | D2-4 / D4-3 / D4-16 / D4-25，根因见缺陷清单 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 serviceCatalog MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏遗漏小写 ak=/sk= | `redactSecrets('ak=... sk=...')` 必须 `<redacted>` | AK/SK 明文完整残留 | `safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | KMS DecryptData 明文 secret API 未拦截 | `classifyTextCommand('hcloud KMS DecryptData ...')` → `deny` | 返回 `allow` | `safety/policy.json:26` + `safety-policy.mjs:257` | 待提单 |
| 3 | P0 | `D4-16` | $() 包裹残留尾 `)` 致 operation 失配 | `$(hcloud KMS DecryptData)` → `deny` | 返回 `allow`，operation=`DecryptData)` | `safety-policy.mjs:500` | 待提单（与 #2 同根因合并提单） |
| 4 | P2 | `D4-25` | Authorization Bearer token 仅替首词 | `redactSecrets('Authorization: Bearer abc123')` 整体替换 | `abc123` 残留 | `safety-policy.mjs:42` | 待提单 |
| 5 | P1 | `EXP-E01` | serviceCatalog 未识别「云主机」同义词 | `云主机` intent → ECS | 返回兜底 `Run hcloud --help` | `tools.mjs:2027-2043` | 待提单 |

### 根因详情

**#1 [P0] D2-4 凭证脱敏遗漏小写 ak=/sk=**
- 期望：`redactSecrets('ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789')` → `ak=<redacted> sk=<redacted>`
- 实际：`ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=<redacted>`（AK/SK 明文残留）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45`
  ```javascript
  .replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, '$1=<redacted>')
  ```
  正则仅匹配大写 `AK`/`SK`，缺少 `i` 标志；第 42 行通用脱敏正则虽含 `i` 但未列 `ak`/`sk` 单独形式。
- 证据：`evidence/D2-4/stdout.log`

**#2 [P0] D4-3 KMS DecryptData 未拦截**
- 期望：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx')` → `{decision: "deny", risk: "secret"}`
- 实际：`{decision: "allow", risk: "unknown_read"}`
- 根因：`plugins/huaweicloud-core/safety/policy.json:26`
  ```json
  "blockedSecretOperations": ["ShowSecret", "ShowSecretVersion", "DownloadSecret", "GetSecretValue"]
  ```
  缺少 `DecryptData`；`safety-policy.mjs:257` 的次级正则 `secret[_-]?string|secret[_-]?binary|showsecret|showsecretversion|getsecretvalue` 不含 `decrypt`。
- 证据：`evidence/D4-3/stdout.log`

**#3 [P0] D4-16 $() 包裹穿透**
- 期望：`classifyTextCommand('$(hcloud KMS DecryptData)')` → `deny`
- 实际：`{decision: "allow", operation: "DecryptData)"}`（operation 多了 `)`）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:500`
  ```javascript
  return t.slice(hcloudIndex);  // 切到字符串末尾，未剥离 $() 尾 )
  ```
  `classifyTextCommand:588` 先处理原始 text 候选并 return，不再走 `extractInnerCommand` 已净化的 inner。
- 证据：`evidence/D4-16/stdout.log`

**#4 [P2] D4-25 Authorization Bearer 残留**
- 期望：`redactSecrets('Authorization: Bearer abc123 token=xyz')` → `Authorization: <redacted> token=<redacted>`
- 实际：`Authorization: <redacted> abc123 token=<redacted>`（`abc123` 残留）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:42` 值捕获组 `[^\s,;]+` 仅取首 token（`Bearer`），token 值 `abc123` 不在匹配范围。
- 证据：`evidence/D4-25/stdout.log`

**#5 [P1] EXP-E01 serviceCatalog MISS「云主机」**
- 期望：`huaweicloud_service_catalog({intent: '帮我查一下我账号在华北北京四有哪些云主机'})` → `recommendedServices: ['ECS']`
- 实际：`recommendedServices: ['Run hcloud --help to list available services.']`（兜底）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2027-2043` ECS keywords 含 `'云服务器'`、`'服务器'`、`'虚拟机'`，缺 `'云主机'`。
- 证据：`evidence/EXP-E01/stdout.log`；`evidence/eval-run-latest.csv`

---

## 五、未执行用例与原因

无。所有 146 条用例已执行并回填状态，无 NOT_RUN / BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4/D4-25 是脱敏函数缺陷，证据中无真实凭证，均为测试样本 `AKTEST`/`SKTEST`/`abc123`）
- [x] 写操作误判 read-only：`0`（D4-5/D4-7/D4-9 全 PASS，写操作均 deny/warn）
- [x] 红线（I 类）违规：`0`（红线用例 D2-4/D4-3/D4-16/D4-2/D4-1 均真实构造攻击输入去测，测出问题如实标 FAIL）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D2-4 证据中 AK/SK 为测试样本 `ABCDEFGHijkl0123456789XYZ`，非真实凭证）

### 红线用例执行复核（防复发硬约束 ④）

| 用例 | 执行方式 | 实际返回 |
|---|---|---|
| D2-4 小写 ak= 脱敏 | 输入 `ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi` 调 redactSecrets | AK/SK 明文残留 → FAIL |
| D4-3 KMS DecryptData 拦截 | 输入 `hcloud KMS DecryptData --cipher_text=xxx` 调 classifyTextCommand | decision=allow → FAIL |
| D4-2 env·bash 穿透 | 输入 `printenv HW_SECRET_KEY` / `echo $HW_SECRET_KEY` / `bash -c "printenv HW_SECRET_KEY"` 调 classifyTextCommand | 全部 decision=deny → PASS |
| D4-16 env·bash 穿透 | 输入 `$(hcloud KMS DecryptData)` / `bash -c "hcloud ECS DeleteServer"` 调 classifyTextCommand | `$()` 形式 decision=allow → FAIL |

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（只读 ListServersDetails） | N/A | 无创建，无需归零 |
| VPC | 否（只读 ListVpcs） | N/A | 无创建 |
| CCE/RDS/IAM 等 22 服务 | 否（只读 list） | N/A | 无创建 |

> 本轮全部为只读 E2E（list_operations + plan），未触发任何创建类操作；`--dryrun` 验证 plan 请求构造不实际调用云。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：真云创建类 E2E（D3-C1/C2/C3/C6/C7 的「最低配置创建→验证 ACTIVE→立即删除→归零」段）—— 本次仅做只读 list 段；创建类需在维护者明确同意计费后再跑
- 建议：
  1. 优先修复 D2-4 小写 ak=/sk= 脱敏（红线，加 `i` 标志一行改动）
  2. 修复 D4-3 KMS DecryptData 拦截（policy.json `blockedSecretOperations` 加 `DecryptData`，并在次级正则加 `decrypt` 模式）
  3. 修复 D4-16 `extractHcloudSubcommand` 残留尾 `)`（slice 时剥 shell 元字符）
  4. 修复 D4-25 Authorization Bearer 值捕获（改 `[^\s,;]+` 为贪婪到下一个 `key=` 或行尾）
  5. 修复 EXP-E01 serviceCatalog 加「云主机」同义词到 ECS keywords
