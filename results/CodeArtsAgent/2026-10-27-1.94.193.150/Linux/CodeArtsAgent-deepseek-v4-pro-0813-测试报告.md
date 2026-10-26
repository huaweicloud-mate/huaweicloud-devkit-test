# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-27 06:01:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-27-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（10 FAIL + 1 SPEC，其中 9 FAIL+1 SPEC 为历史一致，新增 D8-1 文档工具数不一致）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu） |
| Node / Python | `Node v22.13.0 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.12`（npm latest，gitHead `4ed07801`） |
| 工具全集 | `46`（tools/list 实测，文档 AGENTS.md 仍写 43/39） |
| 真云凭证 | `cn-north-4`（管理员 AK/SK + 只读子账号 test001） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，或 spawn `mcp-server.mjs` 驱动 JSON-RPC；D1 安装域真机 CLI（隔离 HOME，codearts target 1.1.12）；D10 评测集走 `eval/harness/run-eval.mjs`；真云 E2E 真机建删归零（ECS/OBS/EIP/VPC/FunctionGraph/RDS）；结论落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（D1-39 Windows 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 10 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `92.9%` |
| P0 / P1 / P2 缺陷 | `3 / 3 / 5`（含 D9-9 SPEC P1） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 本次创建资源全部归零（ECS/EIP/OBS/RDS/FunctionGraph/VPC/子网/SG） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 沙箱服务维护（外部依赖） |
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

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData/DecryptDatakey 明文 secret API 未拦截 | safety/policy.json:26 blockedSecretOperations 缺 DecryptData/DecryptDatakey | 历史 |
| 2 | P0 | D4-21 | HCL/Terraform broad IAM 未拦截 | cloud-risk-rules.json:209 iam-admin-policy 未覆盖 HCL role.tf | 历史 |
| 3 | P0 | D9-12 | initialize 时序未强制 | mcp-server.mjs:183-187 dispatch 无 initialize 前置校验 | 历史 #699/#774 |
| 4 | P1 | D4-17 | hook 命令替换内层仍放行 | tools.mjs:1310 hook_check_command 模糊 fail-closed 不完整 | 历史 #673 |
| 5 | P1 | D9-9 | tools/call 取消语义未声明（SPEC） | mcp-protocol.mjs capabilities 无 cancellation | 历史 #698 |
| 6 | P1 | EXP-E01 | 中文意图「云主机」MISS | tools.mjs:2188 serviceCatalog 缺云主机→ECS 别名 | 历史 |
| 7 | P2 | D3-S5 | 复合意图分层路由 MISS | tools.mjs:2188 serviceCatalog 未拆分复合意图 | 历史 #11 |
| 8 | P2 | D4-25 | 写操作遥测分类失效 | huaweicloud-safety.py:46 Create* 未分类为 cli:write | 历史 #13 |
| 9 | P2 | D4-26 | findings 证据脱敏不完整 | risk-rule-engine.mjs 脱敏白名单缺 secret_key/adminPass | 历史 |
| 10 | P2 | D8-9 | sanitizeValue 不脱敏敏感值 | telemetry/telemetry.mjs:189 | 历史 #797 |
| 11 | P2 | D8-1 | 文档声明工具数 43 与实际 46 不一致 | hdk/AGENTS.md:27,45 硬编码 43/39 | **新增** |

> 10 项 FAIL + 1 项 SPEC，其中 10 项与历史根因一致（1.1.12 源码逻辑未变，file_issue.py 查重后不重复开单）；**D8-1 为新增缺陷**（1.1.12 工具 43→46，文档未同步），历史查重后应开单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | 调归属 | Windows 升级检测链专属用例（OS 列标注「专属」），本机 Linux；Linux 由 update-check 源码探针 D1-40/D1-28 代表覆盖 |

### BLOCKED

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D3-C3` | 设计级 | P1 | 补环境 | 沙箱服务维护 HDKIT_SANDBOX_MAINTENANCE(503)，connect/upload/nginx 部署链路无法建立会话 |
| `D3-C6` | 设计级 | P1 | 补环境 | 沙箱服务维护(503)，7 工具中仅 sign_agreement 可执行，其余因 workspace_id 缺失报错 |
| `D3-S3` | 设计级 | P1 | 补环境 | 沙箱服务维护(503)，无法 connect 建立沙箱会话预览公网 URL |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5/D4-7/D4-9/D4-28/D4-10 具名回归通过）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：evidence 无原始 AK/SK/明文密码（D4-27 双路径脱敏、D4-6 adminPass 脱敏 PASS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/VPC/子网/SG（D3-C1） | 是 | 已删（ECS DELETED→SG/子网/VPC） | 归零 ✓ |
| OBS 桶（D3-C2/D3-C13） | 是 | 已删 | ls 不含 ✓ |
| 最小 EIP（D3-C7） | 是 | 已释放 | total_count=0 ✓ |
| VPC（D4-14） | 是 | 已删 | ListVpcs 不含 ✓ |
| FunctionGraph（D3-S6） | 是 | 测后删除函数 | 归零 ✓ |
| RDS+VPC/子网/SG（D3-S7） | 是 | RDS 删 + 手动补删 SG/子网/VPC | 归零 ✓ |
| VPC（D4-24 探针残留） | 是 | 手动删除 tctest-d424-probe-x | 归零 ✓ |

> 真云只删本次创建资源；同账号历史残留（tctest-hermes-ecs-prw145）非本次创建，未触碰。

---

## 八、遗留与建议

1. **11 项缺陷**（10 FAIL + D9-9 SPEC），其中 10 项与历史一致，**D8-1 为新增**（文档工具数 43/39 vs 实际 46，1.1.12 新增工具未同步文档），file_issue.py 查重后应只对 D8-1 开单。
2. **沙箱服务维护**：D3-C3/D3-C6/D3-S3 因 HDKIT_SANDBOX_MAINTENANCE(503) BLOCKED，待沙箱服务恢复后补测。
3. **D9-9 SPEC-MISMATCH**：tools/call 取消语义仍未声明（capabilities.cancellation=false）。
4. **D4-24 探针缺陷**：审批 token 语义探针用 CreateVpc 实测重复确认真建 VPC 但无删除逻辑，已手动删除归零（建议探针改用只读命令测重复确认或补删除步骤）。
