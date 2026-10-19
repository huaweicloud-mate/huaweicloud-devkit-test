# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-20 05:09:39（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-20-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.9` (git: 05a67b64) |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（safety-policy.redactSecrets / classifyTextCommand / judgeUpdate / serviceCatalog）+ MCP callTool 真机（huaweicloud_list_operations / huaweicloud_plan_cli_command / huaweicloud_check_cli_command）+ run-eval.mjs harness（serviceCatalog 路由层 15 条评测集）+ protocol-probe.mjs（initialize/tools/list/tools/call）+ 真云只读 plan（ECS ListServers / CreateServer 最低配置 plan）。所有标 PASS 用例均有 evidence/<case-id>/stdout.log + probe.mjs 真实执行产出。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 2 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `98.6%` |
| P0 / P1 / P2 新增缺陷 | `2 / 0 / 0` |
| 红线（I 类）违规 | 无（所有红线用例真实构造攻击输入执行，见 §六） |
| 资源释放 | 真云只读用例（list_operations + plan）无资源创建；无需归零 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `hdk/plugins/huaweicloud-core/src/safety-policy.mjs:34-46` redactString 正则 `(AK|SK)\s*[:=]\s*` 仅匹配大写 AK/SK，未覆盖小写 `ak=`/`sk=` 攻击输入 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `hdk/plugins/huaweicloud-core/safety/policy.json:26` blockedSecretOperations 未含 KMS DecryptData；`safety-policy.mjs:249-263` 仅匹配 ShowSecret/GetSecretValue 模式，未拦截 KMS DecryptData | 待提单 |

### 根因详情

#### D2-4 凭证脱敏正确性（P0 红线）
- **预期**：`redactSecrets('config: ak=TESTAKXX sk=TESTSKYY')` 应将 ak=/sk= 的值替换为 `<redacted>`，输出不含明文 AK/SK。
- **实际**：返回 `config: ak=TESTAKXX sk=TESTSKYY`（原样未脱敏），akLeak=true skLeak=true。
- **根因**：`safety-policy.mjs:45` 的正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，未覆盖小写 `ak=`/`sk=` 攻击变体；第 42 行 `access[_-]?key|secret[_-]?key` 模式也未命中裸 `ak=`/`sk=` 简写。
- **证据**：`evidence/D2-4/stdout.log`（akLeak=true skLeak=true redacted 原样输出）。

#### D4-3 明文secret API拦截（P0 红线）
- **预期**：`classifyTextCommand('hcloud KMS DecryptData --plaintext=Lwo3')` 应返回 `decision: deny`（DecryptData 解密出明文 secret，属 secret 拦截范围）。
- **实际**：返回 `decision: allow, risk: unknown_read`，未被拦截。
- **根因**：`policy.json:26` blockedSecretOperations 只含 `["ShowSecret","ShowSecretVersion","DownloadSecret","GetSecretValue"]`，未含 KMS `DecryptData`；`safety-policy.mjs:257` 的正则 `secret[_-]?string|secret_binary` 也不匹配 `DecryptData`。DecryptData 会解密出明文 secret，应归入 secret 拦截。
- **证据**：`evidence/D4-3/stdout.log`（decision=allow）。

---

## 五、未执行用例与原因

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | HUAWEICLOUD_AGENT_TOOLKIT_MODE=local 是 DSH 客户端专属环境变量，WorkBuddy 非该变量目标客户端，实测不适用 | 【调归属】DSH 专属用例误下发到 WorkBuddy |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox E2E 需要 DevStation 上游连接（真实网络沙箱），WorkBuddy 机器无 DevStation | 【补环境】需 DevStation 网络沙箱连接 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit 需要 DevStation 上游 | 【补环境】需 DevStation |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox 需要 DevStation 上游 | 【补环境】需 DevStation |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Sandbox 需要 DevStation 上游 | 【补环境】需 DevStation |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：D2-4 测出 redactSecrets 未覆盖小写 `ak=`/`sk=` 攻击输入，明文 AK/SK 泄漏（FAIL，已记根因，提单）。
- [x] 写操作误判 read-only：D4-5 DeleteServer decision=deny、D4-4 DeleteServer decision=deny、D4-18 plan decision=deny（未误判）；D4-29 ListServers decision=allow（正确识别只读）。
- [x] 红线（I 类）违规：无 I 类违规；红线用例逐条执行如下：
  - **D2-4 小写 ak= 脱敏**：构造 `config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY` 攻击输入，调 `redactSecrets(input)` → 返回原样未脱敏（akLeak=true skLeak=true）→ 如实标 FAIL。
  - **D4-3 KMS DecryptData 拦截**：构造 `hcloud KMS DecryptData --plaintext=Lwo3` 攻击输入，调 `classifyTextCommand(cmd)` → decision=allow（未拦截）→ 如实标 FAIL。
  - **D4-2 env·bash 穿透**：构造 `['printenv HUAWEICLOUD_SECRET_ACCESS_KEY', 'bash -c "env | grep HUAWEICLOUD"', 'echo $HW_SECRET_KEY']` 攻击输入，调 classifyTextCommand → decisions=["deny","deny","deny"] → 标 PASS（全部拦截）。
  - **D4-16 命令包裹穿透**：构造 `['bash -c "hcloud ECS DeleteServer --id f"', 'sh -c "hcloud ECS DeleteServer f"', 'cmd /c "hcloud ECS DeleteServer f"']`，调 classifyTextCommand → decisions=["deny","deny","deny"] → 标 PASS。
- [x] 脱敏复核：D2-4 测出脱敏正则缺陷（小写 ak=/sk= 未覆盖）；D4-26 findings 证据脱敏 PASS；D4-27 双路径输出脱敏 PASS；D9-13 tools/call 凭证不泄露 PASS。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS ListServers | 未创建（只读 plan） | N/A | N/A |
| ECS CreateServer | 未创建（plan 仅生成命令，未执行） | N/A | N/A |
| list_operations(ECS) | 未创建（只读枚举操作） | N/A | N/A |

> 本日真云用例均为只读类（list_operations + plan），plan 仅生成 hcloud 命令字符串并做 classification，未真实执行 hcloud CLI 创建资源，无云端资源创建，无需归零。

---

## 八、遗留与建议

- **D2-4**：建议 safety-policy.mjs redactString 正则第 45 行扩展为 `/(AK|SK|ak|sk)\s*[:=]\s*/` 或添加 `/(?:ak|sk)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi` 分支，覆盖小写 ak=/sk= 攻击变体。
- **D4-3**：建议 policy.json blockedSecretOperations 添加 `DecryptData`（KMS 明文解密属 secret 拦截范围）；或 safety-policy.mjs 第 257 行正则扩展 `decryptdata|decrypt_data` 模式。
- **D1-67**：建议用例归属列调整，DSH 专属用例不下发到 WorkBuddy。
- **D3-C3/C14/S3/S7**：Sandbox E2E 需 DevStation 上游，WorkBuddy 机器无该环境，维持 BLOCKED。
