# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-09 05:19（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-09-120.46.40.202/Windows/`
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

> **执行方法**：源码级直调 safety-policy.mjs（redactSecrets/classifyHcloudArgs）+ CLI 命令实测（hdk doctor/status/plugins/install-hcloud）+ MCP tools/list 协议探测 + eval harness 路由层（run-eval.mjs serviceCatalog 15 条中文意图）。所有用例证据落盘 `evidence/<case-id>/`（probe.mjs + stdout.log + result.json）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 8 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 140） | `94.3%` |
| P0 / P1 / P2 新增缺陷 | `4 / 4 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `N/A`（本次无真云资源创建） |

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
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | safety-policy.mjs:45 正则 `/(AK\|SK)\s*[:=]/g` 缺少 i 标志 | 待提单 |
| 2 | P0 | `D2-11` | D2认证 | STS get-token 未拦截 | safety/rules/cloud-risk-rules.json:94 正则未覆盖 sts get-token; severity=warn 非 deny | 待提单 |
| 3 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | safety-policy.mjs 凭证 env 打印规则仅匹配 HUAWEICLOUD_/HW_ 前缀 | 待提单 |
| 4 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | safety/policy.json:26 blockedSecretOperations 仅覆盖 PascalCase, 未覆盖 CLI 小写 | 待提单 |
| 5 | P1 | `D2-16` | D2认证 | configure import 未拦截 | safety/policy.json:25 blockedConfigureSubcommands 缺少 "import" | 待提单 |
| 6 | P1 | `D4-4` | D4安全 | 通用凭证变量名未拦截 | safety-policy.mjs 凭证 env 打印规则未覆盖 ACCESS_KEY/SECRET_KEY | 待提单 |
| 7 | P1 | `D4-24` | D4安全 | access_token 未脱敏 | safety-policy.mjs:25 isSecretKeyName 正则不匹配 access_token | 待提单 |
| 8 | P1 | `EXP-E01` | D10评测 | 云主机→ECS 路由未命中 | mcp-server.mjs serviceCatalog 中文关键词未映射到 ECS | 待提单 |

### 根因详情

#### D2-4 凭证脱敏正确性（P0）
- **期望**：`redactSecrets('ak=AKIDxxx sk=Secretxxx')` 应将小写 `ak=`/`sk=` 脱敏为 `<redacted>`
- **实际**：小写 `ak=`/`sk=` 未被脱敏，仅大写 `AK=`/`SK=` 脱敏正常
- **根因**：`safety-policy.mjs:45` 正则 `/(AK|SK)\s*[:=]/g` 缺少 `i` 标志，小写 ak/sk 不匹配
- **证据**：`evidence/D2-4/stdout.log`

#### D2-11 STS get-token 未拦截（P0）
- **期望**：`sts get-token` 应返回 `decision=deny`
- **实际**：返回 `decision=allow`, `risk=read_only`，未拦截临时凭证获取
- **根因**：`safety/rules/cloud-risk-rules.json:94` 正则未覆盖 `sts get-token`; severity 为 `warn` 而非 `deny`
- **证据**：`evidence/D2-11/stdout.log`

#### D4-2 凭证env打印拦截（P0）
- **期望**：所有打印凭证环境变量的命令应返回 `decision=deny`
- **实际**：非华为云前缀 env 打印返回 `decision=allow`, `risk=not_huaweicloud`
- **根因**：`safety-policy.mjs` 凭证 env 打印规则仅匹配 `HUAWEICLOUD_`/`HW_` 前缀，未覆盖非标准前缀
- **证据**：`evidence/D4-2/stdout.log`

#### D4-3 明文secret API拦截（P0）
- **期望**：`csms show-secret`/`kms decrypt-data` 应返回 `decision=deny`
- **实际**：返回 `decision=allow`
- **根因**：`safety/policy.json:26` blockedSecretOperations 仅覆盖 PascalCase，未覆盖 CLI 小写形式
- **证据**：`evidence/D4-3/stdout.log`

#### D2-16 configure import 未拦截（P1）
- **期望**：`configure import --file` 应返回 `decision=deny`
- **实际**：返回 `decision=allow`，未拦截凭证文件导入
- **根因**：`safety/policy.json:25` blockedConfigureSubcommands 缺少 `"import"`
- **证据**：`evidence/D2-16/stdout.log`

#### D4-4 通用凭证变量名未拦截（P1）
- **期望**：`echo $ACCESS_KEY` 应被拦截
- **实际**：通用凭证变量名 `ACCESS_KEY` 未被拦截
- **根因**：`safety-policy.mjs` 凭证 env 打印规则未覆盖 `ACCESS_KEY`/`SECRET_KEY` 通用变量名
- **证据**：`evidence/D4-4/stdout.log`

#### D4-24 access_token 未脱敏（P1）
- **期望**：`redactSecrets({access_token: 'xxx'})` 应返回 `<redacted>`
- **实际**：`access_token` 字段未被脱敏
- **根因**：`safety-policy.mjs:25` isSecretKeyName 正则不匹配 `access_token`; `policy.json:11` 模式 `"token"` 经锚定后不匹配
- **证据**：`evidence/D4-24/stdout.log`

#### EXP-E01 云主机→ECS 路由未命中（P1）
- **期望**：serviceCatalog 应将「帮我查一下我账号在华北北京四有哪些云主机」路由到 ECS
- **实际**：返回通用帮助 `Run hcloud --help to list available services.`，未命中 ECS
- **根因**：`mcp-server.mjs` serviceCatalog 中文关键词「云主机」未映射到 ECS
- **证据**：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `EXP-E08` | D10评测 | ECS启动失败诊断 | 需真实 Agent 会话评测（run-agent-eval.mjs 驱动 dsh --profile headless），非 DSH 客户端缺 CDP 会话自动化环境；解除条件：部署 CDP 会话自动化或安装 dsh |

> **BLOCKED 分类**：【补环境】EXP-E08 需真实 LLM harness 驱动 Agent 会话，serviceCatalog 路由层对诊断类意图返回 N/A（需 LLM 推理非路由）。CodeArtsSpace 非 DSH 客户端，无 dsh 可用，需 CDP 会话自动化环境。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（本次测试未触发凭证泄漏，FAIL 项均为安全规则覆盖不足，非泄漏事件）
- [x] 写操作误判 read-only：无（D4-5/D4-6/D4-7 写操作预检正确）
- [x] 红线（I 类）违规：0（真云用例未创建资源，无归零违规；PASS 门禁通过）
- [x] 脱敏复核：D2-4/D4-24 发现脱敏覆盖缺口（小写 ak/sk、access_token），已记根因待修

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/EIP | 0 | 0 | N/A（本次无真云 E2E 用例执行） |
| 本地临时文件 | 0 | 0 | N/A |

> 本次测试以源码级直调 + CLI 命令 + eval harness 为主，未创建真云资源，无资源释放需求。

---

## 八、遗留与建议

1. **D2-4 凭证脱敏**：建议 `safety-policy.mjs:45` 正则添加 `i` 标志，覆盖小写 `ak=`/`sk=`
2. **D2-11 STS get-token**：建议 `cloud-risk-rules.json:94` 添加 `sts get-token` 匹配规则，severity 改为 `deny`
3. **D4-2/D4-4 env 打印拦截**：建议扩展凭证 env 变量名匹配，覆盖 `ACCESS_KEY`/`SECRET_KEY` 等通用变量名
4. **D4-3 明文 secret API**：建议 `policy.json:26` blockedSecretOperations 添加 CLI 小写形式（`show-secret`/`decrypt-data`）
5. **D2-16 configure import**：建议 `policy.json:25` blockedConfigureSubcommands 添加 `"import"`
6. **D4-24 access_token 脱敏**：建议 `safety-policy.mjs:25` isSecretKeyName 正则覆盖 `access_token`
7. **EXP-E01 云主机路由**：建议 `mcp-server.mjs` serviceCatalog 添加「云主机」→ECS 关键词映射
8. **EXP-E08 BLOCKED**：需部署 CDP 会话自动化环境或安装 dsh 以解除阻塞
