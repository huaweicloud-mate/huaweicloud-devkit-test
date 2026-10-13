# Hermes-deepseek-v4.1-flash 每日测试报告
> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-10 05:25:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-10-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项；全部经历史查重，见 FINDINGS.md / HISTORY_LINKS.md）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux`（Ubuntu 24.04，aarch64） |
| 被测版本（SUT） | `v1.1.8-next.2（npm next tag，gitHead 681895da）` |
| daily 基础用例 | 设计级 102 / 展开级 43 |

> **执行方法**：① **源码级探针直调**（`hdk/plugins/huaweicloud-core` 固定 gitHead `681895da`：`auth/credentials.mjs`、`safety-policy.mjs`、`risk-rule-engine.mjs`、`telemetry/telemetry.mjs`、`tools.mjs`、`mcp-protocol.mjs`、`hooks/huaweicloud-safety.py`）——确定性函数调用，覆盖 D1/D2/D4/D8/D9 多数用例；② **MCP server 真机**（stdio + remote JSON-RPC：`initialize`/`tools/list`/`tools/call`，41 工具）；③ **真云 E2E**（OBS 桶建删归零、FunctionGraph 函数+定时触发器建删归零、ECS/VPC 只读列举）；④ **只读子账号实测**（`scripts/run-as-readonly.py` 临时注入 test001 凭证，验证最小权限 D4-13）；⑤ **评测集 harness**（`eval/harness/run-eval.mjs` 15 条中文意图跑 serviceCatalog 路由）。所有 PASS 用例证据落 `evidence/<case-id>/`（`probe.mjs` + `stdout.log`）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `145`（设计级 102 + 展开级 43） |
| 已执行 | `143` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `133 / 7 / 0 / 3 / 2` |
| 通过率（分母 = PASS+FAIL = 140） | `95.0%` |
| P0 / P1 / P2 新增缺陷 | `1 / 3 / 3`（另 3 项 SPEC-MISMATCH） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `真云资源已建删归零`（ECS=0 / VPC=0 / EIP=0 / OBS 无残留 / FunctionGraph=0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `2` | 未执行（P0 仅 D1-39，OS 专属豁免） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs:57` dispatch 无 initialize 前置状态机 | 历史复现 |
| 2 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:1970-1983` ECS keywords 缺「云主机」 | 历史复现 |
| 3 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | `tools.mjs:1966-2217` serviceCatalog routeMap 覆盖不全 | 历史复现 |
| 4 | P1 | `EXP-E01` | D10评测 | D10评测集 EXP-E01 | 同 #2，`tools.mjs:1966-2217` 缺「云主机」 | 历史复现 |
| 5 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46`/`:24` WRITE_OPERATION_RE + TELEMETRY_DIR 写偏 | 历史复现 |
| 6 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `risk-rule-engine.mjs:97` `evidence: excerpt(context.text)` 未脱敏 | 历史复现 |
| 7 | P2 | `D8-9` | D8遥测 | 安装 ID 与遥测值脱敏（SPEC） | `telemetry/telemetry.mjs:189` sanitizeValue 未脱敏 | 历史复现 |
| 8 | P2 | `D1-65` | D1安装 | 调试模式环境变量（SPEC） | `telemetry/telemetry.mjs:81` `=== 'true'` 仅认字面量 | 历史复现 |
| 9 | P2 | `D1-68` | D1安装 | 图标离线与区域环境变量（SPEC） | `auth/credentials.mjs:222` `HW_REGION || HUAWEICLOUD_REGION` 优先级相反 | 历史复现 |
| 10 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:1966-2217` serviceCatalog 无复合意图分层拆解 | 历史复现 |

### 根因详情

> 完整「现象 / 断言 / 根因（文件:行号）/ 影响 / 证据」见 `FINDINGS.md`（10 项，与本节一一对应）。全部经上游历史查重命中，**不重复开单**，关联清单见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|---|
| `D1-39` | D1安装 | 设计级 | P0 | NOT_RUN | 【调归属】 | D1-39 为 **Windows 专属** P0 用例（升级检测链 Windows EINVAL 静默失败），当前 OS=Linux 结构性不适用标 NOT_RUN（AGENTS.md 状态口径唯一豁免）。Linux 侧由展开级 `EXP-NR3-10` 代表覆盖（本日 PASS：platform=linux queryDistTagsSync EINVAL=false 函数齐备） | 归属列已标注 OS 专属，无需改用例 |
| `D3-S7` | D3功能 | 设计级 | P2 | NOT_RUN | 【改用例/补环境】 | 跨服务复合编排（RDS 建库 + 沙箱 + 连接串注入 + 测后归零）超出每日单服务真云探针范围，需专用编排 harness 与 RDS 实例配额，未执行 | 建议转专项/隔离执行，或在母版标注「需专用 harness」并给出可执行前置 |

> 无 BLOCKED 用例：真云（OBS / FunctionGraph / 只读 IAM）凭证与环境均就绪，全部真机执行。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D4-26/D8-9 为被测**脱敏能力**校验发现的缺陷，测试过程未发生真实凭证外泄；探针注入的只读子账号 AK 指纹脱敏打印）
- [x] 写操作误判 read-only：`0`（只读子账号 D4-13 实测：只读 `ListServersDetails` 可用；写 `CreateVpc` 被 IAM 拒绝 `VPC.0010`）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：发现产品侧缺陷 D4-26（findings.evidence 明文残留）、D8-9（sanitizeValue 未脱敏）——已入 FINDINGS

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶 `hdk1-c13-79738206`（D3-C13） | 1 | 1 | `obsutil ls` 无 hdk* 桶残留 ✓ |
| FunctionGraph 函数 + TIMER 触发器（D3-S6） | 1 | 1 | `ListFunctions` functions=0 ✓ |
| ECS 实例 | 0 | 0 | `ListServersDetails` count=0 ✓ |
| VPC | 0 | 0 | `ListVpcs` vpcs=[] ✓ |
| EIP | 0 | 0 | `ListPublicips` total_count=0 ✓ |

> 真云用例均按「最低配置创建 → 测后删除 → 只删本次创建」执行，测后全量归零复核通过。

---

## 八、遗留与建议

- **SPEC-MISMATCH 待裁决（3 项）**：D1-65（DEBUG 仅认 `true`）、D1-68（region 优先级与契约相反）、D8-9（sanitizeValue 未脱敏）。建议维护者裁定——是修实现对齐契约，还是修用例契约；均已在 FINDINGS 给出根因（文件:行号）。
- **路由关键词覆盖（D3-S1 / D10-3 / EXP-E01 / D3-S5）**：`serviceCatalog` 中文口语化关键词覆盖不全 + 无复合意图分层拆解，建议补全 routeMap 关键词并增加复合意图拆分逻辑。
- **hook 一致性（D4-25）**：Node 与 Python 两套 hook 的 telemetry 目录/写动词正则不一致，建议统一到单一实现或共享常量。
- **历史复现**：全部 10 项缺陷经 `file_issue.py` 历史查重命中上游开放单，本次不重复开单，关联单号与内容见 `HISTORY_LINKS.md`。
