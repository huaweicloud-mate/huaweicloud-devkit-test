# OfficeAce-testbot4 每日测试报告
> **报告名**：`OfficeAce-testbot4-测试报告.md`
> **生成时间**：2026-11-04 05:50:00（北京时间）
> **执行归档**：`results/OfficeAce/2026-11-04-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项；3 项缺陷均命中历史单，不重复提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `testbot4`（Windows） |
| OS / 架构 | `Windows 11`（node v22.22.2） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.3`（npm @next，gitHead `7ad8a53387b55f940c70d986cf47401089b14fdb`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，判定结果落 `stdout.log`；路由基线经 `node eval/harness/run-eval.mjs` 实测；证据统一归档 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 3 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 0`（均命中历史单，不重复提单） |
| 红线（I 类）违规 | `1`（D2-4 凭证脱敏被大小写绕过，SK 全文泄漏） |
| 资源释放 | `无真云调用（沙箱用例 BLOCKED），无资源残留` |

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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（小写 ak=/sk= 明文泄漏） | `safety-policy.mjs:45` AK/SK 正则未加 `i` 大小写绕过 | 历史问题，不重复提单（见 HISTORY_LINKS.md） |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截（KMS DecryptData allow） | `policy.json` blockedSecretOperations 未含 DecryptData | 历史问题，不重复提单（见 HISTORY_LINKS.md） |
| 3 | P1 | `EXP-E01` | 路由基线 | serviceCatalog 中文「云主机」未识别 ECS | `tools.mjs:1815` ECS 路由缺中文关键词 | 历史问题，不重复提单（见 HISTORY_LINKS.md） |

### 根因详情

1. **D2-4 凭证脱敏正确性**：`redactString` 的 `/(AK|SK)\s*[:=]\s*(...)/g` 缺少 `i` 标志，仅匹配大写，小写 `ak=`/`sk=` 未遮挡，SK 全文泄漏（实测 `akLeak=true skLeak=true`）。证据 `evidence/D2-4/stdout.log`。
2. **D4-3 明文 secret API 拦截**：`blockedSecretOperations = ["ShowSecretVersion","DownloadSecret","GetSecretValue"]` 未纳入 KMS `DecryptData`，判为 `decision=allow`，明文 secret 可进 agent 上下文。证据 `evidence/D4-3/stdout.log`。
3. **EXP-E01 服务路由漏配**：`serviceCatalog()` ECS 路由 keywords 仅英文，中文「云主机」未命中，返回兜底 `Run hcloud --help...`，`verdict=MISS expect=ECS`。证据 `evidence/EXP-E01/stdout.log`。

---

## 五、未执行用例与原因

### BLOCKED（环境/客户端限制，非产品缺陷）

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | AGENT_TOOLKIT_MODE=local is DSH-client-specific |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox E2E requires DevStation upstream connection |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit requires DevStation upstream |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox requires DevStation upstream |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Sandbox requires DevStation upstream |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`1`（D2-4 SK 全文泄漏，历史问题 #1065/#1055 等已提过）
- [x] 写操作误判 read-only：`无`（本轮无 write/execution 误判）
- [x] 红线（I 类）违规：`1`（D2-4 大小写绕过，凭证脱敏失效）
- [x] 脱敏复核：D2-4 未通过（小写 ak=/sk= 泄漏）；其余脱敏项通过

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 0 | 0 | 未涉及（沙箱/E2E 用例 BLOCKED，无真云调用） |

---

## 八、遗留与建议

- 3 项 FAIL（D2-4 / D4-3 / EXP-E01）均命中上游仓历史单，本轮不重复开单；已生成 `HISTORY_LINKS.md` 记录强关联单链接。
- 建议修复方向：D2-4 将 AK/SK 正则加 `i` 标志或并入统一键名/值脱敏路径；D4-3 将 KMS `DecryptData` 纳入 `blockedSecretOperations`；EXP-E01 为 ECS 路由补充中文关键词（云主机/云服务器）。
- 沙箱相关 5 例 BLOCKED 需在具备 DevStation 上游网络环境（真实沙箱）时补跑。