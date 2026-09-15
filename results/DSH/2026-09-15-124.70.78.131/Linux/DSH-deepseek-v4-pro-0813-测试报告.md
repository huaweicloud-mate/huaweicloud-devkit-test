# DSH-deepseek-v4-pro-0813 每日测试报告（补测 BLOCKED 版）

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 18:16 首版，22:00 补测 BLOCKED 回填更新
> **执行归档**：`results/DSH/2026-09-15-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（P0 7 + P1 4 + P2 1，含 D1-39 已知 #554 / D9-9 SPEC-MISMATCH；10 项去重关联 #683，2 项补测增补均历史关联不重复提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux x86_64（机器 IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 11 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（npm latest，gitHead `9b67256e`，PR #669 合入） |
| 工具全集 | 40（`TOOL_DEFINITIONS.length` = 40；源码 AGENTS.md 仍写 39 → D8-1 FAIL） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认 hcloud credentials configured） |
| 真云凭证 | cn-north-4（管理员 AKSK；无只读子账号 → D4-13 BLOCKED） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 性能 / 路由 / 升级检测链直调 |
| 设计真源 | 设计级 77 / 展开级 17（daily 精选，按 agent+OS 预筛）/ 追踪表 183 行 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（judgeUpdate/queryDistTagsSync/redactSecrets/classifyTextCommand/evaluateCommandRisk/getAuthStatus 等）+ MCP stdio 协议探针；证据统一落 `evidence/<case>/`。

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 77 + 展开级 17 = 94 |
| 已执行 | 94（PASS/FAIL/BLOCKED/SPEC 全覆盖，0 NOT_RUN / 0 空） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 54 / 11 / 11 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED） | 81.8%（54/66） |
| P0 / P1 / P2 缺陷（去重后） | 7 / 4 / 1 |
| 红线（I 类）违规 | 0（凭证泄漏 0；真云未创建资源） |
| 资源释放 | 全部归零（探针全部 hermetic，无云资源创建） |

## 三、状态汇总

### 3.1 设计级（77）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 54 | 有证据且通过 PASS 门禁（较首版 45 +9：D1-41/42/45、D2-2、D4-8/10/11、D8-4、D9-5 消解假阻塞） |
| FAIL | 11 | 不符预期，根因见缺陷清单（较首版 10 +1：D1-39 Windows 检测链，已知 #554） |
| BLOCKED | 11 | 仅真·外部依赖，四要素 blockedReason 已回填 |
| SPEC-MISMATCH | 1 | D9-9 取消/超时协议契约漂移 |
| NOT_RUN | 0 | - |
| **合计** | **77** | |

### 3.2 展开级（17）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 5 | EXP-D5-6-1/EXP-D5-6-3/EXP-E06/EXP-E09/EXP-E15 |
| FAIL | 12 | EXP-E01~E14 中文意图路由 miss（同 D10-3 根因，源码级 run-eval.mjs 确定性结论 21.4% HIT） |
| BLOCKED | 0 | - |
| SPEC-MISMATCH | 0 | - |
| NOT_RUN | 0 | - |
| **合计** | **17** | |

## 四、缺陷清单

> 全部真实执行后填写，字段完整到可让修复方直接定位。完整格式化版见同目录 `FINDINGS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏漏小写 ak=/sk= | 小写 `ak=`/`sk=` 值 → `<redacted>` | 原文未脱敏 | `safety-policy.mjs:45` |
| 2 | P0 | D4-2 | 凭证 env 打印拦截缺 HW_ 前缀 | `printenv HW_ACCESS_KEY` → deny | allow | `safety-policy.mjs:336` |
| 3 | P0 | D4-3 | 明文 secret API 漏 kms DecryptData | `hcloud kms DecryptData` → deny | allow/unknown_read | `safety-policy.mjs:349` |
| 4 | P0 | D4-15 | hook 命令替换绕过($()+ANSI-C) | 应 deny | allow | `risk-rule-engine.mjs:50-53` |
| 5 | P0 | D4-16 | shell 包裹穿透写操作拦截 | 内层 hcloud 写 → deny | allow | `safety-policy.mjs:345` |
| 6 | P0 | D4-23 | 全局规则未随安装注入 | install 后含 agent-rules | found=0 | `package.json:8` |
| 7 | P1 | D4-17 | hook 畸形输入 fail-open | 畸形输入 → deny(fail-closed) | allow | `risk-rule-engine.mjs:106` |
| 8 | P1 | D9-2 | JSON-RPC 错误码缺 -32601 | unknown method → -32601 | hardcoded -32603 | `mcp-protocol.mjs:95` |
| 9 | P1 | D10-3 | 中文意图路由大量 miss | 中文意图命中对应服务 | 3/15，多数返回 help | `tools.mjs:1776-1907` |
| 10 | P2 | D8-1 | 文档与能力漂移(39 vs 40) | 文档工具数=实现（40） | AGENTS.md 写 39 | `AGENTS.md:27,45` |
| 11 | P0·已知#554 | D1-39 | Windows 检测链 EINVAL 未修复 | Windows `status=0` 且 latestStable≠null | spawn npm.cmd 无 shell:true | `update-check.mjs:238/259` |
| 12 | P1·SPEC | D9-9 | 取消/超时协议契约漂移 | cancellation 实测(缺失→SPEC)；超时精确 -32000 | capabilities 无 cancellation；-32603 | `mcp-protocol.mjs:63-65` |

