# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-14 05:16:13（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-14-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.8` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（safety-policy/risk-rule-engine/update-check/credentials/hcloud-cli/mcp-protocol/tools 模块 import + 真实函数调用）、MCP dispatch（initialize/tools/list/tools/call 真实协议调用）、真云 E2E（hcloud CLI 真调 ECS ListServersDetails/IAM ListRegions/EIP CreatePublicip→ShowPublicip→DeletePublicip→ListPublicips 建删归零）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `140 / 6 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `95.9%` |
| P0 / P1 / P2 新增缺陷 | `3 / 2 / 1` |
| 红线（I 类）违规 | `3 项（D2-4 lowercase ak= 脱敏 / D4-3 DecryptData 拦截 / D4-2 env·bash 穿透）` |
| 资源释放 | `EIP 已创建→删除→归零验证（total_count=0）` |

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
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:42` — redactString 正则不匹配 bare `ak=`/`sk=`（小写无下划线） | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety-policy.mjs:249` — blockedSecretOperations 列表遗漏 DecryptData | 待提单 |
| 3 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | `safety-policy.mjs:489` — classifyTextCommand 对非 hcloud shell 命令（env/echo/grep）不做凭证泄露检测 | 待提单 |
| 4 | P2 | `D1-40` | D1安装 | 镜像 lag 下检测正确性 | `update-check.mjs:86` — parseDistTagsOutput 拒绝镜像 registry 返回的数组格式 | 待提单 |
| 5 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由 MISS | `tools.mjs` serviceCatalog 对中文意图 "查云主机" 未命中 ECS | 待提单 |
| 6 | P1 | `EXP-E08` | D10评测 | serviceCatalog 路由 MISS | `tools.mjs` serviceCatalog 对中文意图 "ECS启动失败" 未命中 explain_error | 待提单 |

### 根因详情

**D2-4**: `redactSecrets("ak=AKIDEXAMPLE123456789 sk=SKEXAMPLE987654321")` → 明文泄露。正则 `/((?:access[_-]?key|secret[_-]?key|...)/gi` 只匹配 `access_key`/`secret_key`（带下划线），不匹配 bare `ak`/`sk`。Line 45 的 `/(AK|SK)\s*[:=]\s*/g` 只匹配大写。

**D4-3**: `classifyHcloudArgs(['hcloud','KMS','DecryptData','--secret_id=xxx'])` → `decision=allow, risk=unknown_read`。DecryptData 返回明文解密数据，应被 deny。blockedSecretOperations 列表含 ShowSecret/ShowSecretVersion/GetSecretValue/DownloadSecret，但遗漏 DecryptData。

**D4-2**: `classifyTextCommand('env | grep AK')` → `decision=allow, risk=not_huaweicloud`；`classifyTextCommand('echo HUAWEICLOUD_ACCESS_KEY=AKIDTEST')` → `decision=allow`。classifyTextCommand 仅检查 hcloud 命令，对非 hcloud 的 shell 命令不做凭证泄露检测。

**D1-40**: `npm view --registry=npmmirror` 返回 `[{latest, next}]`（数组），`parseDistTagsOutput` line 86 `Array.isArray(parsed) return null`，导致镜像源检测失败。

**EXP-E01**: `serviceCatalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回通用 "use huaweicloud-core to route intent"，未命中 ECS 查询。

**EXP-E08**: `serviceCatalog(intent="我的ECS启动失败了帮我分析原因")` 返回通用引导，未命中 explain_error 排障。

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：D2-4 发现 lowercase `ak=`/`sk=` 未脱敏（红线违规）
- [x] 写操作误判 read-only：无（D4-5 所有写操作正确 deny）
- [x] 红线（I 类）违规：3 项
  - D2-4: lowercase `ak=` 脱敏缺失（safety-policy.mjs:42 redactString 正则盲区）
  - D4-3: KMS DecryptData 未拦截（safety-policy.mjs:249 blockedSecretOperations 遗漏）
  - D4-2: `env | grep AK` / `echo HUAWEICLOUD_ACCESS_KEY=...` 未拦截（safety-policy.mjs:489 classifyTextCommand 仅查 hcloud）
- [x] 脱敏复核：D4-27 双路径输出脱敏 PASS（`access_key=` 格式正确脱敏）

### 红线用例具体执行方式与实际返回

- **D2-4 小写 ak= 脱敏**：真实构造 `ak=AKIDEXAMPLE123456789 sk=SKEXAMPLE987654321` 输入，直调 `redactSecrets()`，返回值仍含明文 AK/SK → FAIL
- **D4-3 kms DecryptData 拦截**：真实构造 `['hcloud','KMS','DecryptData','--secret_id=xxx']`，直调 `classifyHcloudArgs()`，返回 `{decision:'allow', risk:'unknown_read'}` → FAIL
- **D4-2 env·bash 穿透**：真实构造 `env | grep AK` 和 `echo HUAWEICLOUD_ACCESS_KEY=AKIDTEST`，直调 `classifyTextCommand()`，返回 `{decision:'allow', risk:'not_huaweicloud'}` → FAIL

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| EIP (cn-north-4) | id=293338cf-9635-45a8-b4a7-b698dd9fc68c, name=tctest-eip-1791926123308 | DeletePublicip status=0 | ListPublicips total_count=0, publicips=[] |

---

## 八、遗留与建议

- D2-4/D4-3/D4-2 三个红线缺陷建议优先修复：
  - D2-4: redactString 正则增加 `ak`/`sk`（无下划线）匹配
  - D4-3: blockedSecretOperations 列表添加 `DecryptData`
  - D4-2: classifyTextCommand 增加非 hcloud 命令的凭证泄露检测
- D1-40: parseDistTagsOutput 应解包数组格式 `Array.isArray(parsed) ? parsed[0] : parsed`
- EXP-E01/E08: serviceCatalog 路由需增强中文自然语言意图匹配
