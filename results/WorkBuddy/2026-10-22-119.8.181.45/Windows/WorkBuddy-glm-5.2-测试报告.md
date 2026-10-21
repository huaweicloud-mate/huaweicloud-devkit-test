# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-22 05:10:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-22-119.8.181.45/Windows/`
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

> **执行方法**：batch-probe.mjs / batch-probe-p1.mjs / batch-probe-p2.mjs / batch-probe-supp.mjs 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand / classifyHcloudArgs / redactSecrets / evaluateCommandRisk / evaluateArtifacts / evaluateDeployPlan / judgeUpdate / parseStsExpiry 等），真云用例通过 hcloud CLI `--cli-access-key/--cli-secret-key` 注入只读子账号凭证，证据统一落 `evidence/<case-id>/stdout.log`（JSON 含 status/executedAt/result）。eval harness 跑 `node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs` 真实调用 serviceCatalog 路由层。

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
| FAIL | `1` | EXP-E01 serviceCatalog 路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety/policy.json:26` + `safety-policy.mjs:257` | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs:500` | 待提单 |
| 4 | P2 | `D4-25` | D4安全 | findings 证据脱敏 | `safety-policy.mjs:42` | 待提单 |
| 5 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由 MISS | `tools.mjs:2027-2043` | 待提单 |

### 根因详情

#### #1 D2-4（P0）凭证脱敏遗漏小写 ak=/sk= （红线用例）

- **期望**：`redactSecrets('ak=ABC...XYZ sk=AbC...6789 securityToken=abc.def.ghi')` 应返回全部 masked 的字符串，不含原始 AK/SK 明文。
- **实际**：返回 `ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=<redacted>` —— AK、SK 明文完整泄露。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` —— 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，缺少 `i` 标志（case-insensitive）；第 42 行的通用正则虽有 `i` 标志但不含 `ak`/`sk` 单独形式，导致小写 `ak=`/`sk=` 无人脱敏。
- **证据**：`evidence/D2-4/stdout.log`

#### #2 D4-3（P0）KMS DecryptData 明文 secret API 未拦截（红线用例）

- **期望**：`classifyTextCommand('hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx')` 应返回 `decision: "deny"`，因 DecryptData 返回明文密钥，与直接读 secret 等价。
- **实际**：返回 `{decision: "allow", risk: "unknown_read", reason: "Command does not match a known write or secret operation"}` —— 解密数据 API 未被拦截。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` —— `blockedSecretOperations` 列表为 `["ShowSecret", "ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，缺少 `DecryptData`；`safety-policy.mjs:257` 的次级正则 `secret[_-]?string|secret[_-]?binary|showsecret|...` 也不含 `decryptdata`/`decrypt`，故 KMS DecryptData 双重漏网。
- **证据**：`evidence/D4-3/stdout.log`

#### #3 D4-16（P0）命令包裹穿透 — $() 残留尾括号致 operation 名失配（红线用例）

- **期望**：`classifyTextCommand('$(hcloud KMS DecryptData)')` 应返回 `decision: "deny"`。
- **实际**：返回 `{decision: "allow", operation: "DecryptData)"}` —— `operation` 多了一个 `)`，导致与 `blockedSecretOperations` 精确匹配失败；同时 `KMS DecryptData` 本身未在 blocked 列表（见 #2），双重缺陷叠加。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:500` —— `extractHcloudSubcommand` 中 `return t.slice(hcloudIndex)` 从 hcloud 关键字切到字符串末尾，未剥离 `$(...)` 的尾 `)`；`splitSimpleCommand` 仅分词不剥括号，导致 `operation = "DecryptData)"`。
- **证据**：`evidence/D4-16/stdout.log`

#### #4 D4-25（P2）Authorization Bearer token 仅替换首词，token 值残留

- **期望**：`redactSecrets('Authorization: Bearer abc123 token=xyz.ak.sk')` 应整体替换 Authorization 值为 `<redacted>`，不残留 `abc123`。
- **实际**：返回 `Authorization: <redacted> abc123 token=<redacted>` —— `abc123`（Bearer token 值）明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` —— 正则值捕获组 `[^\s,;]+` 只取到第一个非空白 token（`Bearer`），之后的 `abc123` 不在匹配范围内。
- **证据**：`evidence/D4-25/stdout.log`

#### #5 EXP-E01（P1）serviceCatalog 未识别「云主机」中文同义词

- **期望**：`huaweicloud_service_catalog({intent: '帮我查一下我账号在华北北京四有哪些云主机'})` 应命中 ECS 路由。
- **实际**：返回 `recommendedServices: ["Run hcloud --help to list available services."]`（未命中 ECS）；eval harness 判 MISS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2027-2043` —— ECS 路由的 keywords 数组含 `'云服务器'`、`'服务器'`、`'虚拟机'`，但缺少 `'云主机'`。
- **证据**：`evidence/EXP-E01/stdout.log`；`evidence/eval-run-latest.csv`

