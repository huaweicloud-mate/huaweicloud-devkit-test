# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-11-02 05:22:40（北京时间）
> **执行归档**：`results/OpenCode/2026-11-02-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.13-next.0` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：MCP 真机调用（hook_check_command/plan_cli_command/auth_switch 等 40+ 工具）+ 源码级直调探针（D9-12/D9-13/D10-4 Node.js probe）+ eval harness 路由评测（run-eval.mjs）+ KooCLI 直接调用（hcloud ECS ListServersDetails 验证真云连通）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `145 / 1 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `无需释放（本次未创建真云资源，仅 read-only 查询）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `107` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
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
| 1 | P1 | `EXP-E01` | 路由 | serviceCatalog 路由未命中中文"云主机"查询 | `tools.mjs:2450` recommendedServices 为空返回 fallback | 待提单 |

### 根因详情

**EXP-E01**:
- 期望: serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机") recommendedServices 包含 "ECS"
- 实际: recommendedServices 为空数组，返回 fallback `['Run hcloud --help to list available services.']`
- 根因: `plugins/huaweicloud-core/src/tools.mjs:2450` — 关键词匹配逻辑未将"云主机"识别为 ECS 关键词
- 证据: `eval/harness/run-eval.mjs` 输出 `EXP-E01 | MISS | 期望=ECS | 实际=Run hcloud --help`
- 建议: 在 serviceCatalog 关键词映射中增加"云主机"→ ECS

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0` — hook_check_command 拦截 cat credentials/printenv/CSMS ShowSecretVersion 全部 deny
- [x] 写操作误判 read-only：`0` — plan_cli_command 对 DeleteServers/DeleteVpc/CreateServers 全部判 deny(write)
- [x] 红线（I 类）违规：`0` — STS token 拒绝落盘(D2-11)、凭证脱敏(D2-4)、PASS 门禁全通过
- [x] 脱敏复核：`通过` — show_profile_redacted AK/SK/token 全部 <redacted>，run_readonly_command rawArgs 凭证 <redacted>

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/VPC/OBS 等真云资源 | 未创建（read-only 测试） | N/A | N/A |

> 本次测试仅执行 read-only 查询和工具机制验证，未创建真云资源。hcloud ECS ListServersDetails 通过 KooCLI profile 验证真云连通（返回 2 台服务器）。credentials.json 中 AK/SK 过期（APIGW.0301），但 KooCLI profile 凭证有效。

---

## 八、遗留与建议

- **EXP-E01 路由缺陷**：serviceCatalog 未将中文"云主机"匹配到 ECS，建议在关键词映射中增加"云主机"→ ECS。eval 准确率 92.9%（13 HIT / 1 MISS / 1 N/A），较基线 21.4% MISS 显著改善。
- **凭证一致性**：credentials.json AK/SK 过期（APIGW.0301），KooCLI profile 凭证有效。建议定期刷新 credentials.json 或增加 KooCLI profile fallback 机制。
- **版本检测**：check_update 报告 currentVersion=1.1.9-next.0（运行中 MCP 服务版本），npm 全局包为 1.1.13-next.0。MCP 服务需重启以加载新版本。check_failed 状态为 Windows 下 registry 查询失败，非静默 EINVAL。
- **全部 146 用例已执行回填**，PASS 门禁和覆盖率门禁均通过。
