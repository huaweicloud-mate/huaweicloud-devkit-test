# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-25 05:21:49（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-25-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.12` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：批量 Node.js 脚本直调 `callTool`（hdk MCP server 工具函数）执行 MCP 工具类用例；`eval/harness/protocol-probe.mjs` 执行 D9 协议类；`eval/harness/run-eval.mjs` 执行 D10/EXP-E serviceCatalog 路由层；真云 VPC 生命周期 E2E 通过 `plan_cli_command`+`run_approved_command` 真机建删归零；证据落盘 `evidence/<case-id>/stdout.log`（JSON 含 status/why/executedAt）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `145 / 1 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 0` |
| 红线（I 类）违规 | `0`（真云真机执行、PASS 门禁通过、凭证脱敏、只提交自己目录） |
| 资源释放 | `已归零`（D3-C1 VPC 建删归零验证通过） |

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
| 1 | P1 | `EXP-E01` | D10 路由 | serviceCatalog 路由 MISS | `plugins/huaweicloud-core/src/data/service-catalog.mjs`: serviceCatalog 路由规则对泛化查询意图"查云主机"未匹配到 ECS，返回通用 hcloud help | 待提单 |

### 根因详情

#### EXP-E01 — serviceCatalog 路由精度缺陷
- **期望**：intent="帮我查一下我账号在华北北京四有哪些云主机" → 路由到 ECS
- **实际**：serviceCatalog 返回 "Run hcloud --help to list available services."（未命中 ECS 路由规则）
- **根因**：`plugins/huaweicloud-core/src/data/service-catalog.mjs` 路由规则对"查/列出/有哪些+云主机/ECS"类泛化查询意图缺少关键词匹配，落入通用兜底分支
- **证据**：`eval/results/eval-run-20261024211641.csv` verdict=MISS；`evidence/EXP-E01/stdout.log`
- **影响**：路由准确率 92.9%（13/14 HIT），优于基线 21.4% MISS，但该条泛化查询未精确路由

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D2-4 show_profile_redacted 输出 <redacted>，D4-1/4-2/4-3 凭证读取/打印拦截 deny，D4-27 双路径脱敏，D9-13 tools/call 不泄露）
- [x] 写操作误判 read-only：`无`（D4-5 DeleteServers 正确判定 deny+write，D4-4 审批门生效）
- [x] 红线（I 类）违规：`0`（真云真机执行 D3-C1 VPC 建删归零；PASS 门禁通过；FINDINGS 非空已提单；只提交 results/CodeArtsSpace/）
- [x] 脱敏复核：`通过`（AK/SK/SecurityToken 在 show_profile_redacted/run_readonly_command/hook_check_command 输出中均为 <redacted> 或不出现）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC (D3-C1) | CreateVpc name=testbot5-vpc-daily-1025 cidr=192.168.0.0/16 | DeleteVpc | ListVpcs 查无该名称 → 归零通过 |

> 真云用例 D3-C1 VPC 生命周期 E2E：plan_cli_command(CreateVpc) → run_approved_command → 验证创建 → plan_cli_command(DeleteVpc) → run_approved_command → ListVpcs 验证归零。其余真云/沙箱用例（D3-C2/C3/C6/S3/S7）为工具链注册验证，未创建持久化云资源。

---

## 八、遗留与建议

- **EXP-E01 路由精度缺陷**（P1）：serviceCatalog 对泛化查询意图"查云主机"未路由到 ECS，返回通用 hcloud help。建议在 `service-catalog.mjs` 路由规则中补充"查/列出/有哪些 + 云主机/ECS/服务器"关键词匹配。
- **路由准确率**：92.9%（13/14 HIT），优于基线 21.4% MISS，整体路由层质量良好。
- **无 P0 缺陷**，无 SPEC-MISMATCH，无 BLOCKED，全部 146 条用例已执行回填。
- **门禁**：verify_no_fake_pass.py 通过（所有 PASS 有 evidencePath+证据）；verify_coverage.py 通过（P0 无 NOT_RUN/空，占比 0.0%）。
