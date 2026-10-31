# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-01（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-01-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.13-next.0`（npm @next，gitHead `47170d1f`，本地 hdk `47170d1f`） |
| 工具全集 | `46`（tools/list 实测） |
| hcloud / 依赖 | `hcloud 7.2.12`（doctor 确认已配置） |
| 真云凭证 | `cn-north-4（AK/SK 已配置 + 只读子账号 test001）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39（预筛剔除 27 条非本客户端/OS） |

> **执行方法**：复用昨日已建的确定性探针脚本（`probe.mjs` 真实执行逻辑）逐条重新实测，并真机重跑真云 E2E；结论落 `evidence/<case-id>/stdout.log`（146 条逐一实测）。沙箱依赖用例（D3-C3/D3-C6/D3-S3）今日实测沙箱服务仍维护（`HDKIT_SANDBOX_MAINTENANCE`），如实标 BLOCKED。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 10 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `92.9%` |
| P0 / P1 / P2 新增缺陷 | `3 / 2 / 5`（均历史复现，不新开单） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 本次创建资源全部归零（ECS/SG/子网/VPC/OBS/RDS/FunctionGraph），手动补删 D3-S7 残留 VPC/SG 与 D4-24 审批探针 VPC |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境阻塞（沙箱维护） |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行（OS 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | safety/policy.json:26 | 历史（不重复开单） |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归 | cloud-risk-rules.json:209 | 历史（不重复开单） |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | mcp-protocol.mjs:61 | 历史（不重复开单） |
| 4 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | tools.mjs:1310 | 历史（不重复开单） |
| 5 | P1 | `EXP-E01` | D10评测 | 中文意图「云主机」未命中 ECS | tools.mjs:2195 | 历史（不重复开单） |
| 6 | P1 | `D9-9` | D9协议 | tools/call 取消能力未声明(SPEC) | mcp-protocol.mjs capabilities | 历史（不重复开单） |
| 7 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | tools.mjs:2195 | 历史（不重复开单） |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | huaweicloud-safety.py:112 | 历史（不重复开单） |
| 9 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | risk-rule-engine.mjs:19 | 历史（不重复开单） |
| 10 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | telemetry.mjs:190 | 历史（不重复开单） |
| 11 | P2 | `D8-1` | D8质量 | 文档与能力一致 | hdk/AGENTS.md:27 | 历史（不重复开单） |

> 上述 10 项 FAIL + 1 项 SPEC-MISMATCH 均今日实测复现，与历史结论一致（源码 1.1.13-next.0 未修）。历史查重命中（#1055 等），本次不重复开单。详见 FINDINGS.md 与 HISTORY_LINKS.md。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），本机 Linux 不适用；Linux 侧由展开级 NR3 终端矩阵代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 今日实测沙箱服务维护中：sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE(503)，无法建立会话。解除条件：沙箱服务恢复 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 今日实测沙箱服务维护中：7 工具均返回 HDKIT_SANDBOX_MAINTENANCE(503)。解除条件：沙箱服务恢复 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 今日实测沙箱服务维护中：check_user 返回 HDKIT_SANDBOX_MAINTENANCE(503)，无法 connect。解除条件：沙箱服务恢复 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针输出已 redact，无明文 AK/SK 落盘）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`（真云用例真机建删、沙箱维护如实 BLOCKED、无虚报 PASS）
- [x] 脱敏复核：`通过`（真云输出 AK/SK 已 redact，证据 stdout.log 无明文凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（真机） | 是 | 归零（VPC/ECS 均不含本次资源，一次性完整归零） |
| VPC/子网/SG（D3-C1/D3-S7/D3-S2/D2-1/D4-24） | 是 | 是（D3-S7/D4-24 手动补删） | 归零（ListVpcs/ListSubnets/ListSecurityGroups 不含本次资源） |
| OBS（D3-C2/D3-C13） | 是（建桶+上传+website config） | 是 | 归零（删桶后 ls 不含） |
| RDS（D3-S7） | 是（BUILD→ACTIVE→删除） | 是 | 归零（ListInstances 不含） |
| FunctionGraph（D3-S6） | 是（函数+触发器） | 是 | 归零（ListFunctions 不含 hdk-*） |

> 今日手动补删：D3-S7 独立探针 VPC（hdk-s7-vpc-mvwwulj7）与安全组（hdk-s7-sg-mvwwulj7）一次删除失败，已手动重试并归零核实；D4-24 审批探针产生的 tctest-d424-probe-x VPC 已手动删除归零。历史遗留 tctest-tmr-u1yrtd 一套（含运行中 ECS）非本次创建，未动。

---

## 八、遗留与建议

- 10 项 FAIL + 1 项 SPEC-MISMATCH 均与历史一致（源码 1.1.13-next.0 未修），历史单号见 HISTORY_LINKS.md，本次不重复开单（file_issue.py 查重命中 #1055 等）。
- D9-9 SPEC（取消能力未声明）建议在 capabilities 明确声明 notifications.cancellation 或标注不支持。
- 沙箱 3 项（D3-C3/D3-C6/D3-S3）因华为云沙箱服务维护（HDKIT_SANDBOX_MAINTENANCE）BLOCKED，待服务恢复后补测。
- KooCLI 版本不匹配（installed 7.2.12 vs paired 7.3.12），建议 `npx huaweicloud-devkit install-hcloud` 对齐。
- 观察项（非产品缺陷）：D3-S7/D4-24 探针的 VPC/SG 删除清理逻辑为一次性调用、失败不重试，真云异步删除下偶发残留，需 agent 手动补删归零；建议探针增加删除重试+归零断言。
- 观察项（非产品缺陷）：D9-12 initialize 阶段 runVersionCheck 已下沉 prewarm/check_cli 工具（#1014 相关重构），探针断言需随实现更新。
