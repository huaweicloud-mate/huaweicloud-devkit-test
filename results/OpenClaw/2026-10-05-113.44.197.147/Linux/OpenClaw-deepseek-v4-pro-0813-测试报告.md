# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-05 05:58`（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-05-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（P0 缺陷 2 项：D4-21 宽泛 IAM 制品未拦截、D9-12 initialize 握手时序缺口）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（ECS `ecs-hd-ai-work-00-0003`，IP 113.44.197.147） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS，含新增 `huaweicloud_sandbox_expose_tunnel`） |
| hcloud / 依赖 | `KooCLI 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4`（管理员 AKSK + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status/update）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 102 / 展开级 39 / 追踪表 211 |

> **执行方法**：探针脚本（.mjs/.py）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果由 `run_all.sh` 新鲜重跑落 `stdout.log`；真云 E2E 建删归零由 realcloud 探针真机执行；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140`（1 条 NOT_RUN 为 OS 专属豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 10 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `92.8%` |
| P0 / P1 / P2 新增缺陷 | `2 / 6 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（tctest- VPC/SG/subnet/RDS 残留 0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `1` | D9-9 capabilities.cancellation 未声明 |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 豁免） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 云主机路由 MISS |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

（详见同目录 `FINDINGS.md`，共 11 项，其中 1 项为既有 EXP-E01 与 D10-3 合并；以下为汇总）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-21 / D4-7 | hook_check_artifacts 宽泛 IAM（Terraform HCL `actions=["*"]`）未拦截 | cloud-risk-rules.json:196-209 | 待提单（历史查重 #651/#845） |
| 2 | P1 | D4-6 | adminPass 空格形式值未脱敏 | safety-policy.mjs:42 | 待提单（历史 #712/#845） |
| 3 | P2 | D4-25 | Python hook 写命令遥测误分类（cli:invoke） | huaweicloud-safety.py:46 | 待提单（历史 #844/#752） |
| 4 | P1 | D4-27 | 双路径输出脱敏小写 ak=/sk= 缺位 | safety-policy.mjs:45 | 待提单（历史 #683/#845） |
| 5 | P2 | D8-9 | sanitizeValue 未做凭证脱敏 | telemetry.mjs:189-196 | 待提单（历史 #844/#845） |
| 6 | P0 | D9-12 | 未 initialize 先 tools/list 未返回 -32600 | mcp-protocol.mjs:57 | 待提单（历史 #814/#844/#699） |
| 7 | P1 | D9-2 | tools/list 传 string params 未返回 -32602 | mcp-protocol.mjs:57 | 待提单（历史 #814/#752） |
| 8 | P1 | D9-9 | capabilities.cancellation 未声明（SPEC） | mcp-protocol.mjs:32-49 | 待提单（历史 #828/#774） |
| 9 | P1 | D10-3 / EXP-E01 | 中文「云主机」未命中 ECS | tools.mjs:1970-1987 | 待提单（历史 #705/#844/#845） |
| 10 | P2 | D3-S5 | 复合中文意图（物联网+时序数据+前端托管）未命中 | tools.mjs:1968-2192 | 待提单（历史 #788/#844） |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属；OS 列标注「Windows 专属」，Linux 侧结构性不适用，由展开级 NR3 终端矩阵按负面/环境验证覆盖 | 无需改用例；OS 列已正确标注专属，Linux 侧继承展开级负面覆盖 |

其余用例全部执行并回填，无 BLOCKED 项。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云探针全程走脱敏管道，证据目录无明文 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC 安全组（D3-C4/D4-14） | 是（tctest-d3c4-sg-*） | 已删 | tctest-d3c4- 剩余 0 |
| VPC/子网（D3-S2/D3-S7） | 是（tctest-s2-*/tctest-s7-*） | 已删 | tctest- 剩余 0 |
| OBS 桶（D3-C13） | 是（tctest-obs-*) | 已删 | 已删桶 |
| RDS 实例（D3-S7） | 是（postPaid MySQL） | 已删 | ListInstances 无残留 |
| FunctionGraph 函数（D3-S6） | 是 | 已删 | FSS.1051（不存在） |
| DevStation 沙箱（D3-S3） | 是 | close_session | 会话已关闭 |

> 全部本次创建资源均已删除并归零，未删既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` capabilities.cancellation 未声明（contract 漂移，维护方裁决 SPEC 或实现补齐）。
- 本轮 11 项缺陷均命中上游已有 open issue（`file_issue.py` 查重），不重复提单，仅记录 HISTORY_LINKS.md（由下方 FINDINGS 提单流程生成）。
- 建议：DMS/DEW 母版枚举对象已由源码升级 aggregate 子服务路由，EXP-C4 探针已同步更新（不再标「改用例」）。