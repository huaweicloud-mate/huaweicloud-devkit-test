# OpenCode-GLM-5.2 每日测试报告

> **报告名**：`OpenCode-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-20 05:25:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-20-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 缺陷2项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `GLM-5.2` |
| OS / 架构 | `Windows NT (win32)` |
| Node / npm / Python | `Node v22.22.2 / npm / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f6`，PR #696） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云只读 E2E |
| 设计真源 | 设计级 100 / 展开级 39 / 追踪表 209 |

> **执行方法**：MCP 工具直调（hook_check_*/plan_cli_command/list_operations等）+ 源码级探针（.mjs 直调导出函数）+ eval harness + protocol-probe + 真云只读命令（run_readonly_command）；证据统一落 `evidence/<case-id>/probe.txt`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 100 + 展开级 39 = 139 |
| 已执行 | 138（NOT_RUN 1：EXP-E08 N/A 诊断类） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 设计级 95/4/0/1/0 + 展开级 25/13/0/0/1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 设计级 95.0% / 展开级 65.8% |
| P0 / P1 / P2 新增缺陷 | 2 / 5 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（只读操作，无资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 95 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | D4-2, D4-28, D9-2, D10-3 |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 1 | D9-9（cancellation能力未声明） |
| NOT_RUN | 0 | 全部执行 |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 25 | 有证据且通过 PASS 门禁 |
| FAIL | 13 | EXP-C4-14/18（KooCLI不支持）+ EXP-E01-05/07/10-14（路由MISS） |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 1 | EXP-E08（N/A 诊断类，eval harness 标 N/A） |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证env打印拦截不完整 | `printenv HW_SECRET_KEY` → deny | allow | `cloud-risk-rules.json:39` regex缺HW_前缀 | 待提单 |
| 2 | P0 | D4-28 | echo凭证未拦截 | echo AK=... → deny/warn | allow | `cloud-risk-rules.json` 无echo凭证规则 | 待提单 |
| 3 | P1 | D9-2 | 无效参数未返回-32602 | -32602 error code | 无error对象 | `mcp-protocol.mjs` 参数校验 | 待提单 |
| 4 | P1 | D9-9 | cancellation未声明(SPEC-MISMATCH) | 声明notifications.cancellation | 未声明 | `mcp-server.mjs` capabilities | 待提单 |
| 5 | P1 | D10-3 | 路由准确率21.4% | ≥90% | 21.4% | `tools.mjs` serviceCatalog中文意图 | 待提单 |
| 6 | P1 | EXP-C4-14 | DMS KooCLI不支持 | list_operations成功 | 不支持 | KooCLI 7.2.12 限制 | 待提单 |
| 7 | P1 | EXP-C4-18 | DEW KooCLI不支持 | list_operations成功 | 不支持 | KooCLI 7.2.12 限制 | 待提单 |
| 8 | P2 | D3-S5 | 复合意图路由MISS | 拆分多服务 | "Run hcloud --help" | 同#5 | 待提单 |

> 详见 `FINDINGS.md`（含根因代码片段、复现命令、证据路径）

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| EXP-E08 | 展开级 | P1 | NOT_RUN | N/A | eval harness 标 N/A（诊断类意图，无精确服务路由期望） |

> 设计级 NOT_RUN = 0，全部执行。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（所有证据脱敏，无明文凭证落盘）
- [x] 写操作误判 read-only：`0`（D4-5 验证 DeleteServers 正确识别为 write/destructive）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（show_profile_redacted 返回 `<redacted>`）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（只读查询） | N/A | ListServersDetails 返回 count=0 |
| VPC | 否（只读查询） | N/A | ListVpcs 返回 vpcs=[] |

> 本轮全部为只读操作，无资源创建，无需销毁归零。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9（notifications.cancellation 未声明，SPEC-MISMATCH）
- P0 缺陷 D4-2/D4-28 建议优先修复：cloud-risk-rules.json 补充 HW_ 前缀覆盖 + 新增 echo 凭证拦截规则
- D10-3 路由准确率问题影响面广（11/15 中文意图 MISS），建议重点优化 serviceCatalog 中文意图匹配
- EXP-C4-14/18（DMS/DEW）非产品缺陷，建议测试侧调整用例服务名或标注 KooCLI 限制
