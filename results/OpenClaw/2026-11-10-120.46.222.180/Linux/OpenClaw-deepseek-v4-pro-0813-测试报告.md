# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-10 05:43:07（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-10-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.14-next.1` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + CLI 真机（install/doctor/status/update/uninstall 隔离 HOME）+ MCP 协议（protocol-probe）+ 真云 E2E（ECS/OBS/沙箱/FunctionGraph/RDS 建删归零）；证据统一落 `evidence/<case-id>/`（probe + stdout.log）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 13 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 142） | `90.8%` |
| P0 / P1 / P2 新增缺陷 | `4 / 4 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/OBS/沙箱/FG/RDS/VPC/子网/EIP 均 0 残留）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
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
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | TODO: 待补根因 | 待提单 |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 3 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | TODO: 待补根因 | 待提单 |
| 4 | P0 | `D4-15` | D4安全 | hook绕过尝试 | TODO: 待补根因 | 待提单 |
| 5 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 6 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 7 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 8 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 9 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 10 | P2 | `D8-1` | D8质量 | 文档与能力一致 | TODO: 待补根因 | 待提单 |
| 11 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补根因 | 待提单 |
| 12 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 13 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属（OS 列标注「Windows 专属」，EINVAL 语义仅 Windows）；本机 Linux 结构性不适用，由 D1-40 覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（本机测试全程无明文 AK/SK 泄露到结果/证据；D4-27 空格形态脱敏缺口为已报历史缺陷 D4-27）
- [x] 写操作误判 read-only：无（D4-5 写命令判定 deny/write）
- [x] 红线（I 类）违规：0 项
- [x] 脱敏复核：已复核（D4-27 空格形态、D4-26 findings 证据、D8-9 sanitizeValue 三处为已报历史缺陷，均记 FINDINGS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | CreateServers(serverIds) | DeleteServers(含磁盘) | 0 残留 |
| VPC/子网 | CreateVpc/CreateSubnet（tctest- 前缀） | DeleteVpc/DeleteSubnet | 0 残留 |
| OBS | mb 建桶 | 先删对象后删桶 | 0 残留 |
| 沙箱 | connect/upload/deploy | close_session | 会话关闭 |
| FunctionGraph | CreateFunction+Trigger | DeleteFunction | 0 残留 |
| RDS | CreateInstance(MySQL 8.0 postPaid) | DeleteInstance→DeleteSubnet→DeleteVpc | 0 残留 |

> 真云用例均最低配置创建→测后删除→人工二次归零核验，云上 tctest- 前缀资源全 0 残留。

---

## 八、遗留与建议

- **待裁决 SPEC（3 项，非缺陷，记录漂移点待维护者裁决）**：D1-65（DEBUG '1' 语义）、D1-68（HW_REGION 优先级）、D9-9（capabilities.cancellation 未声明）。
- **历史缺陷（13 项 FAIL，fresh 复现、查重命中不重复提单）**：全部根因见 FINDINGS.md，关联历史单见 HISTORY_LINKS.md。
- **唯一 NOT_RUN**：D1-39（Windows 专属，Linux 由 D1-40 覆盖），非阻塞。
- **建议**：D1-70（undici 8.12.x 依赖 Node≥22.19 的 zstd，与 engines>=22 声明不一致）应上调 engines 或锁 undici 兼容版本；本轮 token full-chain（1.1.14-next.1）在 AK/SK 存在时为 no-op，未引入新产品缺陷。
