# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-23 05:16:53（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-23-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.12` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针直调（classifyTextCommand/judgeUpdate/redactSecrets 等源码函数）+ MCP stdio 真机调用（initialize/tools/list/tools/call）+ CLI 真机执行（npx huaweicloud-devkit doctor/status/plugins/help/auth）+ 真云 E2E（realcloud_e2e.mjs 真调 hcloud CLI CreateVpc/CreateSubnet/OBS 建桶）+ eval harness（run-eval.mjs 路由准确率基线）。所有 PASS 用例均有 evidence/<case-id>/stdout.log 落盘，经 verify_no_fake_pass.py 门禁通过。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `134 / 5 / 7 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 139） | `96.4%` |
| P0 / P1 / P2 新增缺陷 | `2 / 3 / 0` |
| 红线（I 类）违规 | 无 |
| 资源释放 | 真云凭证过期，未创建资源，无残留 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `7` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `36` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `policy.json blockedSecretOperations 缺少 DecryptData` | 待提单 |
| 3 | P1 | `EXP-C4-08` | D3功能 | IAM 只读规划冒烟 | `mcp-server list_operations IAM 超时无响应` | 待提单 |
| 4 | P1 | `EXP-C4-18` | D3功能 | DEW 只读规划冒烟 | `mcp-server list_operations DEW 超时无响应` | 待提单 |
| 5 | P1 | `EXP-E01` | D10评测 | 路由准确率 | `service_catalog 中文意图"帮我查云主机"未命中 ECS` | 待提单 |

### 根因详情

**1. D2-4（P0 红线）— 凭证脱敏正确性**
- **期望**：`redactSecrets("config: ak=TESTAKXXX sk=TESTSKXXX")` 应脱敏 ak=/sk= 的值
- **实际**：`redacted` 返回原文 `"config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY"`，akLeak=true, skLeak=true
- **根因**：`safety-policy.mjs:45` — `redactString` 正则 `/(AK|SK)\s*[:=]\s*.../g` 仅匹配大写 `AK`/`SK`，不匹配小写 `ak=`/`sk=`
- **证据**：`evidence/D2-4/stdout.log`

**2. D4-3（P0 红线）— 明文secret API拦截**
- **期望**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy')` 应返回 decision=deny 或 warn
- **实际**：返回 `decision="allow"` — KMS DecryptData 敏感解密操作未被拦截
- **根因**：`policy.json` 的 `blockedSecretOperations` 仅含 `['ShowSecret','ShowSecretVersion','DownloadSecret','GetSecretValue']`，缺少 `DecryptData`
- **证据**：`evidence/D4-3/stdout.log`

**3. EXP-C4-08（P1）— IAM 只读规划冒烟**
- **期望**：`list_operations(service=IAM)` 返回 IAM 操作列表
- **实际**：MCP tools/call 超时无响应（id=2 未返回）
- **根因**：`mcp-server.mjs` list_operations 对 IAM 服务调用 `hcloud IAM --help` 超时
- **证据**：`evidence/EXP-C4-08/stdout.log`

**4. EXP-C4-18（P1）— DEW 只读规划冒烟**
- **期望**：`list_operations(service=DEW)` 返回 DEW 操作列表
- **实际**：MCP tools/call 超时无响应
- **根因**：同 EXP-C4-08，DEW 服务 help 超时
- **证据**：`evidence/EXP-C4-18/stdout.log`

