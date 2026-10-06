# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-07（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-07-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 与 P0 缺陷，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（ecs-hd-ai-work-00-0011，IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b474`） |
| 工具全集 | `41`（tools/list=41，较 v1.1.7 新增 sandbox_expose_tunnel） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI，真云可用）；undici 已列入 dependencies |
| 真云凭证 | cn-north-4（AKSK 管理员 + 只读子账号 test001，均已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（VPC/最小权限建删归零）/ D10 评测集 / fixtures |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `evidence/<case-id>/stdout.txt`；真云用例经 MCP 工具真机建删并测后归零验证；D2-10/D2-13/D4-12/D9-6/D9-9 走 `eval/harness/fixtures/*.mjs` 夹具；D4-13 用只读子账号 test001 实测最小权限；D10-3 评估直调 serviceCatalog + `eval/harness/run-eval.mjs`（15 条中文意图）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 11 / 2 / 2 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `90.6%`（125/138） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（11+2 项全部命中历史 issue，无新增） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/审批令牌均已清净） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | D3-S6/D3-S7 真云创建需改用例（见 §五） |
| SPEC-MISMATCH | `2` | D4-24 / D9-9 契约漂移 |
| NOT_RUN | `1` | D1-39 Windows 专属（Linux 不适用） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文意图残留 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（12 项，全部历史延续，详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData 明文 secret 解密 API 未拦截 | safety/policy.json:26 | 历史 |
| 2 | P0 | D4-15 | hook ANSI-C 引号编码绕过 | risk-rule-engine.mjs | 历史 #673 |
| 3 | P0 | D4-21 | HCL/Terraform broad IAM 未拦截 | risk-rule-engine.mjs:150 | 历史 |
| 4 | P0 | D9-12 | initialize 时序未强制（未返回 -32600） | mcp-server.mjs:175 | 历史 #699/#774 |
| 5 | P1 | D4-17 | 畸形输入 fail-open | risk-rule-engine.mjs | 历史 #673 |
| 6 | P1 | D4-24 | 审批令牌契约字段漂移（SPEC） | hcloud-cli.mjs:113 | 历史 #745/#747 |
| 7 | P1 | D9-9 | tools/call 取消语义未声明（SPEC） | mcp-protocol.mjs:47 | 历史 #774/#698 |
| 8 | P2 | D4-25 | Python hook 写操作遥测分类失效 | huaweicloud-safety.py:46 | 历史 #13 |
| 9 | P2 | D4-26 | findings 证据脱敏不完整 | risk-rule-engine.mjs | 历史 |
| 10 | P2 | D8-1 | 文档与能力漂移（声明 39 vs 实现 41） | AGENTS.md:27 | 历史 |
| 11 | P2 | D8-9 | sanitizeValue 不脱敏敏感值 | telemetry.mjs:189 | 历史 #797 |
| 12 | P2 | D3-S5 | 复合意图路由 MISS（含 EXP-E01） | tools.mjs | 历史 #11 |

> 全部 12 项缺陷经 file_issue.py 查重命中上游历史 open issue，本轮不新开单，仅生成 HISTORY_LINKS.md 关联清单。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），本机 Linux，由 D1-40/EXP-NR3 代表覆盖 | — |
| D3-S6 | 设计级 | P2 | BLOCKED | 改用例 | FunctionGraph 定时任务真云创建用例；实测 `hcloud FunctionGraph CreateFunction` 返回 `[USE_ERROR] Invalid parameter: code.filename`，探针未提供完整 code 参数，无法真机创建函数验证 URN/触发器 | 用例前置补全 `code.filename`（含完整 zip 代码）或改用函数级直调断言 |
| D3-S7 | 设计级 | P1 | BLOCKED | 改用例 | 跨服务 RDS 交付用例需先编排 VPC/子网/安全组前置；实测 `hcloud RDS CreateInstance` 返回 `[USE_ERROR] Invalid parameter: db.password`，探针未实现前置编排 | 用例补充 VPC/子网/安全组前置编排 + db.password 参数 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针均 redactSecrets 处理后输出）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 华为云 VPC（真云 E2E） | 是 | 已删 | realcloud-probe 35 项含测后删除归零断言，无残留 |
| 审批令牌（approvals.json） | 是 | 已清理（probe 测后 delete） | 无残留测试令牌 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留即 FAIL。

---

## 八、遗留与建议

- 待裁决 SPEC：`D4-24`（审批令牌 code/outcome 契约字段）、`D9-9`（capabilities.notifications.cancellation）。
- 本轮未覆盖（说明范围）：多客户端终端矩阵（单机仅 CodeArtsAgent）；真实 Agent 会话评测（D10-1/2/5/9 需 dsh/CDP，本机非 DSH）。
- 测试侧修正：D4-23 探针 `stdout.txt` SUMMARY 的 `verdict` 字段为历史硬编码 `FAIL`，与 facts 四要素（仓库根存在 rules + 源码引用 + setup-cli 复制 + 隔离产物含 .mdc）矛盾；注入实际已生效，本轮据实标 PASS，建议维护者修正该探针 verdict 动态判定逻辑。
- 建议：D8-1 文档 tools 数由 39 同步为 41；D3-S6/S7 用例前置参数补齐后即可解除 BLOCKED。
- 测试侧修正：realcloud-probe 的 `list_operations` 成功断言原为 `lo.command || lo.result`，未覆盖 DMS/DEW 聚合服务返回的 `aggregate/subServices` 结构，使 EXP-C4-14(DMS)/EXP-C4-18(DEW) 误报 FAIL；本轮修正断言为同时接受 `aggregate===true && subServices 非空`，实测 DMS→[Kafka,RabbitMQ,RocketMQ]、DEW→[KMS,CSMS] 子服务 help 均 `ok=true`，35/35 全 PASS，据实标 PASS。
