# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-11-02 05:10:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-11-02-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（5 项 FAIL：3 P0 + 1 P1 + 1 P2；P0 存在缺陷不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows Server 2022 Standard (MINGW64_NT-10.0-20348 x86_64)` |
| Node / npm / Python | `Node v22.22.2 / npm 10 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.13-next.0`（npm @next，gitHead `47170d1f`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已配置 / doctor 全通过` |
| 真云凭证 | `cn-north-4（AKSK hw018619646 / 只读子账号 test001 已就绪）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 107 / 展开级 39 / 追踪表 216 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真云 hcloud CLI list/plan，决策/结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 107 + 展开级 39 = 146 |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `141 / 5 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `96.6%`（141/146） |
| P0 / P1 / P2 新增缺陷 | `3 / 1 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本轮真云仅只读 list_operations + plan，未创建资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 103 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | 不符预期，根因见缺陷清单（D2-4 / D4-3 / D4-16 / D4-25） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 serviceCatalog 路由未命中 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 小写 `ak=`/`sk=` 凭证脱敏漏网 | `redactSecrets('ak=...XYZ sk=...0123456789 securityToken=...')` 返回不含 `...XYZ` 和 `...0123456789` | AK/SK 明文残留 | `plugins/huaweicloud-core/src/safety-policy.mjs:45` | P | 待提单 |
| 2 | P0 | `D4-3` | `hcloud KMS DecryptData` 未拦截 | `classifyTextCommand('hcloud KMS DecryptData ...')` 返回 `decision` ∈ {`deny`,`warn`} | `decision='allow'` | `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` | P | 待提单 |
| 3 | P0 | `D4-16` | `$(hcloud KMS DecryptData)` 命令包裹穿透 | `classifyTextCommand('$(hcloud KMS DecryptData)')` 返回 `decision='deny'` | `decision='allow'`（其余 6 条包裹攻击均 deny） | `cloud-risk-rules.json`（与 #2 同源） | P | 待提单 |
| 4 | P1 | `EXP-E01` | serviceCatalog 路由未命中"云主机" | `serviceCatalog('...有哪些云主机')` 返回 `recommendedServices` 含 `"ECS"` | MISS（回退到 `Run hcloud --help`） | `plugins/huaweicloud-core/src/tools.mjs:2192-2208`（ECS routeMap 缺 `云主机` 同义词） | P | 待提单 |
| 5 | P2 | `D4-25` | 错误消息中 Bearer token 值未脱敏 | `redactSecrets('Authorization: Bearer abc123 token=xyz.ak.sk')` 不含 `abc123` | `abc123` 残留（token 值未被捕获组覆盖） | `plugins/huaweicloud-core/src/safety-policy.mjs:42` | P | 待提单 |

### 根因详情

**#1 [P0] D2-4 小写 `ak=`/`sk=` 凭证脱敏漏网**
- 期望：`redactSecrets('ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi')` → AK/SK 被替换为 `<redacted>`
- 实际：`ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=<redacted>`（仅 token 脱敏，AK/SK 明文残留）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45`
  ```javascript
  .replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, '$1=<redacted>')
  ```
  正则 `(AK|SK)` 仅匹配大写，未加 `i` 标志，导致 `ak=`/`sk=` 小写格式绕过脱敏。
- 复现：`node -e "import('./hdk/plugins/huaweicloud-core/src/safety-policy.mjs').then(m=>console.log(m.redactSecrets('ak=ABCXYZ sk=SK123')))"` → `ak=ABCXYZ sk=SK123`
- 证据：`evidence/D2-4/stdout.log`（akLeak=true, skLeak=true）

**#2 [P0] D4-3 KMS DecryptData 未拦截**
- 期望：`classifyTextCommand('hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx')` → `decision` ∈ {`deny`, `warn`}
- 实际：`{"decision":"allow","risk":"unknown_read","reason":"Command does not match a known write or secret operation..."}`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` —— deny 规则集已覆盖 `CSMS ShowSecretVersion`/`GetSecretValue`/`KMS ShowSecret`（均 `decision=deny, risk=secret`），但 `KMS DecryptData`（返回明文密钥/二进制 secret，语义等价于直接读 secret）未列入 deny 规则。
- 影响：明文密钥解密操作可绕过安全 hook 进入 agent 上下文。
- 证据：`evidence/D4-3/stdout.log`（decision=allow）

**#3 [P0] D4-16 `$(hcloud KMS DecryptData)` 命令包裹穿透**
- 期望：`classifyTextCommand('$(hcloud KMS DecryptData)')` → `decision='deny'`
- 实际：`{"decision":"allow","risk":"unknown_read"}`（同批 7 条包裹攻击中其余 6 条 `bash -c`/`sh -c`/`eval`/`powershell -c` 等均 `deny`，仅 `$(...)` 包裹 KMS DecryptData 穿透）
- 根因：与 #2 同源——`extractInnerCommand` 正确从 `$(...)` 提取出 `hcloud KMS DecryptData`（见 `safety-policy.mjs:440`），但内层命令因 `cloud-risk-rules.json` 缺 KMS DecryptData deny 规则仍判 allow。
- 证据：`evidence/D4-16/stdout.log`（`$(hcloud KMS DecryptData)` decision=allow；其余 6 条均 deny）

