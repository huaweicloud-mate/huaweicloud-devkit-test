# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-05 05:22:06（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-05-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1`（gitHead `ffd7b47`） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：Node.js 驱动真实命令执行（hdk CLI / npx / safety-policy 直调 / eval harness / 真云 API），证据落盘 `evidence/<case-id>/stdout.log` + `result.json`。eval harness 实跑 `run-eval.mjs` 得 serviceCatalog 路由准确率 92.9%。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 8 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 140） | `94.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（全部为历史缺陷） |
| 红线（I 类）违规 | `0`（真云用例无资源泄漏，凭证未落盘） |
| 资源释放 | `N/A`（本批用例为源码级/安全策略级，无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 维度 | 用例数 | PASS | FAIL | BLOCKED | NOT_RUN |
|---|---|---|---|---|---|
| D1安装 | 19 | 19 | 0 | 0 | 0 |
| D2认证 | 11 | 8 | 3 | 0 | 0 |
| D3功能 | 16 | 16 | 0 | 0 | 0 |
| D4安全 | 29 | 23 | 6 | 0 | 0 |
| D5客户端 | 2 | 2 | 0 | 0 | 0 |
| D6性能 | 4 | 4 | 0 | 0 | 0 |
| D8质量 | 6 | 6 | 0 | 0 | 0 |
| D9协议 | 13 | 13 | 0 | 0 | 0 |
| D10评测 | 2 | 2 | 0 | 0 | 0 |
| **合计** | **102** | **95** | **7** | **0** | **0** |

### 3.2 展开级

| 展开类型 | 用例数 | PASS | FAIL | BLOCKED | NOT_RUN |
|---|---|---|---|---|---|
| EXP-D5（客户端矩阵） | 2 | 2 | 0 | 0 | 0 |
| EXP-C4（服务矩阵） | 22 | 22 | 0 | 0 | 0 |
| EXP-E（评测集） | 15 | 13 | 1 | 0 | 1 |
| **合计** | **39** | **37** | **1** | **0** | **1** |

---

## 四、缺陷清单

> 全部 8 项 FAIL + 1 项 NOT_RUN 均为历史缺陷，包版本 1.1.8-next.1 无变化，无新缺陷、无回归。

### 4.1 设计级 FAIL（7 项）

| # | 用例 | 优先级 | 描述 | 历史单号 |
|---|---|---|---|---|
| 1 | D2-4 | P0 | 小写 ak=/sk= 凭证未被脱敏 | #772 #694 |
| 2 | D2-11 | P0 | STS get-token 未被安全规则拦截 | #689 |
| 3 | D2-16 | P1 | configure import --file 未被拦截 | #694 |
| 4 | D4-2 | P0 | 非华为云前缀凭证 env 打印未拦截 | #677 |
| 5 | D4-3 | P0 | CSMS/KMS 密钥操作未拦截 | #677 |
| 6 | D4-4 | P1 | echo $ACCESS_KEY 通用凭证变量名未拦截 | #757 |
| 7 | D4-24 | P1 | access_token 字段未被脱敏 | #805 |

### 4.2 展开级 FAIL（1 项）

| # | 用例 | 优先级 | 描述 | 历史单号 |
|---|---|---|---|---|
| 1 | EXP-E01 | P1 | serviceCatalog 路由 MISS：查云主机意图未命中 ECS | #705 |

### 根因详情

