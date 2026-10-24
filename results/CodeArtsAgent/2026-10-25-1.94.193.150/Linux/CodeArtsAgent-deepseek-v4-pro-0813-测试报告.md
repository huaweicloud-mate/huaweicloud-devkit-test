# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-25（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-25-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，均为历史一致）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux x86_64`（Ubuntu） |
| Node / Python | `Node v22.13.0 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.12`（npm latest，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |
| 真云凭证 | `cn-north-4`（AK/SK 已配置 + 只读子账号 test001） |

> **执行方法**：源码级探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，或 spawn `mcp-server.mjs` 驱动 JSON-RPC；D1 安装域真机 CLI（隔离 HOME）；真云 E2E 真机建删归零；D10 评测集走单意图服务路由探针（EXP-E）＋ serviceCatalog 直调；结论落 evidence/<case-id>/。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（D1-39 Windows 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `134 / 10 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `93.1%` |
| P0 / P1 / P2 缺陷 | `3 / 4 / 4` |
| 红线（I 类）违规 | `0` |
| 资源释放 | 本次创建资源全部归零（ECS/OBS/EIP/FGS/VPC/子网/SG/RDS + 历史残留清理） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `96` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，均为历史缺陷 |
| BLOCKED | `0` | — |
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
| 1 | P0 | D4-3 | kms DecryptData 明文 secret API 未拦截 | safety/policy.json:26 blockedSecretOperations 缺 DecryptData/DecryptDatakey | 历史 |
| 2 | P0 | D4-21 | HCL/Terraform broad IAM 未拦截 | safety/rules/cloud-risk-rules.json:209 iam-admin-policy 未覆盖 HCL role.tf | 历史 |
| 3 | P0 | D9-12 | initialize 时序未强制 | mcp-server.mjs:183-187 dispatch 无 initialize 前置校验 | 历史 #699/#774 |
| 4 | P1 | D3-S3 | 沙箱 devbridge 公网隧道失败 | sandbox/session-manager.mjs:28 | 历史 #787 |
| 5 | P1 | D4-17 | hook 命令替换内层仍放行 | tools.mjs:1310 huaweicloud_hook_check_command | 历史 #673 |
| 6 | P1 | D9-9 | tools/call 取消语义未声明（SPEC） | mcp-protocol.mjs capabilities 未声明 cancellation | SPEC 历史 #698 |
| 7 | P1 | EXP-E01 | 中文意图「云主机」MISS | tools.mjs:2188 serviceCatalog | 历史 |
| 8 | P2 | D3-S5 | 复合意图分层路由 MISS | tools.mjs:2188 serviceCatalog | 历史 #11 |
| 9 | P2 | D4-25 | 写操作遥测分类失效 | hooks/huaweicloud-safety.py:46 | 历史 #13 |
| 10 | P2 | D4-26 | findings 证据脱敏不完整 | risk-rule-engine.mjs | 历史 |
| 11 | P2 | D8-9 | sanitizeValue 不脱敏敏感值 | telemetry/telemetry.mjs:189 | 历史 #797 |

> 10 项产品缺陷 + 1 项 SPEC 全部与历史结论一致（1.1.12 源码对应逻辑未变），file_issue.py 查重后不重复开单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | 调归属 | Windows 升级检测链专属用例（OS 列标注「专属」），本机 Linux；Linux/macOS 由 NR3 终端矩阵代表覆盖 |

### BLOCKED

无（真云用例全部真机执行，建删归零）。

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
| ECS/VPC/子网/SG（D3-C1） | 是 | 已删（ECS 异步删除后手动补充删 SG） | 归零验证 ✓ |
| OBS 桶（D3-C2/D3-C13） | 是 | 已删 | ls 不含 ✓ |
| EIP（D3-C7） | 是 | 已释放 | 归零验证 ✓ |
| FunctionGraph（D3-S6） | 是 | 测后删除函数 | 归零 ✓ |
| VPC（D4-14/D3-S2） | 是 | 已删 | ListVpcs 不含 ✓ |
| VPC/子网/SG/RDS（D3-S7） | 是 | 已删（RDS 异步删除后手动补充） | 归零验证 ✓ |
| 沙箱会话（D3-C3/D3-C6/D3-C14/D3-S3） | 是 | close_session | 会话关闭 ✓ |
| 历史残留（hdk-s7-vpc-mvli2ica） | 历史 | 已清理 | 归零验证 ✓ |

> 真云只删本次创建资源 + 同账号历史测试残留；未触碰他人遗留资源。

---

## 八、遗留与建议

1. **11 项历史缺陷未修复**（D4-3/D4-21/D9-12/D3-S3/D4-17/EXP-E01/D3-S5/D4-25/D4-26/D8-9 + D9-9 SPEC），与 2026-10-22/10-23 根因一致，1.1.12 对应源码逻辑未变，file_issue.py 查重后不重复开单。
2. **D9-9 SPEC-MISMATCH**：tools/call 取消语义仍未声明。
3. **D3-S3 沙箱隧道历史缺陷 #787 复现**：devbridge 公网隧道建立失败（session-manager.mjs 1.1.12 重写 405 行仍未修复），nginx 本地 serving 正常。
4. **D3-C1 ECS 异步删除**：探针等待窗口内 ECS 未达 DELETED 致 SG 删除失败，属探针等待时序问题（非产品缺陷），已手动补充删除并归零。
5. **D3-S7 RDS 异步创建**：RDS 创建缓慢致探针状态轮询超时（状态 BUILD），已手动删除 RDS/SG/子网/VPC 并归零（非产品缺陷）。
