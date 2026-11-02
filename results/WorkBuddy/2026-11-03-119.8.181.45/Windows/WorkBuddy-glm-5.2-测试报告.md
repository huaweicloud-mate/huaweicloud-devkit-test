# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-11-03 05:11:12（北京时间）
> **执行归档**：`results/WorkBuddy/2026-11-03-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.13-next.0` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针直调（safety-policy.mjs classifyTextCommand/redactSecrets/judgeUpdate 等真函数）+ MCP stdio 真机调用（mcpInitialize/mcpToolsList/mcpToolCall 真调 huaweicloud_* 工具）+ CLI 真机（npx huaweicloud-devkit doctor/status/plugins/auth）+ eval/harness/run-eval.mjs 真跑 serviceCatalog 路由 + list_operations/plan 真云只读（ECS/VPC/RDS 等 22 服务）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 3 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 0` |
| 红线（I 类）违规 | `无`（红线用例 D2-4/D4-3/D4-2/D4-16 均真实构造攻击输入测试，D2-4/D4-3 FAIL 已如实记录根因，D4-2/D4-16 PASS） |
| 资源释放 | `无需释放`（本次仅只读 MCP 调用 list_operations/plan，未真建云资源） |

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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString` 正则 `/(AK\|SK)\s*[:=]\s*.../g` 缺 `i` 标志，不匹配小写 `ak=/sk=`，导致 `config: ak=TESTAK... sk=TESTSK...` 输入 AK/SK 原文泄漏 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `plugins/huaweicloud-core/safety/policy.json:blockedSecretOperations` — 列表仅含 `ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue`，未包含 KMS `DecryptData`；`classifyTextCommand('hcloud KMS DecryptData ...')` 返回 `decision='allow'`，敏感解密操作未被拦截 | 待提单 |
| 3 | P1 | `EXP-E01` | D10评测 | ECS 路由命中 | `plugins/huaweicloud-core/src/tools.mjs:2195-2468` — `serviceCatalog` 路由表 keywords 匹配逻辑对中文 CJK 采用 `it.includes(kw.toLowerCase())`，但 `云主机` 不在 ECS 路由 keywords（只有 `弹性云服务器/云服务器/服务器/虚拟机`），意图 `帮我查一下我账号在华北北京四有哪些云主机` 未命中任何 keyword，返回 `Run hcloud --help to list available services.` | 待提单 |

### 根因详情

#### D2-4（P0 红线：小写 ak= 脱敏）
- **期望**：`redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSK...')` 返回字符串中 `TESTAK/TESTSK` 已被替换为 `<redacted>`
- **实际**：返回 `config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`，AK/SK 原文泄漏
- **根因**：`safety-policy.mjs:45` 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 未加 `i` 标志，无法匹配小写 `ak=/sk=` 前缀
- **证据**：`evidence/D2-4/stdout.log` — `akLeak=true, skLeak=true, redacted="config: ak=TESTAK... sk=TESTSK..."`

#### D4-3（P0 红线：KMS DecryptData 拦截）
- **期望**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy')` 返回 `decision='deny'` 或 `'warn'`
- **实际**：返回 `decision='allow'`，解密敏感数据的 API 未被安全策略拦截
- **根因**：`policy.json` `blockedSecretOperations` 列表未包含 `DecryptData`；`writeOperationPrefixes` 也不含 `Decrypt` 前缀
- **证据**：`evidence/D4-3/stdout.log` — `decision="allow"`

#### EXP-E01（P1：service_catalog 路由 MISS）
- **期望**：`huaweicloud_service_catalog(intent='帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 含 `ECS`
- **实际**：返回 `["Run hcloud --help to list available services."]`（未命中任何 keyword）
- **根因**：`tools.mjs:2199-2215` ECS 路由 keywords 为 `['ecs','server','vm','instance','compute','flavor','image','弹性云服务器','云服务器','服务器','虚拟机','镜像']`，不含 `云主机`；`云主机` 是华为云控制台/用户常用 ECS 别名
- **证据**：`evidence/EXP-E01/stdout.log` — `verdict="MISS", got=["Run hcloud --help to list available services."]`

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

- [ ] 凭证泄漏事件：`TODO: 待填`
- [ ] 写操作误判 read-only：`TODO: 待填`
- [ ] 红线（I 类）违规：`TODO: 待填`
- [ ] 脱敏复核：`TODO: 待填`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| TODO | TODO | TODO | TODO |

> TODO: 真云用例的资源创建/销毁/归零情况由 agent 依据执行过程补充。

---

## 八、遗留与建议

- TODO: 待裁决 SPEC / 未覆盖项 / 修复建议由 agent 补充。
