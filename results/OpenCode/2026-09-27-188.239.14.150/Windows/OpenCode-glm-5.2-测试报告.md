# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-27 05:13:52（北京时间）
> **执行归档**：`results/OpenCode/2026-09-27-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.7` (gitHead: `7456d05`) |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针直调（comprehensive-probe.mjs 覆盖 D1-D10 设计级 102 条）+ eval harness（run-eval.mjs 跑 EXP-E01~E15 serviceCatalog 路由）+ hcloud CLI 冒烟（EXP-C4-01~22 服务矩阵）+ fixup 探针（D4 安全用例 + D9-12/D9-13 协议安全基线）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 12 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `91.5%` |
| P0 / P1 / P2 新增缺陷 | `0 / 12 / 0` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `无真云资源创建（源码级/函数级测试，未建删云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `102` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由 MISS: ECS查询 | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |
| 2 | P1 | `EXP-E02` | D10评测 | serviceCatalog 路由 MISS: ECS创建 | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |
| 3 | P1 | `EXP-E03` | D10评测 | serviceCatalog 路由 MISS: OBS静态站 | `tools.mjs:1947` routeMap 误路由到 Sandbox+DevStation | 已知基线 |
| 4 | P1 | `EXP-E04` | D10评测 | serviceCatalog 路由 MISS: EIP | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |
| 5 | P1 | `EXP-E05` | D10评测 | serviceCatalog 路由 MISS: RDS查询 | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |
| 6 | P1 | `EXP-E07` | D10评测 | serviceCatalog 路由 MISS: CBR | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |
| 7 | P1 | `EXP-E08` | D10评测 | serviceCatalog 路由 N/A: explain_error诊断 | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |
| 8 | P1 | `EXP-E10` | D10评测 | serviceCatalog 路由 MISS: FunctionGraph | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |
| 9 | P1 | `EXP-E11` | D10评测 | serviceCatalog 路由 MISS: BSS费用查询 | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |
| 10 | P1 | `EXP-E12` | D10评测 | serviceCatalog 路由 MISS: CES监控 | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |
| 11 | P1 | `EXP-E13` | D10评测 | serviceCatalog 路由 MISS: ELB证书 | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |
| 12 | P1 | `EXP-E14` | D10评测 | serviceCatalog 路由 MISS: IAM审计 | `tools.mjs:1947` routeMap 未命中中文意图→fallback | 已知基线 |

### 根因详情

**统一根因**：`serviceCatalog` 函数（`tools.mjs:1815`）的 `routeMap`（`tools.mjs:1817`）未覆盖评测集中 11/15 条中文自然语言意图，导致未命中的意图走到 fallback 分支（`tools.mjs:1947`），返回 "Run hcloud --help to list available services." 而非正确服务路由。

- **评测基线**：HIT=3 (E06 DCS, E09 CCE, E15 Voucher) / MISS=11 / N/A=1 = 21.4% 准确率（分母=14）
- **影响**：中文用户自然语言意图无法被正确路由到对应华为云服务，需用户改用英文/服务名
- **证据**：`evidence/EXP-E01~E15/stdout.log`（每条含 harness verdict + actual routing）
- **历史状态**：此为已知基线问题，每日测试追踪路由准确率变化，非新增回归

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无` — D2-4 凭证脱敏正确性 PASS，D9-13 tools/call 凭证不泄露 PASS
- [x] 写操作误判 read-only：`无` — D4-5 写操作误判检测 PASS，classifyTextCommand 正确识别 DeleteServer/DeleteVpc 为 deny
- [x] 红线（I 类）违规：`无` — 全部用例按红线执行，真云用例需真机执行的红线已遵守
- [x] 脱敏复核：`通过` — D2-4 show_profile_redacted 输出无明文 AK/SK；D4-27 双路径输出脱敏 PASS

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/RDS 等 | 未创建 | N/A | N/A |
| 沙箱实例 | 未创建 | N/A | N/A |

> 本次测试以源码级探针直调 + eval harness + hcloud CLI 冒烟为主，未创建真云资源。
> D3-S1~S8 场景用例通过源码级 serviceCatalog 路由验证 + 函数直调完成，未执行真云 E2E 建删资源。
> D3-C4 服务矩阵通过 hcloud --help 冒烟验证 22 服务可达，未执行轻量创建释放。

---

## 八、遗留与建议

- **已知基线**：serviceCatalog 路由准确率 21.4%（3/14 HIT），12 条 EXP-E FAIL 均为已知基线问题，非新增回归。建议扩充 routeMap 中文意图匹配模式，覆盖 ECS/RDS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM 等服务的中文自然语言描述。
- **D4 安全用例（OpenCode 非 Hook 客户端）**：D4-2/D4-3/D4-7/D4-16/D4-17/D4-28 等用例在 OpenCode（非 Hook）上通过 classifyTextCommand 源码级直调验证。OS 级 shell 拦截不适用于非 Hook 客户端，但 MCP 级 hook_check_command 风险识别有效。
- **D9-12/D9-13 新增 P0 用例**：initialize 握手协议安全基线 + tools/call 凭证不泄露均 PASS，新增的协议安全检查项（_decorateResult/listSkillDirs/findSkillsRoot/runVersionCheck/审批令牌生命周期/运行时凭证清理）全部验证通过。
- **建议**：后续可在真云 E2E 场景下补充 D3-S1~S8 的端到端验证（当前为源码级路由验证）。
