# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：`2026-09-18 07:55:00`（北京时间）
> **执行归档**：`results/CodeArtsWork/2026-09-18-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 用例，P0 全部通过）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsWork` + `GLM-5.2` |
| OS / 架构 | `Windows Server 2022 / x86_64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f6`） |
| 工具全集 | `40`（MCP TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK / 已使用只读验证）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云只读 / eval harness |
| 设计真源 | 设计级 80 / 展开级 39 / 追踪表 |
| daily 基础用例 | 设计级 80 / 展开级 39 |

> **执行方法**：探针脚本直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；CLI 真机执行记录日志；MCP 工具调用（list_operations/run_readonly_command/show_profile_redacted/auth_status）；eval harness 跑 serviceCatalog 路由层；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `119`（设计级 80 + 展开级 39） |
| 已执行 | `119` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `105 / 13 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `89.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 11 / 2` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（只读操作，无资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 80 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| NOT_RUN | 0 | — |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 25 | 有证据且通过 PASS 门禁 |
| FAIL | 13 | EXP-C4-14(DMS)/EXP-C4-18(DEW) KooCLI不支持 + EXP-E01~E14 eval harness MISS |
| BLOCKED | 1 | EXP-E08 诊断类意图需 LLM harness |
| NOT_RUN | 0 | — |

### 3.3 按优先级

| 优先级 | PASS | FAIL | BLOCKED | NOT_RUN |
|---|---|---|---|---|
| P0 | 20 | 0 | 0 | 0 |
| P1 | 65 | 11 | 1 | 0 |
| P2 | 20 | 2 | 0 | 0 |

---

## 四、缺陷清单

### 4.1 FAIL 用例（13 条）

| 用例 ID | 优先级 | 描述 | 根因 |
|---|---|---|---|
| EXP-C4-14 | P1 | DMS 只读规划冒烟 | KooCLI 7.2.12 不支持服务名 DMS（`[USE_ERROR]不支持的服务名称:DMS`） |
| EXP-C4-18 | P1 | DEW 只读规划冒烟 | KooCLI 7.2.12 不支持服务名 DEW（`[USE_ERROR]不支持的服务名称:DEW`） |
| EXP-E01 | P1 | 评测集: 查云主机 | serviceCatalog 路由未命中中文意图「帮我查一下我账号在华北北京四有哪些云主机」→ 期望 ECS，实际返回通用帮助 |
| EXP-E02 | P1 | 评测集: 创建云服务器 | serviceCatalog 路由未命中「创建一台 2C4G 的 Ubuntu 云服务器」→ 期望 ECS |
| EXP-E03 | P1 | 评测集: 部署静态网站 | serviceCatalog 路由未命中「把本地 dist 目录部署成一个公网静态网站」→ 期望 OBS，实际 Sandbox+DevStation |
| EXP-E04 | P1 | 评测集: 绑定 EIP | serviceCatalog 路由未命中「给这台服务器绑定一个弹性公网IP」→ 期望 EIP |
| EXP-E05 | P1 | 评测集: 查 RDS 状态 | serviceCatalog 路由未命中「看一下我的云数据库MySQL实例的状态」→ 期望 RDS |
| EXP-E07 | P1 | 评测集: 配置备份 | serviceCatalog 路由未命中「给生产环境的服务器配置一个每日备份策略」→ 期望 CBR |
| EXP-E10 | P1 | 评测集: 部署函数 | serviceCatalog 路由未命中「部署一个函数处理图片自动压缩」→ 期望 FunctionGraph |
| EXP-E11 | P1 | 评测集: 查费用 | serviceCatalog 路由未命中「查一下我账号这个月的费用情况」→ 期望 BSS |
| EXP-E12 | P1 | 评测集: 云监控 | serviceCatalog 路由未命中「把应用日志指标推送到云监控告警」→ 期望 CES |
| EXP-E13 | P1 | 评测集: HTTPS证书 | serviceCatalog 路由未命中「申请HTTPS证书并配置到我的域名」→ 期望 ELB |
| EXP-E14 | P1 | 评测集: IAM审计 | serviceCatalog 路由未命中「我账号下的用户都有哪些权限 帮我审计一下」→ 期望 IAM |

### 4.2 BLOCKED 用例（1 条）

| 用例 ID | 优先级 | 描述 | blockedReason |
|---|---|---|---|
| EXP-E08 | P1 | 评测集: ECS诊断 | 诊断类意图无确定路由，需 LLM harness（serviceCatalog 路由层无法代理诊断类意图） |

---

## 五、未执行用例与原因

无 NOT_RUN 用例。所有用例均已执行或标记 BLOCKED。

---

## 六、安全/红线

| 检查项 | 结果 |
|---|---|
| 真云用例真机执行 | ✅ 只读操作（list_operations/run_readonly_command），无资源创建 |
| 凭证脱敏 | ✅ show_profile_redacted 输出 AK/SK 均为 `<redacted>` |
| PASS 门禁 | ✅ 所有 PASS 用例均有 evidencePath 且证据存在 |
| 覆盖率门禁 | ✅ P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0% |
| 目录权限 | ✅ 只提交 `results/CodeArtsWork/` 目录 |

---

## 七、资源释放

本次测试为只读操作（list_operations/run_readonly_command/show_profile_redacted/auth_status），未创建任何云资源，无需释放。

---

## 八、遗留建议

1. **EXP-C4-14/DMS、EXP-C4-18/DEW**：KooCLI 7.2.12 不支持 DMS/DEW 服务名。建议：① KooCLI 后续版本添加 DMS/DEW 支持；② 或 MCP skill 层面通过 `huawei-smn-dms`/`huawei-dew` skill 覆盖（已有 skill，但 KooCLI 层缺失）。
2. **EXP-E01~E14 eval harness MISS（11/14）**：serviceCatalog 中文意图路由准确率仅 21.4%（基线水平）。根因在 `plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 函数，中文意图→服务映射覆盖不足。建议：扩充 serviceCatalog 中文意图关键词映射表，覆盖 ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM 等服务的中文别名。
3. **EXP-E08 BLOCKED**：诊断类意图（「我的ECS启动失败了 帮我分析原因」）需真实 LLM Agent 会话才能评测，serviceCatalog 路由层无法代理。待 ITER-004+ LLM harness 建成后补测。
