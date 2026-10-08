# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-09`（北京时间）
> **执行归档**：`results/AtomCode/2026-10-09-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（1 项 P0 缺陷 D2-4 凭证 JSON 脱敏漏；6 项 P1 缺陷：D3-S1/S2/S3 自然语言路由 + D4-27 小写 ak/sk 脱敏漏 + D9-2 JSON-RPC -32602 + EXP-E01 云主机路由 MISS；1 项 P1 SPEC-MISMATCH D9-9 capabilities 缺 cancellation；3 项 P2 缺陷：D3-S5 复合意图路由 + D8-9 遥测值未脱敏 + D4-25 Python hook 写命令分类。全部与同 gitHead ffd7b47 历史缺陷一致，无新增）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04.4 LTS，6.8.0-106-generic） |
| Node / npm / Python | Node v24.19.0 / npm 11.17.0 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，只读子账号 test001 已下发） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/--help）/ MCP 协议 / 真云 E2E / D10 评测集 |
| daily 基础用例 | 设计级 102 / 展开级 39（预筛后本客户端+OS） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（gitHead ffd7b47 = 被测包对应版本），决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 建删资源并归零验证；证据统一落 `evidence/<case-id>/`。本日全部探针/夹具/harness 均在本机**真实重跑**（非复制旧证据）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 102 + 展开级 39 = 141 |
| 已执行 | 141 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 129 / 10 / 0 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `92.1%`（129 / 140） |
| P0 / P1 / P2 缺陷 | 1 / 6 / 3（另 1 项 P1 SPEC-MISMATCH D9-9） |
| 红线（I 类）违规 | `0`（凭证类缺陷均源码级直调复现，未触发真实凭证泄漏） |
| 资源释放 | `本次全部归零`（ECS/子网/VPC/OBS/沙箱 session 均删净并实测归零） |

---

## 三、状态汇总

### 3.1 设计级（102）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | D2-4、D3-S1、D3-S2、D3-S3、D3-S5、D4-25、D4-27、D8-9、D9-2 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `1` | D9-9 capabilities 未声明 cancellation |
| NOT_RUN | `1` | D1-39（Windows 升级检测链专属，Linux 由 d1-upgrade no-EINVAL 代表覆盖） |
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
| 1 | P0 | D2-4 | 凭证脱敏 JSON 键值形态漏脱敏 | JSON 内 ak/sk/token 值全为 `<redacted>` | 原样返回 | `safety-policy.mjs:41-45` | P | 历史复现 |
| 2 | P1 | D3-S1 | 自然语言「只读查 ECS」未路由 | 命中 ECS | `Run hcloud --help` | `tools.mjs:2193-2217` | P | 历史复现 |
| 3 | P1 | D3-S2 | 自然语言「删 VPC 先确认」未路由 | 命中 VPC | `Run hcloud --help` | `tools.mjs:2193-2217` | P | 历史复现 |
| 4 | P1 | D3-S3 | 自然语言「沙箱预览」未路由 | 命中 Sandbox | `Run hcloud --help` | `tools.mjs:2193-2217` | P | 历史复现 |
| 6 | P1 | D4-27 | 双路径输出脱敏漏小写 ak=/sk= | ak=/sk= 值脱敏 | 明文残留 | `safety-policy.mjs:45` | P | 历史复现 |
| 5 | P1 | D9-2 | JSON-RPC 非法参数未返回 -32602 | 返回 -32602 | 无 error 对象 | `mcp-protocol.mjs:57-59` | P | 历史复现 |
| 7 | P1 | D9-9 | capabilities 未声明 cancellation（SPEC） | 声明 notifications.cancellation | 未声明 | `mcp-protocol.mjs:47-49` | P | 历史复现 |
| 8 | P1 | EXP-E01 | 中文意图「云主机」未路由到 ECS | 命中 ECS | MISS（`Run hcloud --help`） | `tools.mjs:2193-2217` | P | 历史复现 |
| 9 | P2 | D3-S5 | 复合意图分层路由未命中多服务 | 命中 OBS/DDS/DCS 等多服务 | `Run hcloud --help` | `tools.mjs:2193-2217` | P | 历史复现 |
| 10 | P2 | D8-9 | 遥测值未脱敏 | AK/SK/token 脱敏 | 原样返回 | `telemetry/telemetry.mjs:189-196` | P | 历史复现 |
| 11 | P2 | D4-25 | Python hook 写命令未分类 cli:write | 写命令事件键=cli:write | cli:invoke | `hooks/huaweicloud-safety.py:46` | P | 历史复现 |

> 以上 11 项与同 gitHead ffd7b47（v1.1.8-next.1）历史缺陷一致，属**历史缺陷原样复现，无新增**。提单走 `file_issue.py` 历史查重。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专用升级检测链（EINVAL 语义），OS 列标注「专属」；Linux 无对应语义 | Linux 侧已由 d1-upgrade queryDistTagsSync-no-EINVAL 代表覆盖，无需改 |

> 其余 NOT_RUN/BLOCKED 无。展开级已在 init_day 建包时按 agent+OS 预筛，非本客户端/OS 的用例未下发。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云 E2E 执行未输出明文 AK/SK）
- [x] 写操作误判 read-only：`0`（D4-5 delete/create-not-readonly 均 PASS）
- [x] 红线（I 类）违规：`无`（D2-4/D4-27/D8-9 脱敏缺陷均为源码级直调复现，未触发真实凭证泄漏）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针全部使用测试样例值，非真实 AK/SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（testbot3-hermes-ecs-1494132839 / b2dd188e） | 是 | 已删（ECS 异步删除未确认后手动补删） | ECS count 残留 0 确认 |
| VPC（testbot3-hermes-e2e-1494132839 / 9a5a4d2f） | 是 | 已删（子网先删后 VPC 再删） | ListVpcs 无 1494132839 残留 |
| 子网（testbot3-hermes-e2e-1494132839-subnet / 0481a6a5） | 是 | 已删 | ListSubnets 无 1494132839 残留 |
| OBS 桶（testbot3-hermes-obs-1494132839） | 是 | 已删（D3-C2 删桶归零 PASS） | 删桶归零确认 |
| 沙箱 session（D3-C3 / D3-C6） | 是 | 已 close_session | 会话关闭确认 |

> **归零说明**：`scripts/realcloud_e2e.mjs` 的 D3-C1 finally 块在 ECS 异步删除未完成时即返回 OK 而实际残留（`sh()` 仅按退出码判 ok 假阳性）；本次已手动补删 ECS→子网→VPC 并实测归零。账上另见前序运行（testbot3-hermes-ecs-1494067438，非本次创建）的 ECS 残留，未越权删除，已在此记录待维护者盘点。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities 未声明 cancellation）—— MCP 标准能力缺失，建议版本补齐或明确契约。
- 本轮复现（历史持续）：`D4-25`（Python hook 写命令未分类 cli:write）—— `WRITE_OPERATION_RE` 边界正则 `(^|[A-Za-z0-9])` 无法命中空格分隔的 `Service Operation` 格式，建议与 `READ_OPERATION_RE` 的 `\b` 边界对齐。
- 本轮未覆盖：真实 Agent 会话评测（AtomCode 无 DSH，D10-1/2/5/9 执行器属 DSH 客户端专属，本客户端走 run-eval 确定性路由层已覆盖 D10-3）。
- 建议：修复 `realcloud_e2e.mjs` finally 归零顺序（先确认 ECS 真删再删子网/VPC），并将资源名前缀按客户端区分（当前硬编码 `testbot3-hermes`）。
- harness 侧非缺陷：D3-C2「OBS 建桶」误判 FAIL 系 `/success/i` 对 OBS CLI 多行输出匹配失败（实际已创建成功并删桶归零），非产品缺陷。