---

## 五、未执行用例与原因

无未执行用例。全部 146 条用例均已执行并回填。

---

## 六、安全与红线合规

- [x] **凭证泄漏事件**：D2-4 测出小写 `ak=`/`sk=` 脱敏遗漏（P0 缺陷 #1），已如实标 FAIL 附根因。
- [x] **写操作误判 read-only**：D4-5 / D4-9 / D4-15 / D4-16 均真实构造攻击输入测试。D4-16 测出 `$(hcloud KMS DecryptData)` 穿透（P0 缺陷 #3），已如实标 FAIL。
- [x] **红线（I 类）违规**：0 次违规。红线用例（D2-4 小写 ak= 脱敏 / D4-3 KMS DecryptData 拦截 / D4-2 env·bash 穿透 / D4-16 命令包裹穿透）均真实构造攻击输入去测，测出问题如实标 FAIL 附根因。
- [x] **脱敏复核**：D2-4 / D4-25 标 FAIL（脱敏不完整），D2-11（STS token 脱敏）/ D4-1（凭证文件读拦截）/ D4-2（env 打印拦截）PASS。

### 红线用例具体执行方式与实际返回

| 用例 | 执行方式 | 实际返回 | 结论 |
|---|---|---|---|
| D2-4 | 直调 `redactSecrets('ak=...sk=...securityToken=...')`，对返回字符串做正则 leak 检测 | AK/SK 明文残留，仅 securityToken masked | FAIL（根因 #1） |
| D4-3 | 直调 `classifyTextCommand('hcloud KMS DecryptData ...')` 等 4 条 secret API 命令，检查 decision | KMS DecryptData 返回 allow（3/4 deny，1/4 漏网） | FAIL（根因 #2） |
| D4-2 | 直调 `classifyTextCommand` 对 6 条 env 打印命令（printenv/echo/env\|grep/Get-ChildItem Env:） | 6/6 全 deny | PASS |
| D4-16 | 直调 `classifyTextCommand` 对 7 条 shell 包裹命令（bash -c/eval/$()/powershell -c） | 6/7 deny，`$(hcloud KMS DecryptData)` 穿透 allow | FAIL（根因 #3） |

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 0（只读 NovaListServersDetails） | N/A | N/A |
| VPC | 0（只读 ListVpcs） | N/A | N/A |
| OBS | 0（只读 ls） | N/A | N/A |
| RDS/CCE/DDS/DCS/DMS/DEW/CBR/SMN/CTS/CES | 0（只读 list） | N/A | N/A |
| IAM | 0（只读 KeystoneListUsers） | N/A | N/A |

> 本次测试全部为只读调用（list_operations + plan + real-cloud list），未创建任何云资源，无需销毁/归零。

---

## 八、遗留与建议

1. **D2-4 修复建议**：`safety-policy.mjs:45` 正则加 `i` 标志：`/((?:AK|SK)\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi`，或在第 42 行通用正则的 key 列表加入 `ak`/`sk`。
2. **D4-3 修复建议**：`policy.json:26` `blockedSecretOperations` 加入 `"DecryptData"`；`safety-policy.mjs:257` 次级正则加入 `decryptdata|decrypt`。
3. **D4-16 修复建议**：`extractHcloudSubcommand` 返回前剥离子命令末尾的 shell 元字符 `)`/`;`/`&`/`|`。
4. **D4-25 修复建议**：`safety-policy.mjs:42` Authorization 的值捕获组改为 `([^\n,;]+)`（捕获到行尾），或单独处理 `Authorization: <scheme> <token>` 格式。
5. **EXP-E01 修复建议**：`tools.mjs` ECS keywords 加入 `'云主机'`。
6. 5 个缺陷合并为 1 张缺陷单提交至源码仓库 `huaweicloud/huaweicloud-devkit`。
