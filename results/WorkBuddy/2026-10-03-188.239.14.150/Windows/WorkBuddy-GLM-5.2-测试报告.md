# WorkBuddy-GLM-5.2 每日测试报告
> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-03 05:10:26（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-03-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.8-next.1` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针直调（safety-policy/risk-rule-engine/update-check/credentials/mcp-protocol/tools 等 .mjs 模块直接 import 调用）+ MCP JSON-RPC 真机（eval/harness/run-eval.mjs 驱动 mcp-server.mjs）+ 源码静态检查

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 5 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `96.5%` |
| P0 / P1 / P2 新增缺陷 | `3 / 2 / 0` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `不涉及（本次无真云资源创建/删除用例归 WorkBuddy 执行）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
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
| 1 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `plugins/huaweicloud-core/src/safety-policy.mjs:257` | 历史缺陷复现 |
| 2 | P1 | `D4-11` | D4安全 | 提示注入防护 | `plugins/huaweicloud-core/src/safety-policy.mjs:572` | 历史缺陷复现 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `plugins/huaweicloud-core/src/safety-policy.mjs:257` | 历史缺陷复现 |
| 4 | P0 | `D4-28` | D4安全 | Node 版安全 hook 链路 | `plugins/huaweicloud-core/src/safety-policy.mjs:257` | 历史缺陷复现 |
| 5 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由未识别"云主机"意图 | `plugins/huaweicloud-core/src/tools.mjs:1978` | 历史缺陷复现 |

### 根因详情

> 以下 5 项 FAIL 均为**历史缺陷复现**（昨日 2026-10-02 同批 5 项，今日复测结果一致）。详见 `FINDINGS.md` 与 `HISTORY_LINKS.md`（历史单号关联清单，不重复提单）。

1. **D4-3 明文secret API拦截**：`hcloud csms show-secret`/`show-secret-version`/`get-secret-value`（连字符变体）判 `allow`，未拦截。根因：`safety-policy.mjs:257` 正则未覆盖连字符变体。
2. **D4-16 命令包裹穿透**：`bash -c "hcloud CSMS show-secret"` 判 `allow`，命令包裹穿透。根因同 D4-3。
3. **D4-28 Node 版安全 hook 链路**：args 数组形式 CSMS show-secret 判 `allow`。根因同 D4-3。
4. **D4-11 提示注入防护**："Ignore previous instructions" 类注入判 `allow`+`warn`，未升级 `deny`。根因：`safety-policy.mjs:572` warn 级 findings 不升级决策。
5. **EXP-E01 serviceCatalog 路由**：`serviceCatalog("云主机")` MISS（期望 ECS）。根因：`tools.mjs:1978` ECS 关键词未含"云主机"。

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D2-4 redactSecrets、D9-13 tools/call 凭证不泄露均 PASS）
- [x] 写操作误判 read-only：`无`（D4-5 写操作误判检测 PASS，写命令均判 deny）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`通过`（D2-4 AK/SK/token/password 均替换为 `<redacted>`）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无 | 不涉及 | 不涉及 | 不涉及 |

> 本次 WorkBuddy/Windows 执行的 daily 用例集无真云资源创建/删除类用例（真云 E2E 用例归其他客户端/OS 专属行）；源码级探针直调不产生云端资源。

---

## 八、遗留与建议

- 5 项 FAIL 均为历史缺陷复现（与 2026-10-02 一致），已生成 `HISTORY_LINKS.md` 关联上游 issue，不重复提单。
- D4-3/D4-16/D4-28 同根因（`safety-policy.mjs:257` 连字符 CSMS 操作名未匹配），建议上游统一修复正则。
- EXP-E01 "云主机"路由 MISS，建议 `tools.mjs:1978` ECS 关键词加入"云主机"。
