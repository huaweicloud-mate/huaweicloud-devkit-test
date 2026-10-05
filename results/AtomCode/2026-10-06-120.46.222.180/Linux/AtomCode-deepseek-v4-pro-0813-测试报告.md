# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-06 05:31:00`（北京时间）
> **执行归档**：`results/AtomCode/2026-10-06-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（1 项 P0 缺陷 D2-4 凭证 JSON 脱敏漏；沿用 1.1.8-next.1 历史缺陷，无新增）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04.4 LTS，6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | `cn-north-4`（AKSK 已配置，只读子账号 test001 已下发） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/--help）/ MCP 协议 / 真云 E2E / D10 评测集 |
| daily 基础用例 | 设计级 102 / 展开级 39（预筛后本客户端+OS） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（gitHead ffd7b47 = 被测包对应版本），决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 建删资源并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 102 + 展开级 39 = 141 |
| 已执行 | 141（另含 6 项真云 E2E 佐证 + 18 项夹具 + 协议/评测 harness） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 130 / 9 / 0 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `92.9%`（130 / 140） |
| P0 / P1 / P2 缺陷 | 1 / 7（含 1 SPEC）/ 2 |
| 红线（I 类）违规 | `0`（凭证类缺陷均已记根因，未实际泄漏） |
| 资源释放 | `本次全部归零`（ECS/VPC/子网/OBS/沙箱 session 均删净；另有历史遗留见 §七） |

---

## 三、状态汇总

### 3.1 设计级（102）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | D2-4、D3-S1、D3-S2、D3-S3、D4-27、D8-9、D9-2、D3-S5 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `1` | D9-9 capabilities 未声明 cancellation |
| NOT_RUN | `1` | D1-39（Windows 升级检测链专属，Linux 由 d1-upgrade queryDistTagsSync 代表覆盖） |
| **合计** | **`102`** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01「云主机」中文意图 MISS |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏对 JSON 键值形态漏脱敏 | JSON 内 ak/sk/token 值全为 `<redacted>` | 原样返回 | `safety-policy.mjs:42-45` | P | 历史待提单 |
| 2 | P1 | D3-S1 | 自然语言「只读查 ECS」未路由 | 命中 ECS | `Run hcloud --help` | `tools.mjs:2191-2195` | P | 历史待提单 |
| 3 | P1 | D3-S2 | 自然语言「删 VPC 先确认」未路由 | 命中 VPC | `Run hcloud --help` | `tools.mjs:2191-2195` | P | 历史待提单 |
| 4 | P1 | D3-S3 | 自然语言「沙箱预览」未路由 | 命中 Sandbox | `Run hcloud --help` | `tools.mjs:2146-2158` | P | 历史待提单 |
| 5 | P1 | D4-27 | 双路径输出脱敏漏小写 ak=/sk= | `ak=`/`sk=` 值脱敏 | 明文残留 | `safety-policy.mjs:45` | P | 历史待提单 |
| 6 | P1 | D9-2 | JSON-RPC 非法参数未返回 -32602 | 返回 -32602 | 无 error 对象 | `mcp-protocol.mjs:57-59` | P | 历史待提单 |
| 7 | P1 | D9-9 | capabilities 未声明 cancellation（SPEC） | 声明 notifications.cancellation | 未声明 | `mcp-protocol.mjs:47-49` | P | 历史待提单 |
| 8 | P1 | EXP-E01 | 中文意图「云主机」未路由到 ECS | 命中 ECS | MISS（`Run hcloud --help`） | `tools.mjs:1978-1980` | P | 历史待提单 |
| 9 | P2 | D3-S5 | 复合意图分层路由未命中多服务 | 命中 OBS/DDS/DCS 等 | `Run hcloud --help` | `tools.mjs:1968-2188` | P | 历史待提单 |
| 10 | P2 | D8-9 | 遥测值未脱敏 | AK/SK/token 脱敏 | 原样返回 | `telemetry/telemetry.mjs:189-196` | P | 历史待提单 |

> 以上 10 项均与 2026-10-05（同 gitHead ffd7b47，v1.1.8-next.1）完全一致，属**历史缺陷原样复现，无新增缺陷**。提单走 `file_issue.py` 历史查重，命中即不重复开单、生成 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专用升级检测链（EINVAL 语义），Linux 无对应语义；OS 列标注「专属」 | Linux 侧已由展开级代表覆盖（d1-upgrade queryDistTagsSync-no-EINVAL），无需改 |

> 其余 NOT_RUN/BLOCKED 无。展开级已在 init_day 建包时按 agent+OS 预筛，非本客户端/OS 的用例未下发。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云 E2E 执行未输出明文 AK/SK）
- [x] 写操作误判 read-only：`0`（d4-security D4-5 delete/create-not-readonly 均 PASS）
- [x] 红线（I 类）违规：`无`（D2-4/D4-27/D8-9 脱敏缺陷均为源码级直调复现，未触发真实凭证泄漏）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针全部使用 redactSecrets 的测试样例值，非真实 AK/SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（testbot3-hermes-ecs-1234578637 / 9838b895） | 是 | 已删（脚本提交 + 实测异步未归零后手动补删） | ListServersDetails 归零确认 |
| VPC（testbot3-hermes-e2e-1234578637 / d3f31b7b） | 是 | 已删（手动补删） | ListVpcs 归零确认 |
| 子网（testbot3-hermes-e2e-1234578637-subnet / a5033f5d） | 是 | 已删（手动补删） | ListSubnets 归零确认 |
| OBS 桶（testbot3-hermes-obs-1234488083） | 是 | 已删（rm 空桶） | 删桶归零确认 |
| 沙箱 session（D3-C6 / D3-C3） | 是 | 已 close_session | 会话关闭确认 |

> **归零坑（真云 harness 侧，非产品缺陷）**：`scripts/realcloud_e2e.mjs` 的 D3-C1 finally 块在 ECS 异步删除未完成时即删子网/VPC，`sh()` 仅按退出码判 `ok`，导致「subnet:OK vpc:OK」假阳性而资源实际残留；本次已手动补删 ECS→子网→VPC 归零。账上另见少量前序运行（如 `testbot3-hermes-e2e-0716192372/0543499948/0543344318`，非本次创建、非本客户端）的 VPC/子网残留，未越权删除，已在此记录待维护者盘点。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities 未声明 cancellation）——MCP 标准能力缺失，建议版本补齐或明确契约。
- 本轮未覆盖：真云多终端矩阵、真实 Agent 会话评测（AtomCode 无 DSH，D10-1/2/5/9 执行器属 DSH 客户端专属，本客户端走 run-eval harness 确定性路由层已覆盖 D10-3）。
- 建议：修复 `realcloud_e2e.mjs` finally 归零顺序（先确认 ECS 真删再删子网/VPC，并显式校验删除结果），避免假阳性残留；删除用唯一资源名前缀按客户端区分（当前硬编码 `testbot3-hermes`）。