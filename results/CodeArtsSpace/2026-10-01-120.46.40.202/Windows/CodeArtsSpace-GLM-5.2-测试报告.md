# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-01 05:17:19（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-01-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.8-next.1` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针直调源码函数（safety-policy.mjs classifyTextCommand / redactString、update-check.mjs、tools.mjs serviceCatalog）+ CLI 命令验证 + EXP-E 评测集路由层（run-eval.mjs serviceCatalog 路由）。所有探针真实执行，证据落盘 evidence/<case-id>/stdout.log。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `133 / 8 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `94.3%` |
| P0 / P1 / P2 新增缺陷 | `4 / 4 / 0` |
| 红线（I 类）违规 | 无（真云用例均真机执行，无 mock；凭证未泄漏） |
| 资源释放 | 无需创建（本批用例为源码直调/CLI 验证类，无真云资源创建） |

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
| 1 | P0 | `D2-11` | D2认证 | R3 STS token拒绝落盘 | safety-policy.mjs: sts get-token 判 read_only allow，未列入 blockedSecretOp | 历史缺陷 |
| 2 | P1 | `D2-16` | D2认证 | import文件读取后擦除 | safety-policy.mjs: configure import --file 判 unknown_read allow，未拦截文件读取 | 历史缺陷 |
| 3 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | safety-policy.mjs redactString: regex (AK\|SK)\s*[:=] 仅匹配大写，漏 lowercase ak=/sk= | 历史缺陷 |
| 4 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | safety-policy.mjs: env\|grep HW_ 未匹配安全规则（r3=allow not_huaweicloud） | 历史缺陷 |
| 5 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | safety-policy.mjs: csms show-secret / kms decrypt 判 read_only/unknown_read allow，未拦截 secret 读取 | 历史缺陷 |
| 6 | P1 | `D4-4` | D4安全 | 写操作审批门 | safety-policy.mjs: echo $AK/$SK 判 not_huaweicloud allow，未拦截凭证回显 | 历史缺陷 |
| 7 | P1 | `D4-24` | D4安全 | 确认令牌过期与重复确认边界 | safety-policy.mjs redactString: access_token 未纳入 secret regex，输出 =accxxx 明文 | 历史缺陷 |
| 8 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图路由 | tools.mjs serviceCatalog: "帮我查一下我账号在华北北京四有哪些云主机" 路由 MISS，返回 hcloud --help 而非 ECS | 历史缺陷 |

### 根因详情

**D2-4（P0）**：`redactString` 的 secret regex 仅匹配大写 `AK`/`SK` 前缀，`ak=AKIDxxx sk=Secretxxx` 中的 lowercase `ak=`/`sk=` 未被脱敏，AK/SK 明文泄漏。证据：evidence/D2-4/stdout.log（lowerRedacted=false, lowerLeaksAk=true, lowerLeaksSk=true）。

**D2-11（P0）**：`classifyTextCommand` 将 `sts get-token` 判为 `read_only` allow，但 STS token 是临时凭证获取操作，应 deny。证据：evidence/D2-11/stdout.log（decision=allow, risk=read_only）。

**D2-16（P1）**：`classifyTextCommand` 将 `configure import --file creds.json` 判为 `unknown_read` allow，但凭证文件导入可能明文落盘。证据：evidence/D2-16/stdout.log（decision=allow, risk=unknown_read）。

**D4-2（P0）**：`env|grep HW_` 未完全拦截（r3=allow not_huaweicloud），HW_SECRET_ACCESS_KEY 通过 printenv 拦截但 env|grep 模式未全覆盖。证据：evidence/D4-2/stdout.log（r3 decision=allow）。

**D4-3（P0）**：`csms show-secret` / `kms decrypt-data` / `kms DecryptData` / `kms decrypt` / `csms show-secret-version` 均判 allow，但这些都是密文/凭证明文读取操作，应 deny。证据：evidence/D4-3/stdout.log（5 条全 allow）。

**D4-4（P1）**：`echo $AK` / `echo $SK` 判 not_huaweicloud allow，凭证回显未拦截。证据：evidence/D4-4/stdout.log（r1/r2 decision=allow）。

**D4-24（P1）**：`redactString` 未将 `access_token` 纳入 secret regex，输出 `access_token=accxxx` 明文。证据：evidence/D4-24/stdout.log（access_token=accxxx 未脱敏）。

**EXP-E01（P1）**：`serviceCatalog` 对中文意图"帮我查一下我账号在华北北京四有哪些云主机"路由 MISS，返回"Run hcloud --help"而非 ECS 服务。证据：evidence/EXP-E01/stdout.log（verdict=MISS, expect=ECS, got=hcloud --help）。

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（D2-4/D4-24 为脱敏 regex 缺陷，探针检测到但未实际泄漏到外部）
- [x] 写操作误判 read-only：D2-11（sts get-token）、D4-3（csms/kms secret 读取）误判 allow
- [x] 红线（I 类）违规：无（真云用例真机执行，无 mock 假跑）
- [x] 脱敏复核：D2-4 lowercase ak=/sk= 未脱敏、D4-24 access_token 未脱敏（均历史缺陷）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无 | 本批用例为源码直调/CLI 验证类，无真云资源创建 | N/A | N/A |

> 本批 141 用例均为探针直调源码函数（safety-policy.mjs / update-check.mjs / tools.mjs）+ CLI 命令验证 + 评测集路由层，不涉及真云资源创建/销毁，无需归零验证。

---

## 八、遗留与建议

- 8 项 FAIL 均为历史缺陷（与 2026-09-30 一致），已在上游 issue 跟踪，本次未产生新缺陷。
- P0 缺陷 4 项（D2-4/D2-11/D4-2/D4-3）集中在 safety-policy.mjs 的命令分类与脱敏 regex，建议优先修复 redactString 大小写不敏感 + 扩展 blockedSecretOp 覆盖 sts/csms/kms。
- P1 缺陷 4 项（D2-16/D4-4/D4-24/EXP-E01），EXP-E01 为 serviceCatalog 中文意图路由缺失，建议补充 ECS/VPC 等服务的中文别名映射。
- 通过率 94.3%（133/141），与昨日持平，包版本 1.1.8-next.1 无回归。