**#4 [P1] EXP-E01 serviceCatalog 路由未命中"云主机"**
- 期望：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 含 `"ECS"`
- 实际：verdict=MISS（回退到 `Run hcloud --help to list available services.`）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2192-2208` —— ECS routeMap keywords 包含 `'ECS'/'云服务器'/'弹性云服务器'/'EulerOS'/'CentOS'/'Ubuntu'` 等，但缺少 `'云主机'` 同义词（"云主机"是华为云控制台常用说法）。
- 证据：`evidence/EXP-E01/stdout.log`（verdict=MISS）；本轮 eval harness 15 条中 13 HIT / 1 MISS / 1 N/A，准确率 92.9%

**#5 [P2] D4-25 错误消息中 Bearer token 值未脱敏**
- 期望：`redactSecrets('Authorization: Bearer abc123 token=xyz.ak.sk')` 不含 `abc123`
- 实际：`"Authorization: <redacted> abc123 token=<redacted>"`（`abc123` 残留）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:42`
  ```javascript
  .replace(/((?:...|authorization|...)\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1<redacted>')
  ```
  `authorization\s*[:=]\s*` 匹配 `Authorization: `，捕获组 `([^\s,;]+)` 匹配到 `Bearer`（第一个非空白 token）即停，`abc123`（跟在 `Bearer` 之后的真正 token 值）不在脱敏范围。需扩展规则以处理 `Authorization: Bearer <token>` 格式（OAuth2 标准 bearer scheme）。
- 证据：`evidence/D4-25/stdout.log`（redacted 结果仍含 `abc123`）

---

## 五、未执行用例与原因

无。本轮 146 条用例全部已执行（设计级 107 + 展开级 39），无 NOT_RUN / BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（测试用脱敏数据，无真实凭证进证据）
- [x] 写操作误判 read-only：`0`（D4-5/D4-6/D4-7/D4-8 全 PASS，write/delete 均 deny/warn）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D2-4/D4-25 的"泄漏"用的是测试假数据 `ABCDEFGHijkl0123456789XYZ`/`abc123`，非真实凭证）

### 红线用例执行说明（按防复发硬约束 ④，全 PASS 亦须写明）

本轮 5 项 FAIL 均为红线相关用例真实执行后发现的缺陷，逐条说明执行方式与实际返回：

1. **D2-4（小写 ak= 脱敏）**：真实构造攻击输入 `'ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi'`，直调 `redactSecrets()`，断言返回值不含 AK/SK 明文。实测 `akLeak=true, skLeak=true` → 如实标 FAIL，根因 `safety-policy.mjs:45` 正则缺 `i` 标志。

2. **D4-3（KMS DecryptData 拦截）**：真实构造攻击命令 `hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx`，直调 `classifyTextCommand()`，断言 `decision` ∈ {`deny`,`warn`}。实测 `decision='allow'` → 标 FAIL，根因 `cloud-risk-rules.json` 缺 KMS DecryptData deny 规则。

3. **D4-2（env·bash 穿透）**：真实构造 6 条攻击输入（`printenv HUAWEICLOUD_SECRET_ACCESS_KEY` / `echo $HW_SECRET_KEY` / `printenv HW_ACCESS_KEY` / `env | grep HWC_` / `echo $HUAWEICLOUD_SECRET_ACCESS_KEY` / `Get-ChildItem Env: | Where-Object Name -match "HUAWEICLOUD"`），直调 `classifyTextCommand()`，断言全部 `deny`。实测全部 `decision='deny', risk='credential'` → PASS（红线用例通过，无缺陷）。另补测 `bash -c "env | grep HWC_"` 同样 `deny`。

4. **D4-16（命令包裹穿透）**：真实构造 7 条包裹攻击（`bash -c "cat ~/.hcloud/credentials.json"` / `sh -c "printenv HW_SECRET_KEY"` / `eval "hcloud ECS DeleteServer"` / `bash -c "hcloud IAM DeleteUser"` / `$(hcloud KMS DecryptData)` / `sh -c "env | grep HWC_"` / `powershell -c "Get-Content ~/.huaweicloud/credentials.json"`），直调 `classifyTextCommand()`，断言全部 `deny`。实测 6 条 `deny`，仅 `$(hcloud KMS DecryptData)` 穿透为 `allow` → 标 FAIL（与 D4-3 同根因）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / VPC / RDS / CCE / OBS 等真云资源 | 否 | — | 本轮真云仅只读 `list_operations` + `plan`（22 服务 EXP-C4-* + D3-C1..C7 + D3-S1..S8），未创建任何资源，无需归零 |

> 真云用例（D3-C1..C7、D3-S1..S8、EXP-C4-01..22）全部走只读路径（list_operations + plan），未触发创建类操作；D3-C5 `plan --dryrun` 验证请求不执行。无资源残留。

---

## 八、遗留与建议

- **待提单缺陷 5 项**：D2-4 / D4-3 / D4-16 / EXP-E01 / D4-25，已合并至 `FINDINGS.md`，将通过 `file_issue.py` 统一提 1 张合并单到 `huaweicloud/huaweicloud-devkit`。
- **建议**：
  1. `safety-policy.mjs:45` 正则加 `i` 标志（最小改动覆盖小写 ak=/sk=）。
  2. `cloud-risk-rules.json` 新增 `KMS DecryptData` deny 规则（secret 类）。
  3. `tools.mjs` ECS routeMap 补 `'云主机'` 同义词。
  4. `safety-policy.mjs:42` authorization 正则扩展处理 `Bearer <token>` scheme。
