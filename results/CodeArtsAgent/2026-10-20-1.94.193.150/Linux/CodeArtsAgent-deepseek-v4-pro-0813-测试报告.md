# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-20（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-20-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，与历史一致）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux x86_64` |
| Node / Python | `Node v22.13.0 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.9`（npm latest，gitHead `05a67b64`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |
| 真云凭证 | `cn-north-4`（AK/SK 已配置 + 只读子账号 test001） |

> **执行方法**：源码级探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，或 spawn `mcp-server.mjs` 驱动 JSON-RPC；D1 安装域真机 CLI（隔离 HOME）；真云 E2E 真机建删归零；D10 评测集走 eval 路由探针；结论落 evidence/<case-id>/。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 10 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC = 142） | `92.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（10 项均历史缺陷） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 本次创建资源全部归零（OBS/EIP/沙箱/FGS/RDS/SG/Subnet/VPC） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，均为历史缺陷 |
| BLOCKED | `3` | Router 配额（D3-C1/D3-S2/D4-14） |
| SPEC-MISMATCH | `1` | D9-9 取消语义未声明 |
| NOT_RUN | `1` | D1-39 Windows 专属 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01「云主机」MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | kms DecryptData 明文 secret API 未拦截 | `safety/policy.json:26` | 历史 |
| 2 | P0 | `D4-21` | HCL/Terraform broad IAM 未拦截 | `risk-rule-engine.mjs` iam-admin-policy 未覆盖 HCL | 历史 |
| 3 | P0 | `D9-12` | initialize 时序未强制 | `mcp-server.mjs:175` | 历史 #699/#774 |
| 4 | P1 | `D4-17` | hook 命令替换内层仍放行 | `risk-rule-engine.mjs` | 历史 #673 |
| 5 | P1 | `EXP-E01` | 中文意图「云主机」MISS | `tools.mjs` serviceCatalog | 历史 |
| 6 | P2 | `D3-S5` | 复合意图分层路由 MISS | `tools.mjs` serviceCatalog | 历史 #11 |
| 7 | P2 | `D4-25` | Python hook 写操作遥测分类失效 | `huaweicloud-safety.py:46` | 历史 #13 |
| 8 | P2 | `D4-26` | findings 证据脱敏不完整 | `risk-rule-engine.mjs` | 历史 |
| 9 | P2 | `D8-1` | 文档声明 39 实现 42 | `AGENTS.md:27/45` | 历史 |
| 10 | P2 | `D8-9` | sanitizeValue 不脱敏敏感值 | `telemetry.mjs:189` | 历史 #797 |
| 11 | P2 | `D9-9` | tools/call 取消语义未声明（SPEC） | `mcp-protocol.mjs:47` | SPEC 历史 #698 |

> 10 项产品缺陷 + 1 项 SPEC 全部与历史结论一致（源码版本未变），file_issue.py 查重后不重复开单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | 调归属 | Windows 升级检测链专属用例（OS 列标注「专属」），本机 Linux；Linux/macOS 由 NR3 终端矩阵代表覆盖 |

### BLOCKED

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | 补环境 | Router 配额超限 VPC.0114，CreateVpc/Subnet 失败，ECS（Ecs.0005）编排失败 | 释放 router 配额 |
| `D3-S2` | 设计级 | P1 | 补环境 | Router 配额超限 VPC.0114，CreateVpc 返回 vpcId 空，删 VPC 审批链路无法完整验证 | 释放 router 配额 |
| `D4-14` | 设计级 | P2 | 补环境 | Router 配额超限 VPC.0114，CreateVpc 失败，CTS 审计链通过但建删无法完成 | 释放 router 配额 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5/D4-7/D4-9/D4-28 具名回归通过）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：evidence 无原始 AK/SK/明文密码（D4-27 双路径脱敏 PASS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2） | 是 | 已删 | ListBuckets 不含 ✓ |
| OBS 桶（D3-C13） | 是 | 已删 | rm -f 成功 ✓ |
| EIP（D3-C7） | 是 | 已释放 | 归零验证 ✓ |
| 沙箱会话（D3-C3/C6/S3） | 是 | close_session | 会话关闭 ✓ |
| FunctionGraph（D3-S6） | 是 | DeleteFunction | 归零 ✓ |
| 安全组（D3-C1） | 是 | 已删 | 无残留 ✓ |
| VPC/Subnet（D3-S7 第 2 次） | 是 | 已删 | 已删 ✓ |
| RDS（D3-S7 第 1 次） | 是 | 已删 | ListInstances 不含 ✓ |
| VPC/Subnet/SG（D3-S7 第 1 次） | 是 | 已删 | 已删 ✓ |

> 真云只删本次创建资源；未触碰他人遗留资源（testbot3-hermes-e2e / testbot1-hermes-e2e VPC 保留）。

---

## 八、遗留与建议

1. **10 项历史缺陷未修复**（D4-3/D4-21/D9-12/D4-17/EXP-E01/D3-S5/D4-25/D4-26/D8-1/D8-9），与 2026-10-19 根因一致，file_issue.py 查重后不重复开单。
2. **D9-9 SPEC-MISMATCH**：tools/call 取消语义仍未声明。
3. **D3-C13/D3-S6/D3-S7 恢复**：昨日账号受限（OBS/FunctionGraph）与 Router 配额已解除，本轮三用例真机建删通过。
4. **D3-S2 本轮 Router 配额阻塞**：昨日 PASS 本轮因 Router 配额 VPC.0114 无法创建测试 VPC，建议维护侧释放 router 配额后补测。
5. **D3-S7 探针 timeout 偏短**：RDS BUILD→ACTIVE 耗时 > 300s，探针 status 轮询超时，归零由 follow-up 手动补完（RDS 已删，SG/Subnet/VPC 清理中）。