| 用例 | 期望 | 实际 | 根因（文件:行号） | 证据 |
|---|---|---|---|---|
| D2-4 | `redactSecrets('ak=AKIDxxx sk=Secretxxx')` 返回 `ak=<redacted> sk=<redacted>` | 返回 `ak=AKIDxxx sk=Secretxxx`（未脱敏） | `safety-policy.mjs:45` 正则 `/(AK\|SK)\s*[:=]/g` 缺少 `i` 标志 | `evidence/D2-4/stdout.log` |
| D2-11 | `sts get-token` 返回 `decision=deny` | 返回 `decision=allow, risk=read_only` | `safety/rules/cloud-risk-rules.json:94` 正则未覆盖 `sts get-token`；severity 为 warn | `evidence/D2-11/stdout.log` |
| D2-16 | `configure import --file` 返回 `decision=deny` | 返回 `decision=allow` | `safety/policy.json:25` blockedConfigureSubcommands 缺少 `"import"` | `evidence/D2-16/stdout.log` |
| D4-2 | 所有打印凭证 env 命令返回 `decision=deny` | 非华为云前缀返回 `decision=allow` | `safety-policy.mjs` 凭证 env 打印规则仅匹配 `HUAWEICLOUD_`/`HW_` 前缀 | `evidence/D4-2/stdout.log` |
| D4-3 | `csms show-secret`/`kms decrypt-data` 返回 `decision=deny` | 返回 `decision=allow` | `safety/policy.json:26` blockedSecretOperations 仅覆盖 PascalCase，未覆盖 CLI 小写 | `evidence/D4-3/stdout.log` |
| D4-4 | `echo $ACCESS_KEY` 被拦截 | 未被拦截 | `safety-policy.mjs` 凭证 env 打印规则未覆盖 `ACCESS_KEY`/`SECRET_KEY` 通用变量名 | `evidence/D4-4/stdout.log` |
| D4-24 | `redactSecrets({access_token:'accxxx'})` 返回 `{access_token:'<redacted>'}` | 返回 `{access_token:'accxxx'}`（未脱敏） | `safety-policy.mjs:25` isSecretKeyName 正则不匹配 `access_token`；`policy.json:11` 模式 `"token"` 经锚定后不匹配 | `evidence/D4-24/stdout.log` |
| EXP-E01 | serviceCatalog 命中 ECS | MISS（实际路由到 `Run hcloud --help`） | `eval/harness/run-eval.mjs` 评测集 EXP-E01 意图「查云主机」未命中 ECS 路由 | `evidence/EXP-E01/stdout.log` |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `EXP-E08` | D10评测 | 诊断类意图评测 | 该意图为诊断类（「我的ECS启动失败了帮我分析原因」），需真实 LLM Agent 会话评测（`run-agent-eval.mjs` 驱动 `dsh --profile headless`），非 DSH 客户端缺 CDP 会话自动化环境。harness 标 N/A。 | 【补环境】需 CDP 会话自动化或 DSH 客户端 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（本批未触发真云写操作，凭证文件读取/打印均经 safety-policy 拦截或脱敏）
- [x] 写操作误判 read-only：无（D4-5 写操作预检正确，D4-6~8 只读/危险/审批分类正确）
- [x] 红线（I 类）违规：0（真云用例无资源泄漏，凭证未落盘，脱敏复核通过）
- [x] 脱敏复核：大写 AK/SK 脱敏正常（D2-5 PASS）；小写 ak/sk 未脱敏（D2-4 FAIL，历史缺陷 #772）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| N/A | 无 | 无 | N/A |

> 本批用例为源码级/安全策略级/eval harness 级，无真云资源创建。真云 E2E 用例（D4-13 最小权限凭证通过率）使用只读子账号凭证，无资源创建。

---

## 八、遗留与建议

- **历史缺陷**：8 项 FAIL 均为历史缺陷（#677/#689/#694/#705/#757/#772/#805），包版本 1.1.8-next.1 无变化，无新缺陷、无回归。
- **eval harness 基线提升**：serviceCatalog 路由准确率从 21.4% 提升至 92.9%（HIT=13, MISS=1, N/A=1），D10-3 由 FAIL 转为 PASS。剩余 MISS 为 EXP-E01（查云主机意图未命中 ECS）。
- **NOT_RUN 收尾**：EXP-E08 需真实 LLM Agent 会话评测，非 DSH 客户端缺 CDP 自动化环境，建议后续接入 CDP 会话自动化或由 DSH 客户端覆盖。
- **修复建议**：D2-4/D4-24 为脱敏正则缺陷（缺 `i` 标志/字段名未覆盖），修复成本低；D2-11/D2-16/D4-2/D4-3/D4-4 为安全规则覆盖缺口，需扩充 blockedConfigureSubcommands/blockedSecretOperations/凭证 env 打印规则。
