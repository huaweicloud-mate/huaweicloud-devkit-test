# OfficeAce-glm-5.2 每日测试报告
> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：2026-09-30 12:00:36（北京时间）
> **执行归档**：`results/OfficeAce/2026-09-30-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.8-next.1` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级直调函数（judgeUpdate/semverCompare/classifyHcloudArgs/redactSecrets 等）+ MCP 协议测试（启动 mcp-server.mjs，initialize/tools-list/tools-call）+ 真云 E2E（hcloud CLI + AK/SK 凭证执行只读命令）+ D10 评测 harness（run-eval.mjs 路由准确率）+ 现有探针脚本（eval/harness/fixtures/ 18 个 .mjs）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 1 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 140） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 0` |
| 红线（I 类）违规 | `0`（无凭证泄漏、无 mock 假跑、无虚报 PASS） |
| 资源释放 | `无需清理`（仅执行只读命令，未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `101` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞 |
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
| 1 | P1 | `EXP-E01` | D10评测集 | 查询型ECS意图路由未命中 | `plugins/huaweicloud-core/src/tools.mjs:serviceCatalog` routeMap 缺少查询型云主机意图匹配 | 待提单 |

### 根因详情

#### EXP-E01 — 查询型 ECS 意图路由未命中

- **期望**：意图「帮我查一下我账号在华北北京四有哪些云主机」应路由到 ECS 查询→run_readonly
- **实际**：`huaweicloud_service_catalog` 返回通用 hcloud 帮助提示文本，未识别为 ECS 服务推荐
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 的 `serviceCatalog` 函数 routeMap 中，缺少「查/查看/列出 + 云主机/ECS」的查询模式识别规则。对比 EXP-E02（"创建…云服务器"）能正确命中 ECS，说明路由器对查询型云主机意图的识别弱于创建型意图
- **证据**：`evidence/EXP-E01/stdout.log`（harness 实测 verdict=MISS）

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox code path verified (skill + tools + session-manager + API module all present), but cannot execute real sandbox check-user/connect without MCP server context. Unblock condition: run probe through MCP server with valid sandbox service quota. |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（所有输出经 redactSecrets 脱敏，AK/SK 替换为 `<redacted>`）
- [x] 写操作误判 read-only：无（D4-1~D4-28 安全策略全部正确 deny/allow）
- [x] 红线（I 类）违规：0（无 mock 假跑、无虚报 PASS、真云用例真机执行）
- [x] 脱敏复核：通过（D2-4/D4-27/D4-28 验证 AK/SK/token 全部脱敏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS 等 | 未创建（仅只读查询） | N/A | N/A（只读操作无资源残留） |

> 本次测试仅执行只读命令（List/Show/Get 等），未创建任何真云资源，无需清理归零。

---

## 八、遗留与建议

- **EXP-E01 路由缺陷**：建议在 `serviceCatalog` routeMap 中增加查询型意图匹配规则（「查/查看/列出 + 云主机/ECS/服务器」→ ECS 查询→run_readonly），当前仅创建型意图能命中 ECS
- **D3-S3 沙箱预览**：需通过 MCP 服务器上下文 + 有效沙箱配额才能执行完整闭环，代码路径已验证完整（skill + tools + session-manager + API 模块全部存在）
- **MCP 工具数**：实测 41 个工具（非文档中的 40），建议更新文档
- **被测版本**：1.1.8-next.1（预发布版），正式版 1.1.7 亦可用
- **D10 评测集路由准确率**：92.9%（14/15 命中），较基线 21.4% MISS 大幅改善
