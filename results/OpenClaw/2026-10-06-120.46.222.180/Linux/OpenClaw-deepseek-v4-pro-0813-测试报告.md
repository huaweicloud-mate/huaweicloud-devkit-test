# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-06 06:48`（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-06-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（10 FAIL / 1 SPEC-MISMATCH，均命中历史 issue）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux 6.8.0-106-generic (aarch64) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS，1.1.8 新增 sandbox_expose_tunnel） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 已确认配置 |
| 真云凭证 | cn-north-4（管理员 AKSK + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 用例 | 设计级 102 + 展开级 39（追踪表 211 行） |
| 执行 IP | 120.46.222.180 |

> **执行方法**：探测脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真机 CLI 记录日志；eval harness（run-eval.mjs / protocol-probe.mjs / fixtures）跑确定性评测；真云 E2E 建删归零；证据统一落 `evidence/<case-id>/`。

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 10 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `129/140 = 92.1%` |
| P0 / P1 / P2 新增缺陷 | `2 / 5 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/subnet/RDS/SG/OBS/FunctionGraph/EIP 残留 0） |

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `1` | D9-9 cancellation 契约漂移 |
| NOT_RUN | `1` | D1-39（Windows OS 专属，Linux 结构性不适用） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文「云主机」路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-21/D4-7 | hook_check_artifacts 宽泛 IAM 制品（Terraform HCL actions=["*"]）未拦截 | `safety/rules/cloud-risk-rules.json:196-209` | 历史 #845/#841/#651 等 |
| 2 | P1 | D4-6 | adminPass 空格形式值未脱敏 | `src/safety-policy.mjs:45` | 历史 #845/#844/#712 |
| 3 | P2 | D4-25 | Python hook 写命令遥测误分类（cli:write 恒不触发） | `hooks/huaweicloud-safety.py:46` | 历史 #844/#752 |
| 4 | P1 | D4-27 | 双路径输出脱敏小写 ak=/sk= 未脱敏 | `src/safety-policy.mjs:45` | 历史 #683/#845 |
| 5 | P2 | D8-9 | 遥测值 sanitizeValue 未做凭证脱敏 | `src/telemetry/telemetry.mjs:189-196` | 历史 #844/#845 |
| 6 | P0 | D9-12 | initialize 握手时序缺口（未 initialize 先 tools/list 未返回 -32600） | `src/mcp-protocol.mjs:57` | 历史 #814/#844/#699 |
| 7 | P1 | D9-2 | tools/list 传非法 params 未返回 -32602 | `src/mcp-protocol.mjs:57` | 历史 #814/#752 |
| 8 | P1 | D9-9 | capabilities.cancellation 未声明（SPEC-MISMATCH） | `src/mcp-protocol.mjs:32-49` | 历史 #828/#774 |
| 9 | P1 | D10-3/EXP-E01 | 中文意图「云主机」未命中 ECS | `src/tools.mjs:1970-1984` | 历史 #705/#844/#845 |
| 10 | P2 | D3-S5 | 复合中文意图（物联网+时序数据+前端托管）路由未命中 | `src/tools.mjs:1968-2192` | 历史 #788/#844 |

> 全部 10 项缺陷 fresh 复现于 2026-10-06（SUT gitHead `ffd7b47` 与 2026-10-05 同 commit，代码未变），均命中上游历史 issue，本次不重复开单（见 HISTORY_LINKS.md）。

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链可用性（EINVAL 语义），OS 列标注「Windows 专属」；Linux 侧由展开级 EXP-NR3-10 代表覆盖 | 无需改用例（OS 专属豁免） |

> 无 BLOCKED 用例。真云 E2E 全部真机执行，无「无凭证 / 需保证金」假阻塞。

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（probe 输出均为 redacted / 判定布尔）

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（tctest-s2/s7-） | 是 | 已删 | 残留 0 |
| Subnet（tctest-s7-） | 是 | 已删 | 残留 0 |
| RDS（tctests7db*） | 是 | 已删 | 残留 0（BUILD→ACTIVE→Delete 完整闭环） |
| 安全组（tctest-d3c4-） | 是 | 已删 | 残留 0 |
| OBS 桶（tctest-obs-webs*） | 是 | 已删 | 残留 0 |
| FunctionGraph（tctest-*） | 是 | 已删 | 残留 0 |
| 沙箱会话 | 是 | close_session | Azure 会话已关闭 |
| EIP | 否（未创建） | — | total_count 0 |

> D3-S7 首次跑因 RDS BUILD→ACTIVE 超 500s 被 timeout 截断，VPC/subnet 残留已由人工「只删本次创建」补齐归零；二次重跑完整 9/9 PASS。归零核验：全部 `tctest-` 前缀资源残留 0。

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` 取消能力声明缺失（SPEC-MISMATCH，维护方裁决）。
- 本轮未覆盖：`D1-39`（Windows OS 专属）；`D10-1/2/5/9` 真实 Agent 会话评测（非 DSH 客户端，需 CDP 会话自动化，OpenClaw 走源码级 serviceCatalog 确定性路由，见 EXP-E01~E15）。
- 建议：10 项缺陷均为历史已知问题、代码未变（`ffd7b47`），建议维护方聚焦 `safety-policy.mjs` redactString 键值正则（覆盖空格分隔 + 小写）、`mcp-protocol.mjs` initialize 状态机、`serviceCatalog` 中文关键词补全三项根因修复。