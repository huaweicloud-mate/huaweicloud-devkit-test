# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-31 05:07:35（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-31-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` (MINGW64_NT-10.0-20348) |
| 被测版本（SUT） | `1.1.13-next.0`（next 预发布，源码 commit 47170d1f） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调探针（batch-probe.mjs / batch-probe-p1.mjs / batch-probe-p2.mjs / batch-probe-supp.mjs）—— 真调 safety-policy.mjs / risk-rule-engine.mjs / update-check.mjs / credentials.mjs / mcp-protocol.mjs / tools.mjs 导出函数，对真实返回字段断言；真云 E2E（D3-C1/C2/C3/C6/C7、D3-S1~S8、EXP-C4-*）真机调 hcloud CLI list_operations + plan，只读类真调云 API 返回真实 JSON；D4-25 真调 Python huaweicloud-safety.py record_cli_event 验证三键分类；D10 评测集真调 eval/harness/run-eval.mjs serviceCatalog 路由层。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `141 / 5 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `96.6%` |
| P0 / P1 / P2 新增缺陷 | `3 / 1 / 1` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `真云用例均为只读 list/plan，无创建类资源需释放` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `103` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `plugins/huaweicloud-core/src/safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` | 待提单 |
| 4 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` | 待提单 |
| 5 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由未命中"云主机" | `plugins/huaweicloud-core/src/tools.mjs:2192-2208` | 待提单 |

### 根因详情

#### #1 D2-4 凭证脱敏未覆盖小写 ak=/sk= 格式
- **期望**：`redactSecrets('ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi')` 返回值不应包含明文 AK/SK。
- **实际**：返回 `ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=<redacted>` —— AK/SK 明文泄漏，仅 securityToken 被脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` —— `redactString` 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，未覆盖小写 `ak=`/`sk=` 模式。
- **证据**：`evidence/D2-4/stdout.log`（akLeak=true, skLeak=true）

#### #2 D4-3 KMS DecryptData 未被拦截(decision=allow)
- **期望**：`classifyTextCommand('hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx')` 返回 `decision` 应为 `'deny'` 或 `'warn'`。
- **实际**：返回 `decision: 'allow'`，risk=`unknown_read`，reason="Command does not match a known write or secret operation"。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` —— 缺少 `KMS DecryptData` deny 规则（该操作返回明文/二进制 secret，应归入 secret 类拦截）。
- **证据**：`evidence/D4-3/stdout.log`（KMS DecryptData decision=allow；CSMS ShowSecretVersion/KMS ShowSecret/CSMS GetSecretValue 均 deny）

#### #3 D4-16 `$(hcloud KMS DecryptData)` 命令包裹穿透
- **期望**：`classifyTextCommand('$(hcloud KMS DecryptData)')` 返回 `decision` 应为 `'deny'`。
- **实际**：返回 `decision: 'allow'`，risk=`unknown_read` —— 命令替换包裹的内层 `hcloud KMS DecryptData` 未被拦截。其余 6 条包裹攻击（bash -c/sh -c/eval）均 deny。
- **根因**：与 #2 同根因——`cloud-risk-rules.json` 缺少 `KMS DecryptData` deny 规则。`extractInnerCommand` 的 `$(...)` 提取逻辑正确（`safety-policy.mjs:440`），但内层命令仍判 allow。
- **证据**：`evidence/D4-16/stdout.log`（`$(hcloud KMS DecryptData)` decision=allow；其余 6 条包裹攻击均 deny）

#### #4 D4-25 Python hook record_cli_event 将 DeleteServer 误分类为 cli:invoke
- **期望**：`record_cli_event('hcloud ECS DeleteServer --server_ids=xxx')` 应分类为 `cli:write`（只读→cli:read、写→cli:write、其他→cli:invoke）。
- **实际**：分类为 `cli:invoke` —— writeCount=0, invokeCount=1。`WRITE_OPERATION_RE` 正则 `(^|[A-Za-z0-9])(Create|...|Delete|...)\w*` 对 "ECS DeleteServer" 中的 "DeleteServer" 不匹配。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` —— `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(" + "|".join(write_prefixes) + r")\w*", re.I)` —— 交替项 `(^|[A-Za-z0-9])` 要求匹配位置为字符串开头或前一个字符是字母数字；"ECS DeleteServer" 中 "Delete" 前是空格，既非 `^` 也非 `[A-Za-z0-9]`，故不匹配 → is_write=False → event_key=cli:invoke。应为 `(^|[^A-Za-z0-9])` 或 `(^|\s|[^A-Za-z0-9])` 或直接 `\b`。
- **证据**：`evidence/D4-25/stdout.log`（events=[{key:cli:read,...},{key:cli:invoke,value:"hcloud ECS DeleteServer"}]，writeCount=0）

