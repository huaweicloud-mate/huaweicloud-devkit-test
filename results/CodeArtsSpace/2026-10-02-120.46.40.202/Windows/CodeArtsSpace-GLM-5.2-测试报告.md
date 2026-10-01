# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-02 05:12:00（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-02-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1`（gitHead `ffd7b474`） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：批量探针直调（`batch-run-probes.mjs` 驱动 141 个 `evidence/<case-id>/probe.mjs`），源码级直调 `safety-policy.mjs`/`tools.mjs` 函数 + MCP stdio 真机调用，证据落盘 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `133 / 8 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `94.3%` |
| P0 / P1 / P2 新增缺陷 | `4 / 4 / 0` |
| 红线（I 类）违规 | `0`（真云用例无资源泄漏，凭证未落盘） |
| 资源释放 | `N/A`（本批用例为源码级/安全策略级，无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `95` | 有证据且通过 PASS 门禁 |
| FAIL | `7` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

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
| 1 | P0 | `D2-11` | D2认证 | STS get-token 未被拦截 | `safety/rules/cloud-risk-rules.json:94` | 待提单 |
| 2 | P1 | `D2-16` | D2认证 | configure import 未被拦截 | `safety/policy.json:25` | 待提单 |
| 3 | P0 | `D2-4` | D2认证 | 小写 ak=/sk= 未脱敏 | `safety-policy.mjs:45` | 待提单 |
| 4 | P0 | `D4-2` | D4安全 | 非HW前缀凭证env打印未拦截 | `safety-policy.mjs` 凭证env规则 | 待提单 |
| 5 | P0 | `D4-3` | D4安全 | CSMS/KMS 密钥操作未拦截 | `safety/policy.json:26` | 待提单 |
| 6 | P1 | `D4-4` | D4安全 | 非HW前缀 echo 凭证未拦截 | `safety-policy.mjs` 凭证打印规则 | 待提单 |
| 7 | P1 | `D4-24` | D4安全 | access_token 未脱敏 | `safety-policy.mjs:25` | 待提单 |
| 8 | P1 | `EXP-E01` | D10评测 | serviceCatalog "云主机"路由MISS | `tools.mjs:1970-1983` | 待提单 |

### 根因详情

#### #1 D2-11【P0】STS get-token 未被安全规则拦截
- **期望**：`sts get-token` → `decision=deny`（临时凭证获取属敏感操作）
- **实际**：`decision=allow, risk=read_only`
- **根因**：`safety/rules/cloud-risk-rules.json:94` — 正则 `hcloud\s+STS\s+(AssumeAgency|GetCallerIdentity|GetTemporaryCredential)\b` 未覆盖 `sts get-token`；severity 为 `warn` 非 `deny`
- **证据**：`evidence/D2-11/stdout.log`

#### #2 D2-16【P1】configure import 导入凭证文件未被拦截
- **期望**：`configure import --file creds.json` → `decision=deny`
- **实际**：`decision=allow, risk=unknown_read`
- **根因**：`safety/policy.json:25` — `blockedConfigureSubcommands` 缺少 `"import"`
- **证据**：`evidence/D2-16/stdout.log`

#### #3 D2-4【P0】小写 ak=/sk= 凭证未被脱敏
- **期望**：`redactString("ak=AKIDxxx sk=Secretxxx")` → `ak=<redacted> sk=<redacted>`
- **实际**：`ak=AKIDxxx sk=Secretxxx`（明文泄漏）
- **根因**：`safety-policy.mjs:45` — 正则 `/(AK|SK)\s*[:=]\s*.../g` 缺少 `i` 标志
- **证据**：`evidence/D2-4/stdout.log`

#### #4 D4-2【P0】非HW前缀凭证环境变量打印未被拦截
- **期望**：所有凭证环境变量打印 → `decision=deny`
- **实际**：第三条命令 `decision=allow, risk=not_huaweicloud`
- **根因**：`safety-policy.mjs` 凭证 env 打印规则仅匹配 HW 特定前缀
- **证据**：`evidence/D4-2/stdout.log`

#### #5 D4-3【P0】CSMS/KMS 密钥服务操作未被拦截
- **期望**：`csms show-secret`/`kms decrypt-data` → `decision=deny`
- **实际**：全部 `decision=allow`
- **根因**：`safety/policy.json:26` — `blockedSecretOperations` 仅覆盖 PascalCase，缺 CLI 小写形式与 `decrypt-data`
- **证据**：`evidence/D4-3/stdout.log`

#### #6 D4-4【P1】非HW前缀 echo 凭证未被拦截
- **期望**：`echo $ACCESS_KEY` 等凭证打印 → `decision=deny`
- **实际**：`decision=allow, risk=not_huaweicloud`
- **根因**：`safety-policy.mjs` 凭证打印拦截仅匹配 HW 特定变量名
- **证据**：`evidence/D4-4/stdout.log`

#### #7 D4-24【P1】access_token 字段未被脱敏
- **期望**：`redactSecrets({ access_token: "accxxx" })` → `{ access_token: "<redacted>" }`
- **实际**：`{ access_token: "accxxx" }`（明文泄漏）
- **根因**：`safety-policy.mjs:25` — `isSecretKeyName` 正则不匹配 `accesstoken`；`policy.json:11` 模式 `token` 经 `^(token)$` 锚定不匹配 `access_token`
- **证据**：`evidence/D4-24/stdout.log`

#### #8 EXP-E01【P1】serviceCatalog 中文意图"云主机"路由未命中
- **期望**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` → 命中 ECS
- **实际**：`MISS`，输出 "Run hcloud --help to list available services."
- **根因**：`tools.mjs:1970-1983` — ECS 关键词列表缺少 `"云主机"`
- **证据**：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

无未执行用例。全部 141 条用例均已执行并回填（NOT_RUN=0, BLOCKED=0）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：发现 3 项凭证脱敏缺陷（D2-4 小写 ak/sk、D4-24 access_token、D4-3 密钥服务操作未拦截），已记入 FINDINGS.md 待提单
- [x] 写操作误判 read-only：发现 2 项安全策略误放行（D2-11 STS get-token、D2-16 configure import），已记入 FINDINGS.md
- [x] 红线（I 类）违规：0 项（真云用例无资源泄漏，探针未落盘真实凭证）
- [x] 脱敏复核：发现 3 项脱敏缺陷，根因已定位到 `safety-policy.mjs` 正则/`policy.json` 模式

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS 等 | 0 | 0 | N/A（本批为源码级/安全策略级探针，无真云资源创建） |

---

## 八、遗留与建议

- **P0 缺陷（4 项）**：D2-11/D2-4/D4-2/D4-3 涉及凭证安全，建议优先修复 `safety-policy.mjs` 正则大小写敏感问题 + `policy.json` 补全 `blockedConfigureSubcommands`/`blockedSecretOperations` + `cloud-risk-rules.json` STS 规则覆盖面
- **P1 缺陷（4 项）**：D2-16/D4-4/D4-24/EXP-E01 涉及安全策略覆盖面与 serviceCatalog 路由，建议补全关键词与脱敏模式
- **serviceCatalog 路由**：建议补充"云主机"等华为云控制台常用术语到 ECS 关键词列表
- **统一提单**：8 项缺陷已合并写入 FINDINGS.md，将通过 `file_issue.py` 统一提单到源码仓库 `huaweicloud/huaweicloud-devkit`
