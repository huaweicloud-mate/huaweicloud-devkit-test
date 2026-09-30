# OfficeAce-glm-5.2 每日测试报告

> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：2026-09-30 11:55:00（北京时间）
> **执行归档**：`results/OfficeAce/2026-09-30-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷；1 历史复现 P1 + 1 环境阻塞）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows` |
| Node / npm / Python | `Node v22.22.2 / npm 12.1.0 / Python 3.11.9` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针（.mjs）直调 `plugins/huaweicloud-core/src/*` 导出函数，判定结果落入 `evidence/<case-id>/stdout.log`；CLI 真机执行记录日志；证据统一落入 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 1 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 140） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（1 项 P1 为历史复现，不重复提单） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本轮未触发真云资源创建，无需释放` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `101` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境阻塞（D3-S3，见阻塞表） |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期（EXP-E01，历史复现） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | D10评测集 | serviceCatalog 路由未命中 ECS(查云主机) | `plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层未匹配「云主机」关键词到 ECS | 历史复现，不重复提单 |

### 根因详情

- **EXP-E01**：「帮我查一下我账号在华北北京四有哪些云主机」期望路由 `ECS查询→run_readonly`，实际未命中返回 hcloud 帮助提示（verdict=MISS）。根因：serviceCatalog 路由层中文关键词覆盖不足，未匹配「云主机」到 ECS，属已知历史缺陷 #705/#828/#826/#805，本次为复核复现，不重复开单。证据：`evidence/EXP-E01/stdout.log`。

---

## 五、未执行用例与原因

### BLOCKED

| 用例ID | 维度 | 标题 | 分类 | 阻塞原因 |
|---|---|---|---|---|
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 【补环境】 | 沙箱代码路径（skill + tools + session-manager + API module）全部存在，但无 MCP server 上下文 + 有效 sandbox 服务配额无法真跑 check-user/connect。解阻条件：经 MCP server 带有效 sandbox 配额执行。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无
- [x] 写操作误判 read-only：无
- [x] 红线（I 类）违规：0
- [x] 脱敏复核：本轮证据未包含真实 AK/SK / 明文凭证

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/OBS/Sandbox） | 0（本轮未触发真云创建） | 0 | N/A |

> 本轮无真云资源创建，无需释放归零。

---

## 八、遗留与建议

- EXP-E01（serviceCatalog 中文意图路由未命中 ECS）为长期历史缺陷，建议上游在 `mcp-server.mjs` serviceCatalog 路由层补齐「云主机」等中文关键词到 ECS 映射后可复测收敛。
- D3-S3 沙箱预览出 URL 需真实 MCP 上下文 + sandbox 服务配额，建议在具备 sandbox 配额的环境补测一轮。