#### #5 EXP-E01 serviceCatalog 路由未命中"云主机"关键词
- **期望**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 应包含 `"ECS"`。
- **实际**：eval harness verdict=MISS —— serviceCatalog 未路由到 ECS 服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2192-2208` —— ECS routeMap keywords 缺少 `'云主机'` 同义词。
- **证据**：`evidence/EXP-E01/stdout.log`（verdict=MISS）

---

## 五、未执行用例与原因

无未执行用例。全部 146 条用例均已执行并回填（P0 21 + P1 56+39 + P2 30 = 107 设计级 + 39 展开级）。

---

## 六、安全与红线合规

- [x] **凭证泄漏事件**：D2-4 检出小写 `ak=`/`sk=` 格式凭证脱敏漏报（P0 FAIL，已记根因，待提单）；D4-25 检出 Python hook 写操作误分类为 cli:invoke（P2 FAIL，已记根因，待提单）。无凭证泄漏到日志的 I 类违规（redactSecrets 对大写 AK/SK 路径正常）。
- [x] **写操作误判 read-only**：D4-3 检出 KMS DecryptData 被误判为 allow（P0 FAIL，已记根因）；D4-16 检出 `$(hcloud KMS DecryptData)` 命令包裹穿透（P0 FAIL，与 D4-3 同根因）。其余写操作（DeleteServer/DeleteUser/DeleteVpc 等）均正确 deny/warn。
- [x] **红线（I 类）违规**：无 I 类违规。所有红线用例（D2-4 小写 ak= 脱敏 / D4-3 kms DecryptData 拦截 / D4-2 env 打印拦截 / D4-16 命令包裹穿透）均已真实构造攻击输入测试，D4-2 env 打印拦截 PASS（所有凭证 env 打印命令均 deny），D4-3/D4-16 检出真实缺陷已如实标 FAIL 附根因。
- [x] **脱敏复核**：D2-4 真调 `redactSecrets` 对 `ak=...sk=...securityToken=...` 字符串脱敏，断言返回值不含明文 AK/SK —— 检出泄漏 FAIL；D4-26 真调 `redactSecrets` 对 `access_key=...secret_key=...` 脱敏 PASS（大写下划线格式正常脱敏）；D2-11 真调 `redactSecrets` 对象形式 securityToken 脱敏 PASS。

### 红线用例执行说明（0 缺陷全 PASS 时需逐条写明，本日有 5 FAIL 故仅列红线用例执行方式）

| 红线用例 | 执行方式 | 实际返回 | 结论 |
|---|---|---|---|
| D2-4 小写 ak= 脱敏 | 真调 `safety.redactSecrets('ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi')` | AK/SK 明文未脱敏，仅 token 脱敏 | FAIL（缺陷 #1） |
| D4-3 kms DecryptData 拦截 | 真调 `safety.classifyTextCommand('hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx')` | decision=allow, risk=unknown_read | FAIL（缺陷 #2） |
| D4-2 env 打印拦截 | 真调 `safety.classifyTextCommand` 对 6 条凭证 env 打印命令（printenv/echo/env grep/Get-ChildItem Env:） | 全部 decision=deny | PASS |
| D4-16 命令包裹穿透 | 真调 `safety.classifyTextCommand` 对 7 条包裹攻击（bash -c/sh -c/eval/$(...)/powershell -c） | `$(hcloud KMS DecryptData)` decision=allow；其余 6 条 deny | FAIL（缺陷 #3） |

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/RDS/CCE | 无创建（本日真云用例均为只读 list/plan） | N/A | N/A |

> 本日真云 E2E 用例（D3-C1/C2/C3/C6/C7、D3-S1~S8、EXP-C4-*）均为只读 list_operations + plan 类，真调 hcloud CLI 返回真实 JSON，无资源创建/销毁。D4-13 最小权限凭证通过率使用只读子账号 test001 临时注入 env 调 hcloud（写操作被 403 拦截），无资源创建。

---

## 八、遗留与建议

1. **D2-4**：`redactString` 正则应增加小写 `ak=`/`sk=` 模式（`/(AK|ak|SK|sk)\s*[:=]\s*.../g` 或加 `re.I`）。
2. **D4-3 / D4-16**：`cloud-risk-rules.json` 应增加 `KMS DecryptData` 到 secret 类 deny 规则（与 CSMS ShowSecret/GetSecretValue 同类）。
3. **D4-25**：`huaweicloud-safety.py:46` 的 `WRITE_OPERATION_RE` 前置字符类 `(^|[A-Za-z0-9])` 应改为 `(^|[^A-Za-z0-9])` 或 `\b`，使空格分隔的 "ECS DeleteServer" 能匹配 "Delete"。
4. **EXP-E01**：ECS routeMap keywords 应增加 `'云主机'` 同义词。
5. **提单**：以上 5 个缺陷合并为 1 张 issue 提交到源码仓库 `huaweicloud/huaweicloud-devkit`。