**5. EXP-E01（P1）— 路由准确率**
- **期望**：`service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 命中 ECS
- **实际**：返回 `recommendedServices=["Run hcloud --help to list available services."]`，verdict=MISS
- **根因**：service_catalog 中文意图路由未覆盖"帮我查云主机"这一表述变体
- **证据**：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | AGENT_TOOLKIT_MODE=local is DSH-client-specific，WorkBuddy 非 DSH 客户端 | 【调归属】 |
| `D3-C1` | D3功能 | ECS生命周期E2E | 真云E2E实测：CreateVpc/CreateSubnet 返回 APIGW.0301 Unauthorized，credentials.json AK/SK 已过期（test_ak_20char123456 为测试值非有效凭证），需维护者更新真云凭证 | 【补环境】 |
| `D3-C2` | D3功能 | OBS静态站部署E2E | 真云E2E实测：OBS建桶返回 403 InvalidAccessKeyId，credentials.json AK/SK 已过期 | 【补环境】 |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox E2E requires DevStation upstream connection（真实网络沙箱依赖） | 【补环境】 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit requires DevStation upstream | 【补环境】 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox requires DevStation upstream | 【补环境】 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Sandbox requires DevStation upstream | 【补环境】 |

---

## 六、安全与红线合规

### 红线用例执行详情（防复发硬约束 ④）

| 用例ID | 红线类型 | 执行方式 | 实际返回 | 结论 |
|---|---|---|---|---|
| D2-4 | 小写 ak= 脱敏 | 构造攻击输入 `config: ak=TESTAKXXX sk=TESTSKXXX`，调 `redactSecrets()` | akLeak=true, skLeak=true（值未脱敏） | **FAIL** — 真实安全缺陷 |
| D4-3 | KMS DecryptData 拦截 | 构造攻击命令 `hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy`，调 `classifyTextCommand()` | decision="allow"（未拦截） | **FAIL** — 真实安全缺陷 |
| D4-2 | env 打印拦截 | 构造 4 种攻击：`printenv HW_ACCESS_KEY` / `bash -c "printenv HW_ACCESS_KEY"` / `env \| grep HW_` / `echo $HW_ACCESS_KEY` | 全部 decision=deny | **PASS** |
| D4-16 | bash 命令穿透 | 构造 3 种包裹：`bash -c "hcloud ECS DeleteServer"` / `sh -c "hcloud IAM DeleteUser"` / `cmd /c "hcloud ECS DeleteServer"` | 全部 decision=deny/warn | **PASS** |

- [x] 凭证泄漏事件：D2-4 发现 lowercase ak=/sk= 脱敏遗漏（P0 缺陷）
- [x] 写操作误判 read-only：D4-3 发现 KMS DecryptData 误判 allow（P0 缺陷）
- [x] 红线（I 类）违规：无违规（红线用例真实构造攻击输入执行）
- [x] 脱敏复核：D9-13 PASS（tools/call auth_status 响应不含真实 AK/SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC (D3-C1) | 未创建（凭证过期，CreateVpc 返回 401） | 无需销毁 | N/A |
| Subnet (D3-C1) | 未创建（凭证过期，CreateSubnet 返回 401） | 无需销毁 | N/A |
| OBS 桶 (D3-C2) | 未创建（凭证过期，建桶返回 403） | 无需销毁 | N/A |
| ECS (D3-C1) | 未创建（VPC/Subnet 失败，未到 ECS 创建步骤） | 无需销毁 | N/A |

> 真云凭证过期，所有创建类操作在认证阶段即失败，未产生任何云端资源，无残留需清理。

---

## 八、遗留与建议

1. **D2-4（P0）**：`safety-policy.mjs:45` redactString 正则需改为大小写不敏感 `/(AK|SK)\s*[:=]\s*.../gi`，或扩展匹配 `ak=`/`sk=`
2. **D4-3（P0）**：`policy.json` blockedSecretOperations 需追加 `DecryptData`（KMS 解密操作应拦截）
3. **EXP-C4-08/18（P1）**：list_operations 对 IAM/DEW 服务超时，需排查 hcloud CLI 对这些服务的 --help 响应
4. **EXP-E01（P1）**：service_catalog 中文意图路由需扩展"帮我查云主机"等表述变体
5. **真云凭证**：credentials.json AK/SK 已过期（test_ak_20char123456 为测试值），需维护者更新为有效凭证以恢复 D3-C1/C2 真云 E2E
