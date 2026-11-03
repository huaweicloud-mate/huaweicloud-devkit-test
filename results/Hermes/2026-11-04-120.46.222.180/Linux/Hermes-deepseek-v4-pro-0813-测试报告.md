# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-04 05:42（北京时间）
> **执行归档**：`results/Hermes/2026-11-04-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（产品缺陷 21 项：FAIL 18 + SPEC-MISMATCH 3，其中 P0×5；另有环境阻塞 6 项，见 §五）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64（6.8.0-106-generic）` |
| Node / npm / Python | `Node v22.13.0 / npm 10 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.12`（npm `latest` 正式版，gitHead `4ed07801`） |
| hcloud / 依赖 | `hcloud 已配置（管理员 AK/SK + test001 只读子账号）` |
| 真云凭证 | `cn-north-4（AK/SK 管理员 + 只读子账号 credentials.readonly.json）` |
| 测试类型 | 源码级探针（.mjs 直调 hdk src 导出） / MCP 协议 / 真机 CLI / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 43（合计 150） |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand/redactSecrets/serviceCatalog/callTool 等），决策与结果落 `evidence/<case-id>/stdout.log`；真云用例（D4-14/D3-C1/D3-C2/D3-C7/D2-1/D3-C4 等）真机执行建删资源；真云只读子账号 D4-13 经 `run-as-readonly` 切 test001 实测；D10 评测集驱动 `eval/harness/run-eval.mjs` 跑 serviceCatalog 确定性路由层。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149`（含 6 BLOCKED 已实测，仅 1 条 OS 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 18 / 6 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 143，不含 BLOCKED/NOT_RUN） | `85.3%` |
| 产品缺陷（FAIL+SPEC）P0 / P1 / P2 | `5 / 11 / 5`（21 项，均为历史在案，本轮查重去重不新开单） |
| 环境阻塞（BLOCKED） | `6`（沙箱维护 3 + VPC router 配额 3） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本轮创建的 OBS 桶/EIP 均已删除归零；VPC/ECS 因配额未创建，无残留` |

> **本轮变化（vs 11-03）**：源码仍为 v1.1.12（4ed07801），21 项产品缺陷与昨日完全一致（历史在案复现）。唯一变化是共享账号 cn-north-4 的 **VPC router 配额再次被并发/历史 E2E 泄漏耗尽**（本轮 ListVpcs 实测 5 VPC：3 个为 testbot3 并发 E2E 泄漏、2 个 hdk-s7/tctest 历史泄漏），导致昨日已真机通过的 D4-14 / D3-C1 / D4-13 本轮 `CreateVpc` 均返回 `VPC.0114 Quota exceeded for ['router']`，建删链路无法跑通 → 改标 BLOCKED（补环境，非产品缺陷）。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `82` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见 FINDINGS.md |
| BLOCKED | `6` | 环境阻塞：沙箱维护 3 + VPC 配额 3 |
| SPEC-MISMATCH | `3` | 契约漂移：D10-4 / D9-9 / D8-9 |
| NOT_RUN | `1` | D1-39（Windows 专属，OS 列标注「专属」） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | EXP-C4-14 / EXP-C4-18 / EXP-E01 |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单（21 项，均历史在案）

> 本轮 21 项产品缺陷经 `file_issue.py` 历史查重，全部命中上游 open issues → **不新开单**，关联清单见 `HISTORY_LINKS.md`。根因/现象/断言/证据详见 `FINDINGS.md`。

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏正确性（小写 ak=/sk= 与 JSON 带引号 key） | `safety-policy.mjs:45`（redactString 大小写敏感）、`:20`（isSecretKeyName） |
| 2 | P0 | `D4-2` | 凭证 env 打印拦截（裸 access_key/HW_*） | `safety-policy.mjs` env-dump 正则未覆盖 |
| 3 | P0 | `D4-21` | hook_check_artifacts HCL/托管策略引用漏拦截 | `safety/rules/cloud-risk-rules.json` hwc-iam-admin-policy |
| 4 | P0 | `D9-12` | initialize 握手协议（非法时序未拒 + 漏版本检查） | `mcp-protocol.mjs` dispatch 无 initialize 前置校验 |
| 5 | P0 | `D10-4` | 安全干预-静态规则层计数契约滞后（SPEC） | `safety/rules/cloud-risk-rules.json`（16→19 条） |
| 6 | P1 | `D1-70` | 代理配置 undici arm64 导入即崩 | `huaweicloud-devkit@1.1.12` 依赖 undici@8.12.3 |
| 7 | P1 | `D3-C4` | DMS/DEW list_operations 无规范路由 | `tools.mjs` list_operations(DMS/DEW) |
| 8 | P1 | `D3-S7` | 跨服务交付 RDS db.password 缺失 | `tools.mjs` RDS CreateInstance 最小参数集 |
| 9 | P1 | `D4-4` | 写操作审批门 Change* 漏拦截 | `safety/policy.json:27` writeOperationPrefixes |
| 10 | P1 | `D4-6` | adminPass 回显 command 阶段未覆盖 | `cloud-risk-rules.json` hwc-command-adminpass-exposure |
| 11 | P1 | `D4-17` | hook 模糊 fail-closed（空/破坏性输入 fail-open） | `risk-rule-engine.mjs` 无规则命中默认 allow |
| 12 | P1 | `D10-3` | 路由准确率 1 条中文意图 MISS | `tools.mjs` routeMap 缺「云主机」 |
| 13 | P1 | `EXP-E01` | 「云主机」中文意图路由 MISS | `tools.mjs` ECS routeMap keywords |
| 14 | P1 | `EXP-C4-14` | DMS list_operations 无路由 | `tools.mjs` list_operations(DMS) |
| 15 | P1 | `EXP-C4-18` | DEW list_operations 无路由 | `tools.mjs` list_operations(DEW) |
| 16 | P1 | `D9-9` | 取消能力未声明（SPEC） | `mcp-protocol.mjs` initialize capabilities |
| 17 | P2 | `D3-S5` | 复合意图多路命中失败 | `tools.mjs` routeMap 单意图匹配 |
| 18 | P2 | `D3-S6` | FunctionGraph CreateFunction 缺代码 | `tools.mjs` CreateFunction 最小参数集 |
| 19 | P2 | `D4-25` | Python hook 写操作分类 cli:invoke | `hooks/huaweicloud-safety.py` WRITE_OPERATION_RE |
| 20 | P2 | `D4-26` | findings.evidence JSON 带引号 key 明文残留 | `risk-rule-engine.mjs` redactEvidence |
| 21 | P2 | `D8-9` | sanitizeValue 未脱敏 AK/SK/token（SPEC） | `telemetry.mjs` sanitizeValue |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 优先级 | 分类 | 原因 |
|---|---|---|---|---|
| `D1-39` | D1安装 | P0 | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由展开级 EXP-NR3-10（disttags 探针）代表覆盖 |

