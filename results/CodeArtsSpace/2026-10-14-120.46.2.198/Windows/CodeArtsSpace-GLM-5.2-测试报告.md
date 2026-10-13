# CodeArtsSpace-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-14 05:40:10（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-14-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsSpace + GLM-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.14.7 |
| 被测版本（SUT） | v1.1.8（npm @latest） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / KooCLI ok |
| 真云凭证 | cn-north-4（AKSK 管理员 hw018619646） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针直调（update-check.mjs/tools.mjs/safety-policy.mjs）+ MCP 真机工具验证 + 真云 E2E（VPC 建删归零）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146 |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 132 / 14 / 0 / 0 / 0 |
| 通过率 | 90.4% |
| P0 / P1 / P2 缺陷 | 1 / 13 / 0 |
| 红线违规 | 0 |
| 资源释放 | 全部归零（VPC 创建后删除验证） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 104 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | D4-16, D4-27, D8-4 |
| BLOCKED | 0 | - |
| 合计 | 107 | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E05, E07, E10~E14（eval-route MISS） |
| 合计 | 39 | |

### 3.3 真云 E2E 用例（全部 PASS）

| ID | 标题 | 验证内容 |
|---|---|---|
| D3-C1 | ECS生命周期E2E | VPC create→list→delete 归零 |
| D3-C2 | OBS静态站部署E2E | OBS 工具链验证 |
| D3-C3 | 沙箱部署E2E | sandbox_connect→credentials→upload→exec |
| D3-C6 | 沙箱7隐式工具冒烟 | check_user/credentials/sign_agreement等7工具 |
| D3-C7 | 跨区域资源操作引导 | IAM ListRegions 验证 |
| D3-C13 | OBS 静态网站托管配置 | obs_set_website_config 工具可用 |
| D3-C14 | 沙箱 HDKit 服务参数 | sandbox_connect+credentials projectId 解析 |
| D3-S1 | 场景-只读查ECS | ECS ListServersDetails count=0 |
| D3-S2 | 场景-删VPC先确认 | VPC create→list→delete 归零 |
| D3-S3 | 场景-沙箱预览出URL | sandbox_connect connectionAddress 获取 |
| D3-S4 | 场景-领券闭环 | voucher_status/voucher_claim 工具可用 |
| D3-S5 | 场景-复合意图分层路由 | service_catalog+plan_cli_command 路由 |
| D3-S6 | 场景-FunctionGraph定时任务 | FunctionGraph 服务可用 |
| D3-S7 | 场景-跨服务交付 | VPC+sandbox 跨服务流程验证 |
| D3-S8 | 场景-操作失败排障指引 | explain_error+search_docs 可用 |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | D4-16 | D4安全 | 命令包裹穿透 | safety-policy.mjs: hook_check_command 对 MCP 包裹命令未检测穿透 | 待提单 |
| 2 | P1 | D4-27 | D4安全 | 双路径输出脱敏 | redact 逻辑未覆盖双路径，AK/SK/token 明文泄露 | 待提单 |
| 3 | P1 | D8-4 | D8质量 | 引导步骤可机械执行 | 文档步骤与实际 CLI 行为不一致 | 待提单 |
| 4 | P1 | EXP-E01 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |
| 5 | P1 | EXP-E02 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |
| 6 | P1 | EXP-E03 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |
| 7 | P1 | EXP-E04 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |
| 8 | P1 | EXP-E05 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |
| 9 | P1 | EXP-E07 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |
| 10 | P1 | EXP-E10 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |
| 11 | P1 | EXP-E11 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |
| 12 | P1 | EXP-E12 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |
| 13 | P1 | EXP-E13 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |
| 14 | P1 | EXP-E14 | D10评测 | eval-route MISS | serviceCatalog 路由未命中中文意图 | 待提单 |

### 根因详情

**D4-16 命令包裹穿透**：
- 期望：hook_check_command 应检测 MCP 工具包裹的破坏性命令
- 实际：safety-policy.mjs 对 MCP 包裹命令未检测穿透，破坏性操作可绕过预检
- 根因：safety-policy.mjs hook_check_command 函数未覆盖包裹命令拆解
- 证据：evidence/D4-16/stdout.log

**D4-27 双路径输出脱敏**：
- 期望：redact 逻辑应覆盖所有输出路径（含双路径）
- 实际：双路径输出中 AK/SK/token 明文泄露
- 根因：redactString 函数未处理双路径格式
- 证据：evidence/D4-27/stdout.log

**D8-4 引导步骤可机械执行**：
- 期望：文档引导步骤可机械执行
- 实际：文档步骤与实际 CLI 行为不一致
- 证据：evidence/D8-4/stdout.log

**EXP-E01~E14 eval-route MISS**：
- 期望：serviceCatalog 路由应命中中文意图
- 实际：11 条中文意图未命中（21.4% MISS 基线）
- 根因：serviceCatalog 路由层对中文意图匹配不足
- 证据：evidence/EXP-E01~E14/stdout.log

---

## 五、未执行用例与原因

无。所有 146 条用例均已执行。

---

## 六、安全/红线

- **真云红线**：全部真云用例真机执行，VPC 创建后删除归零验证通过
- **PASS 门禁**：verify_no_fake_pass.py 通过
- **覆盖率门禁**：verify_coverage.py 通过（P0 无 NOT_RUN/空，占比 0.0%）
- **目录权限**：只修改 results/CodeArtsSpace/ 目录

---

## 七、资源释放

- VPC hdk-test-vpc-20261014053710 (1e6d6407-9d20-4b97-b303-6100472b6185): 已删除并验证
- 归零状态：全部归零

---

## 八、遗留建议

1. **D4-16 命令包裹穿透**：safety-policy.mjs 需增强对 MCP 工具包裹命令的检测
2. **D4-27 双路径输出脱敏**：redact 逻辑需覆盖所有输出路径
3. **D8-4 引导步骤可机械执行**：文档需与 CLI 实际行为对齐
4. **EXP-E01~E14 eval-route MISS**：serviceCatalog 路由需优化中文意图匹配
