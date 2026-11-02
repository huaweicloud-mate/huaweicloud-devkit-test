# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-03 05:30（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-03-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 3 个 P0 缺陷未修复）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.13-next.0`（npm @next，gitHead `47170d1f`） |
| 工具全集 | `46`（`tools/list` 实测，文档声称 43，见缺陷 #11） |
| hcloud / 依赖 | hcloud 已配置（cn-north-4 AKSK） |
| 真云凭证 | `cn-north-4`（AKSK，已就绪） |
| 测试类型 | 源码级探针 / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39（合计 146） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn `mcp-server.mjs` 走 JSON-RPC + 真机 `hcloud` 建删资源；结果落 `stdout.log`，证据统一落 `evidence/<case-id>/`。全量 146 条用例由 61 个去重探针分组驱动，今日全部重新执行。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146 |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 131 / 10 / 3 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 92.25% |
| P0 / P1 / P2 缺陷 | 3 / 3 / 5 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本次创建全部归零 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 93 | 有证据且通过 PASS 门禁 |
| FAIL | 9 | 不符预期，根因见缺陷清单 |
| BLOCKED | 3 | 沙箱服务维护（真机实测） |
| SPEC-MISMATCH | 1 | D9-9 取消能力未声明 |
| NOT_RUN | 1 | D1-39 Windows 专属 |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 云主机意图 MISS |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData/DecryptDatakey 明文解密 API 未拦截 | `safety/policy.json:26` | 待提单 |
| 2 | P0 | D4-21 | HCL role.tf 形态 AdministratorAccess/FullAccess 未拦截 | `safety/rules/cloud-risk-rules.json:209` | 待提单 |
| 3 | P0 | D9-12 | 非法时序 tools/list（未 initialize）未拒绝 | `src/mcp-protocol.mjs:61` | 待提单 |
| 4 | P1 | D4-17 | 命令包裹/替换形态未 fail-closed 拦截 | `src/tools.mjs:1310` | 待提单 |
| 5 | P1 | D9-9 | capabilities 未声明取消能力（SPEC） | `src/mcp-protocol.mjs` | 待提单 |
| 6 | P1 | EXP-E01 | serviceCatalog 「云主机」未命中 ECS | `src/tools.mjs:2195` | 待提单 |
| 7 | P2 | D3-S5 | 复合意图未拆分分层命中 | `src/tools.mjs:2195` | 待提单 |
| 8 | P2 | D4-25 | 写操作遥测分类为 cli:invoke 而非 cli:write | `hooks/huaweicloud-safety.py:112` | 待提单 |
| 9 | P2 | D4-26 | findings.evidence secret_key/adminPass 明文残留 | `src/risk-rule-engine.mjs:19` | 待提单 |
| 10 | P2 | D8-9 | sanitizeValue 不脱敏 AK/SK/token | `telemetry/telemetry.mjs:190` | 待提单 |
| 11 | P2 | D8-1 | 文档 43 tools vs 实际 46 不一致 | `hdk/AGENTS.md:27` | 待提单 |

> 全部 11 项缺陷与本日实测一致，根因已定位到源码文件+行号（详见 FINDINGS.md）。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D3-C3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱服务维护中：`sandbox_check_user` 真机实测返回 `HDKIT_SANDBOX_MAINTENANCE` | 沙箱服务恢复后复测 |
| D3-C6 | 设计级 | P1 | BLOCKED | 补环境 | 7 隐式工具真机实测均返回 `HDKIT_SANDBOX_MAINTENANCE` | 沙箱服务恢复后复测 |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | `sandbox_check_user` 真机实测返回 `HDKIT_SANDBOX_MAINTENANCE`，无法建立会话 | 沙箱服务恢复后复测 |
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属升级检测链（EINVAL），Linux/macOS 由 NR3 终端矩阵覆盖 | 无需改（OS 专属豁免） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D4-2 凭证 env 拦截 + D2-4 脱敏均有证据 PASS）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D4-26 findings 脱敏缺陷已记，属产品缺陷非测试泄漏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC `hdk-s7-vpc-mvzr2x0x` (D3-S7) | 是 | 已手动补删 | ShowVpc 返回 VPC.9904 not found |
| 子网 `hdk-s7-subnet-mvzr2x0x` | 是 | 已手动补删 | ShowSubnet 返回 SYS.0404 |
| 安全组 `hdk-s7-sg-mvzr2x0x` | 是 | 已手动补删 | ShowSecurityGroup 返回 VPC.9904 |
| VPC `tctest-d424-probe-x` (D4-24) | 是 | 已手动补删 | ShowVpc 返回 VPC.9904 |
| RDS 实例 (D3-S7) | 是 | 探针已删 | ListInstances count=0 |
| ECS 实例 (D3-C1) | 是 | 探针已删 | 归零验证 true |

> 说明：D3-S7 探针因 RDS 异步删除致 `DeleteVpc/DeleteSubnet/DeleteSecurityGroup` 在探针窗口内未确认（探针清理检测正则不完整），已手动补删并归零验证（测试侧时序，非产品缺陷）。D4-24 审批流「重复确认」探针真实执行 `CreateVpc` 用于验证 already_processed，未自清理，已手动补删。其余未列资源（DSH 客户端 `hdk-s7-*-mvzrhale`、历史 `tctest-tmr-*`、昨日 `hdk-s7-sg-mvycrs7a`）非本次创建，未碰。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（取消能力未声明，历史 #698）
- 缺陷与昨日（2026-11-02）完全一致，均为历史未修复问题，提单需走 file_issue.py 历史查重
- 沙箱服务（sandbox）持续 `HDKIT_SANDBOX_MAINTENANCE`，D3-C3/C6/S3 连续两天 BLOCKED，建议反馈沙箱服务侧尽快恢复
- 建议：D3-S7 清理检测正则（`/still used|VPC.0213/`）不完整导致误判删除成功，建议改为删除后反向查询确认；D4-24 审批流探针建议增加自清理，避免真实 CreateVpc 残留