### BLOCKED（6 项，均已实测探针/直调/真云命令后判定，非空跑）

| 用例ID | 优先级 | 分类 | 阻塞原因（四要素） |
|---|---|---|---|
| `D3-C3` | P1 | 补环境 | 实测 05:15 connect 返回 `HDKIT_SANDBOX_MAINTENANCE`（沙箱服务维护中）；缺沙箱 DevStation 服务；解除条件=华为云沙箱服务恢复 |
| `D3-C6` | P1 | 补环境 | 实测 05:15 7 隐式工具 check_user/connect 均 `HDKIT_SANDBOX_MAINTENANCE`；同上 |
| `D3-S3` | P1 | 补环境 | 实测 check_user 返回 `realnameVerified=undefined` + `HDKIT_SANDBOX_MAINTENANCE`；同上 |
| `D4-14` | P2 | 补环境 | 实测 05:13 CreateVpc 返回 `VPC.0114 Quota exceeded for ['router']`（共享账号 5 VPC 泄漏）；CreateVpc 无法执行；CTS 审计+审批流已验；解除条件=清理泄漏 VPC 释放 router 配额 |
| `D3-C1` | P1 | 补环境 | 实测 05:16-05:21 CreateVpc/CreateSubnet/CreateServers 因 `VPC.0114` 无法执行（4/8 步）；无残留；解除条件=router 配额释放 |
| `D4-13` | P1 | 补环境 | 实测 05:21 只读 6/6=100% 通过；写 CreateVpc 被 `VPC.0114` 预占（非 IAM 403），写权限拒绝无法判定；解除条件=router 配额释放后复测 |

> 上述 3 项 VPC 配额 BLOCKED（D4-14/D3-C1/D4-13）为本轮 vs 昨日唯一变化：共享账号 router 配额被 testbot3 并发 E2E 泄漏（本轮新泄 3 VPC）耗尽。**非产品缺陷**，不计入 FINDINGS 提单，已按「补环境」记录待配额释放后复测。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针/证据输出均已 redact；审查 evidence/*/stdout*.txt/log 无原始 AK/SK 明文）
- [x] 写操作误判 read-only：`0`（写操作 CreateVpc/DeleteVpc 均判 deny/write）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`通过`（D2-4/D4-26/D8-9 为「未脱敏」缺陷属被测对象行为，非测试侧泄漏；测试侧证据无残留凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2） | `tctest-hermes-obs-16syqv` | 已删（清对象 + 删桶） | `rm -r -f` + `rm obs://bucket -f`，ListVpcs 无残留 |
| EIP（D3-C7） | 1 个 CreatePublicip | 已 DeletePublicip | EIP ListPublicips total_count=0 |
| VPC（D4-14/D3-C1） | 未创建（`VPC.0114` 配额） | — | 归零验证通过（未创建即无残留） |
| ECS（D3-C1） | 未创建（CreateVpc 失败前置阻断） | — | 无残留 |

> 本轮真云只删本次创建资源；未创建任何 VPC/ECS（配额前置阻断），OBS/EIP 已删除归零。泄漏 VPC（testbot3 ×3 + hdk-s7 ×1 + tctest ×1）为他人/历史资源，非本轮创建，未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC（3）：`D10-4`（规则计数契约滞后）、`D9-9`（cancellation 未声明）、`D8-9`（sanitizeValue 未脱敏），均由维护方裁决。
- 本轮未覆盖（说明范围）：D1-39 Windows 专属（Linux 侧 EXP-NR3-10 覆盖）；真云 VPC/ECS 建删链路（router 配额阻塞）。
- 建议：① 维护方协调清理共享账号泄漏 VPC/ECS（testbot3 E2E 泄漏 + hdk-s7/tctest 历史泄漏），释放 router 配额后 D4-14/D3-C1/D4-13 即可恢复真机 PASS；② D2-4/D4-2/D4-21/D9-12 四项 P0 安全缺陷已连续多日复现，建议提升修复优先级。