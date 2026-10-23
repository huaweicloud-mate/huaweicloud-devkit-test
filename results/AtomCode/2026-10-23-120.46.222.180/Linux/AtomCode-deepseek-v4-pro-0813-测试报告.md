# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-23 05:43:01（北京时间）
> **执行归档**：`results/AtomCode/2026-10-23-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.12 (gitHead 4ed07801)` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（`classifyTextCommand`/`callTool`/`serviceCatalog`/`redactString`/`sanitizeValue` 等）；CLI 真机执行（`huaweicloud-devkit doctor`/`status`）；MCP 协议探针（`mcp-server.mjs` 直连 initialize/tools/call）；真云 E2E（`realcloud_e2e.mjs`/`hcloud` 建删 ECS·VPC·子网·OBS·沙箱并归零）。决策/结果落 `stdout.log`，证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 13 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `91.0%` |
| P0 / P1 / P2 新增缺陷 | `1 / 9 / 3` |
| 红线（I 类）违规 | `0`（D2-4/D4-27 脱敏缺陷为既有缺陷复现，非本轮新增泄露事件） |
| 资源释放 | `已归零（ECS/VPC/子网/OBS 桶均已删，沙箱会话已关）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:34-62` | 待提单 |
| 2 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E | 测试侧（归零轮询窗口短，资源已归零） | 非产品缺陷 |
| 3 | P1 | `D3-C2` | D3功能 | OBS静态站部署E2E | 测试侧（`hcloud OBS mb` 成功但非零 exit-code 假阴性） | 非产品缺陷 |
| 4 | P1 | `D3-C3` | D3功能 | 沙箱部署E2E | 测试侧（沙箱 8080 端口被占漂移 8083） | 非产品缺陷 |
| 5 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 测试侧（账号仅 cn-north-4 项目，跨区域创建 VPC.0501） | 非产品缺陷 |
| 6 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:2188-2443` | 待提单 |
| 7 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | `tools.mjs:2188-2443` | 待提单 |
| 8 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | `tools.mjs:2188-2443` | 待提单 |
| 9 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:2188-2443` | 待提单 |
| 10 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `huaweicloud-safety.py:46` | 待提单 |
| 11 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:45` | 待提单 |
| 12 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry.mjs:189-196` | 待提单 |
| 13 | P1 | `EXP-E01` | D10评测 | 中文「云主机」意图未路由 | `tools.mjs:2188-2443` | 待提单 |

### 根因详情

> 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」详见同目录 `FINDINGS.md`（#1~#14）。核心既有缺陷复现：中文意图 `serviceCatalog` 路由 MISS（#3~#6、#8、#13，`tools.mjs:2188-2443` 仅英文 token），凭证脱敏正则缺 JSON 引号键/小写键（#1、#2，`safety-policy.mjs:34-45`）。真云 4 项（D3-C1/C2/C3/C7）为测试侧环境/断言问题，资源已归零。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属用例（Windows 专属），本机 Linux，按状态口径标 NOT_RUN；Linux 侧由展开级 EXP-NR 代表覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针均为测试样本凭证 `AKID123456`/`secret789` 等，非真实 AK/SK）
- [x] 写操作误判 read-only：`0`（D4-18/D4-19 审批语义 PASS，写操作正确走 allow/deny）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始真实凭证/未脱敏日志（真云凭证 `credentials.json` 未进入证据）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1 `3a5fb502-c380-4b0a-a0ad-68644ca8903e`） | 是 | 已删（DeleteServers） | ListServersDetails 确认消失 |
| VPC/子网（D3-C1） | 是 | 已删 | 探针 finally 反序删除 |
| OBS 桶（D3-C2 `testbot3-hermes-obs-*`） | 是 | 已删（OBS rm -f） | 删桶归零 success |
| 沙箱会话（D3-C3/D3-C6） | 是 | close_session | 会话已关，无残留 |

> 真云只删本次创建资源（统一时间戳名 `testbot3-hermes-*` / `-2704*`）；删除前盘点 + 白名单，未删既有/他人资源。账号内其余 ECS 均属其他 agent（testbot1/testbot3），未触碰。残留即 FAIL。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（`mcp-protocol.mjs:47-49` capabilities 未声明 `cancellation`，协议契约漂移，见 FINDINGS #7）。
- 本轮未覆盖/环境边界：`D1-39`（Windows 专属 OS 用例，Linux 侧跳过）；跨区域 E2E（账号仅 cn-north-4 项目，`ap-southeast-3` 创建受限，见 FINDINGS #14）。
- 建议：优先修复 D2-4（P0 脱敏，I 类红线）与中文意图路由（`serviceCatalog` 中文同义词，覆盖 D3-S1/S2/S3/S5/EXP-E01 多个用例）。