> #1~#10 与本客户端今日早先执行（#683）同 SUT 同根因，按「不重复提单」纪律去重关联；#11 关联 #554、#12 与 D9-2 同源（#692/#689/#683），均不新开单（见 HISTORY_LINKS.md）。

## 五、阻塞项（11 项设计级 BLOCKED · 仅真·外部依赖）

| 用例 ID | 阻塞原因（四要素已回填 blockedReason） |
|---|---|
| D1-5 | 多客户端残留矩阵 + Windows 文件锁环境（本机 Linux 单客户端） |
| D4-12 | SBOM 产出工具链缺失 |
| D4-13 | 只读 IAM 子账号凭证 credentials.readonly.json 缺失 |
| D4-14 / D4-18 / D4-19 / D4-20 / D4-24 | 真云写操作 + 交互确认流 / CTS 审计 / 注入时钟 |
| D7-4 | 国内网络 + 华为云 npm 镜像源不可控 |
| D9-6 | MCP Inspector + ≥3 真实客户端（本机仅 DSH） |
| D10-4 | 真实 Agent 会话评测（LLM harness 行为层） |

（完整逐一 blockedReason（实测时间+缺什么资源+影响+解除条件）已回填至设计级 CSV，`verify_coverage` 输出 BLOCKED=11 无原因 0。）

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 写命令均判 deny）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录仅含探针脚本 + stdout.log，无原始真实凭证/未脱敏日志（探针全部用假凭证）
- [x] 真云资源：本轮 0 创建 0 残留（全部函数级/CLI 只读/协议探针）

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / OBS / 沙箱等 | 否 | - | 无资源创建，残留 0 |

> 探针全部 hermetic（隔离 HOME + 假凭证 + 临时 skip 文件），未触发任何真云写操作。

## 八、遗留与建议

- 本补测消解 22 条 BLOCKED 中的 11 条假阻塞（D1-39 转 FAIL、D9-9 转 SPEC-MISMATCH、D1-41/42/45、D2-2、D4-8/10/11、D8-4、D9-5 转 PASS），回填证据全部落 `evidence/<case>/`。
- 剩余 11 条 BLOCKED 均为真·外部依赖（真云/凭证矩阵/LLM harness/国内网络/≥3 客户端），四要素 blockedReason 已回填。
- 待裁决 SPEC：D9-9 capabilities.cancellation 缺失 + -32000 timeout 未实现（协议契约漂移，与 D9-2 同源）。
- 建议：D1-39（#554）、D10-3 中文路由（#683）、D9-2/-9 协议契约（#692）为高优先级修复项；修复后按回归路线复测。