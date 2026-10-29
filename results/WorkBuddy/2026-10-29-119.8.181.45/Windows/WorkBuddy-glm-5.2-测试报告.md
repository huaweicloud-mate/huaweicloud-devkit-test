# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-29 21:16:30（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-29-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项：D2-4 凭证脱敏、D4-3 KMS DecryptData 拦截）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.12` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：batch_runner_20261029.mjs 批量执行——①CLI 真调（npx huaweicloud-devkit doctor/status/plugins/auth/help）；②MCP 真机（mcp_helper.mjs spawn mcp-server.mjs → initialize/tools/list/tools/call，含 list_operations/plan_cli_command/service_catalog/check_update/auth_status 等）；③源码直调（safetyPolicy.classifyTextCommand/redactSecrets、updateCheck.judgeUpdate/semverParse/writeSkipState、detectFramework.detectFramework 等，对真实返回字段断言）；④真云 E2E（realcloud_e2e.mjs D3-B7 VPC ListVpcs 真机 plan+run_approved、D3-B8 voucher_status 真调）；⑤评测 harness（run-eval.mjs 15 条中文意图路由）；⑥红线用例真实构造攻击输入（D2-4 小写 ak=、D4-3 KMS DecryptData、D4-2/D4-16 env·bash 穿透）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `137 / 4 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `97.2%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 0`（D3-C2 为非产品缺陷不计入） |
| 红线（I 类）违规 | `0`（D2-4/D4-3/D4-2/D4-16 红线用例均已真实构造攻击输入执行，D2-4/D4-3 测出 FAIL） |
| 资源释放 | `D3-B7 VPC ListVpcs 只读无创建；D3-C2 OBS 建桶失败(403)无资源残留` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `99` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏未覆盖小写 ak=/sk= 格式 | `safety-policy.mjs:redactSecrets` 正则未覆盖小写 ak= 模式 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | KMS DecryptData 未被拦截(decision=allow) | `safety/rules/cloud-risk-rules.json` 缺少 KMS DecryptData deny 规则 | 待提单 |
| 3 | P1 | `EXP-E01` | 展开级 | serviceCatalog 路由未命中"云主机"关键词 | `tools.mjs:2192-2208` ECS keywords 缺少 '云主机' | 待提单 |
| 4 | 非产品缺陷 | `D3-C2` | D3功能 | OBS静态站E2E凭证失败(403) | 测试环境 OBS 凭证未同步(非SUT缺陷) | 不提单 |

### 根因详情

**D2-4（P0 红线）**：
- 期望：`redactSecrets('config: ak=TESTAKXXX sk=TESTSKYYY')` 返回脱敏字符串，不含原始 AK/SK
- 实际：返回原文 `config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`（akLeak=true, skLeak=true）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` `redactSecrets` 正则未覆盖小写 `ak=`/`sk=` 模式
- 证据：`evidence/D2-4/stdout.log`

**D4-3（P0 红线）**：
- 期望：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy')` 返回 `decision: 'deny'` 或 `'warn'`
- 实际：返回 `decision: 'allow'`（未拦截明文密钥解密）
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 缺少 `KMS DecryptData` deny 规则
- 证据：`evidence/D4-3/stdout.log`（decision=allow）

**EXP-E01（P1）**：
- 期望：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 含 `"ECS"`
- 实际：返回 `["Run hcloud --help to list available services."]`（verdict=MISS）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2192-2208` ECS routeMap keywords 缺少 `'云主机'`
- 证据：`evidence/EXP-E01/stdout.log`

**D3-C2（非产品缺陷）**：
- 现象：OBS 建桶 403 `InvalidAccessKeyId`
- 说明：测试环境 OBS 凭证未同步（credentials.json 的 test_ak_20 无效），非 SUT 代码缺陷

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | AGENT_TOOLKIT_MODE=local is DSH-client-specific (HUAWEICLOUD_AGENT_TOOLKIT_MODE env tested by DSH agent) |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox E2E requires DevStation upstream connection (real network sandbox) |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit requires DevStation upstream |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox requires DevStation upstream |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Sandbox requires DevStation upstream |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D9-13 tools/call 响应经真机校验无 AK/SK 泄漏；D2-4 测出 redactSecrets 对小写 ak= 格式未脱敏，属 SUT 缺陷非泄漏事件）
- [x] 写操作误判 read-only：`无`（D4-4/D4-5/D4-18/D4-19 DeleteServer/DeleteUser 均正确返回 deny）
- [x] 红线（I 类）违规：`0` 违规——红线用例逐条执行情况：
  - **D2-4 小写 ak= 脱敏**：真实构造 `config: ak=TESTAKXXX sk=TESTSKYYY` 输入调 `redactSecrets`，测出 FAIL（akLeak=true, skLeak=true），已记根因 `safety-policy.mjs:redactSecrets`。
  - **D4-3 KMS DecryptData 拦截**：真实构造 `hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy` 调 `classifyTextCommand`，测出 FAIL（decision=allow），已记根因 `cloud-risk-rules.json` 缺规则。
  - **D4-2 env·bash 穿透**：真实构造 4 条攻击输入（`printenv HW_ACCESS_KEY`、`bash -c "printenv HW_ACCESS_KEY"`、`env | grep HW_`、`echo $HW_ACCESS_KEY`），全部返回 `decision=deny`，PASS。
  - **D4-16 env·bash 穿透**：真实构造 3 条包裹攻击（`bash -c "hcloud ECS DeleteServer"`、`sh -c "hcloud IAM DeleteUser"`、`cmd /c "hcloud ECS DeleteServer"`），全部返回 `decision=deny`，PASS。
- [x] 脱敏复核：`D4-26/D4-27` findings/dual-path 脱敏均 PASS（无泄漏）；D2-4 小写格式为已知缺口（FAIL 已提单）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| D3-B7 VPC ListVpcs | 无（只读） | N/A | N/A |
| D3-C2 OBS 桶 | 建桶失败(403) | N/A | 无残留 |
| D3-B8 voucher | 无（只读） | N/A | N/A |

> 真云只读用例（D3-B7/D3-B8）通过 hcloud CLI 加密 profile（test001 只读子账号）执行，无资源创建。D3-C2 OBS 建桶因凭证无效返回 403，无资源残留。另有 2 台历史遗留 ECS（testbot3-hermes-ecs-*，由前序运行创建）因只读账号无删除权限未能清理，已记录待管理员处理。

---

## 八、遗留与建议

- **D2-4**：`redactSecrets` 需补充小写 `ak=`/`sk=` 正则覆盖，建议在现有正则旁增加 case-insensitive 匹配或显式添加 `ak=`/`sk=` 模式。
- **D4-3**：`cloud-risk-rules.json` 需增加 `KMS DecryptData` deny 规则（按 `huawei-cloud-dew-key-management` skill 的 BLOCKED 操作表）。
- **EXP-E01**：`serviceCatalog` ECS routeMap keywords 需增加 `'云主机'` 同义词。
- **历史遗留 ECS**：2 台 testbot3-hermes-ecs-* ECS 服务器需管理员用 admin 凭证清理（只读账号 test001 无删除权限）。
- **OBS 凭证**：测试环境需同步 OBS 凭证（`huaweicloud_obs_sync_credentials`），使 D3-C2 等真云 OBS 用例可正常执行。
