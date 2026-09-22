# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-23 21:30:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-23-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：PARTIAL（有 13 条 FAIL，含 1 条 P0）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + GLM-5.2 |
| OS / 架构 | Windows Server 2022 (10.0.20348) x64 |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.7-next.0（npm @next，gitHead 0790e92a） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK / 已使用：ListServersDetails count=0） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status/help）/ MCP 协议 / eval harness / 真云只读 |
| 设计真源 | 设计级 100 / 展开级 39 / 追踪表 |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP 工具调用（hook_check_command/plan_cli_command/show_profile_redacted 等）+ CLI 真机执行（npx doctor/status/help）+ eval harness（run-eval.mjs 路由准确率）+ 真云只读（run_readonly_command ListServersDetails）。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 139（设计级 100 + 展开级 39） |
| 已执行 | 139 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 126 / 13 / 0 / 0 / 0 |
| 通过率（分母 = PASS+FAIL = 139） | 90.6% |
| P0 / P1 / P2 新增缺陷 | 1 / 1 / 0（合并 3 条 FINDINGS） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（ECS count=0，无创建资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 98 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D4-23（huawei-agent-rules.md 缺失）、D4-27（redactSecrets 未脱敏 accessKeyId） |
| BLOCKED | 0 | — |
| NOT_RUN | 0 | — |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | 22 C4 服务矩阵 + 2 D5 客户端发现 + 3 E 路由 HIT + 1 E N/A |
| FAIL | 11 | EXP-E01~E05, E07, E10~E14（serviceCatalog 路由 MISS） |
| BLOCKED | 0 | — |
| NOT_RUN | 0 | — |

### 3.3 按优先级

| 优先级 | 总数 | PASS | FAIL | 通过率 |
|---|---|---|---|---|
| P0 | 19 | 18 | 1 | 94.7% |
| P1 | 51 | 51 | 0 | 100% |
| P2 | 30 | 29 | 1 | 96.7% |
| 展开 | 39 | 28 | 11 | 71.8% |

---

## 四、缺陷清单

详见 `FINDINGS.md`。共 3 条合并缺陷（13 条 FAIL 用例）：

1. **【P0】D4-23 huawei-agent-rules.md 全局规则文件缺失** — 源码和已安装包均无此文件，MUST 约束无法注入。
2. **【P2】D4-27 redactSecrets 未脱敏 accessKeyId 字段名** — 正则模式仅匹配 `AK:` 前缀，不匹配 `accessKeyId:` 格式。
3. **【P1】EXP-E01~E14 serviceCatalog 中文意图路由准确率仅 21.4%** — 11/14 条中文意图 MISS，返回兜底 "Run hcloud --help"。

---

## 五、未执行用例与原因

无未执行用例。所有 139 条用例均已执行（PASS 或 FAIL），无 NOT_RUN / BLOCKED。

---

## 六、安全/红线

| 检查项 | 结果 |
|---|---|
| 真云用例执行 | ✅ 已执行（run_readonly_command ListServersDetails，count=0 归零） |
| 凭证脱敏 | ✅ show_profile_redacted 输出 accessKeyId/secretAccessKey/securityToken 均为 `<redacted>` |
| 凭证文件读取拦截 | ✅ hook_check_command 对 cat/type 凭证文件 → deny |
| 凭证 env 打印拦截 | ✅ hook_check_command 对 printenv HUAWEICLOUD_AK → deny |
| 明文 secret API 拦截 | ✅ hook_check_command 对 DEW ShowSecretVersion/DownloadSecret → deny |
| 写操作审批门 | ✅ plan_cli_command 对写操作 → deny + safeToRun=false + approvalToken |
| STS token 拒绝落盘 | ✅ persistCredentials 对 securityToken → {status:error, scope:rejected} |
| 规则库完整 | ✅ 9 deny + 7 warn = 16 规则 |
| PASS 门禁 | ✅ verify_no_fake_pass.py 通过 |
| 覆盖率门禁 | ✅ verify_coverage.py 通过（NOT_RUN 0%，P0 无 NOT_RUN） |

---

## 七、资源释放

| 资源类型 | 创建数 | 删除数 | 残留 |
|---|---|---|---|
| ECS 实例 | 0 | 0 | 0 |
| VPC | 0 | 0 | 0 |
| 安全组 | 0 | 0 | 0 |
| EIP | 0 | 0 | 0 |

真云操作仅执行只读命令（ListServersDetails count=0），未创建任何资源。账户保持归零状态。

---

## 八、遗留建议

1. **huawei-agent-rules.md 缺失（P0）**：需确认该功能是否已实现或被移除。若已移除，应更新 D4-23 用例预期；若未实现，需补充实现。
2. **redactSecrets 正则覆盖不全（P2）**：建议扩展正则模式以覆盖 `accessKeyId`、`access_key`、`SecretAccessKey` 等字段名变体。
3. **serviceCatalog 路由准确率低（P1）**：建议扩展中文意图匹配词典，覆盖"云主机"→ECS、"弹性公网IP"→EIP、"云数据库"→RDS 等常见中文服务名称。当前 21.4% 准确率严重影响中文用户体验。
4. **D10 评测集基线**：21.4% 路由准确率为已知基线，建议持续跟踪改进效果。
