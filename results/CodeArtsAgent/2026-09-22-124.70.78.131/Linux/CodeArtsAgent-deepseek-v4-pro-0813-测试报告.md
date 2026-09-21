# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-22 05:30（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-22-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 与 P0 缺陷，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0011） |
| Node / npm / Python | Node v26.8.1 / npm 11.19.0 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f66`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，框架运行时 tools/list=40 一致） |
| hcloud / 依赖 | hcloud 已安装（KooCLI，真云可用） |
| 真云凭证 | cn-north-4（AKSK 管理员 + test001 只读子账号，均已配置） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status/help）/ MCP 协议 / 真云 E2E（VPC/OBS/沙箱建删归零）/ D10 评测集 |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结论落 `evidence/<case-id>/stdout.log`；真云用例经 `hcloud`/MCP 工具真机建删并在测后归零验证；D10 评测集跑 `eval/harness/run-eval.mjs`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `139`（设计级 100 + 展开级 39） |
| 已执行 | `139` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `109 / 27 / 1 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `79.6%`（109/137） |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 1`（D4-3 P0 / D4-24 P1 / D8-1 D8-9 P2；另有 SPEC 1） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/OBS/安全组/沙箱均已删净，ListVpcs current_count=0） |

---

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `82` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | D9-6 跨客户端互通（需多客户端环境） |
| SPEC-MISMATCH | `1` | D9-9 取消语义未声明 |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 列标注专属，Linux 豁免） |
| **合计** | **`100`** | |

- **P0**：PASS 14 / FAIL 4（D4-3、D4-15、D4-16、D4-23）/ NOT_RUN 1（D1-39 OS 专属豁免）
- **P1**：PASS 44 / FAIL 5 / SPEC 1 / BLOCKED 1
- **P2**：PASS 24 / FAIL 6

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | EXP-C4 22/22 + EXP-D5 2/2 + D10 评测 HIT 3 |
| FAIL | `12` | D10 评测集中文意图 MISS（EXP-E 11 MISS + E08 诊断未分流） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 详单见 `FINDINGS.md`（12 项）。概要如下；历史缺陷经 file_issue.py 查重后不重复开单。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-15 | hook ANSI-C 编码绕过 | risk-rule-engine.mjs 未解析 ANSI-C 编码 | 历史 #673 |
| 2 | P1 | D4-16 | 命令包裹穿透 | cloud-risk-rules.json env-dump 词边界 | 历史 #673 |
| 3 | P1 | D4-17 | 畸形输入 fail-open | risk-rule-engine.mjs 无 finding 即 allow | 历史 #673 |
| 4 | P0 | D4-23 | 全局规则未注入 | rules/huawei-agent-rules.mdc 无代码引用 | 历史 #673 |
| 5 | P1 | D4-25 | Python hook 写分类失效 | huaweicloud-safety.py `(^\|[A-Za-z0-9])` 非 `\b` | 历史 #13 |
| 6 | P1 | D4-26/27 | token 双路径脱敏缺口 | safety-policy.mjs/risk-rule-engine.mjs 未含裸 token | 历史 #726 |
| 7 | P1 | D10-3/D3-S5/S6/S7/EXP-E | 中文意图路由 MISS（准确率 21.4%） | tools.mjs:1786-1890 routeMap 缺 CJK 关键词 | 历史 #11 |
| 8 | P0 | D4-3 | kms DecryptData 明文 secret 未拦截 | safety-policy.mjs:232 blockedSecretOperations 缺 DecryptData | **本轮新增** |
| 9 | P1 | D4-24 | 确认令牌无结构化返回 | hcloud-cli.mjs:84-96 返回 null 无 code/outcome | **本轮新增** |
| 10 | P2 | D8-1 | 文档声明 39 vs 实现 40 | AGENTS.md:27/45 | **本轮新增** |
| 11 | P2 | D8-9 | sanitizeValue 不脱敏敏感值 | telemetry.mjs:189 仅截断无脱敏 | **本轮新增** |
| 12 | P1 | D9-9 | 取消语义未声明（SPEC） | mcp-protocol.mjs capabilities 无 cancellation | SPEC 延续 |

### 关键修复确认（今日复测 PASS，与昨日对比）

- D4-2 凭证 env 打印拦截：昨日 FAIL（HW_ 前缀未覆盖），今日 `printenv HW_ACCESS_KEY`→deny ✓
- D9-2 JSON-RPC 错误码：昨日 unknown tool -32603，今日 -32601 正确 ✓
- D4-29 classifyRawCommand：昨日未导出，今日已导出且=classifyTextCommand 包装 ✓
- D9-8 inputSchema 版本：昨日 schema 版本漂移，今日 40 工具 inputSchema 均 type=object ✓
- D4-13 最小权限：昨日只读子账号写成功（权限过宽），今日写被 IAM 拒绝（PolicyNotAuthorized）✓
- D3-S3 沙箱预览：真机全链路（connect/upload/exec/deploy_nginx/deploy_check/close_session）通过 ✓

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 【调归属】OS 专属 | Windows 升级检测链（EINVAL/文件锁），OS 列标注「专属」，本机 Linux | 由展开级 EXP-NR3 终端矩阵 + D1-40 代表覆盖，Linux 侧无需执行 |
| D9-6 | 设计级 | P1 | BLOCKED | 【补环境】 | 跨客户端互通需 MCP Inspector + ≥3 真实客户端并发接入；本机单客户端（无 CDP Inspector 多客户端环境） | 协议层 clientInfo 互通已 PASS；需多客户端会话环境才能补全 |

---

## 六、安全/红线

- 真云凭证 AK/SK 全程未明文输出，`show_profile_redacted` 走 redaction pipeline（ak/sk `<redacted>`）。
- 真云用例均真机执行：VPC 建删（ListVpcs current_count=0）、OBS 桶建删（obs rm 归零）、安全组建删（ListSecurityGroups 归零）、沙箱 close_session。
- 只读子账号（test001）写操作被 IAM 拒绝（PolicyNotAuthorized），最小权限生效。
- 无 I 类安全红线违规。

---

## 七、资源释放

| 资源 | 释放方式 | 结果 |
|---|---|---|
| VPC（D3-S2/D4-14/D4-18/D4-20） | hcloud VPC DeleteVpc | ListVpcs tctest-caa-* current_count=0 |
| OBS（D3-C4/D3-C13） | obs rm -f | 桶删除归零 |
| 安全组/规则（D4-19） | DeleteSecurityGroupRule + DeleteSecurityGroup | ListSecurityGroups 归零 |
| 沙箱（D3-S3） | close_session | 会话关闭，无计费残留 |
| 只读子账号写（D4-13） | 无资源创建（被 IAM 拒绝） | 零残留 |

---

## 八、遗留建议

1. **路由中文关键词（#11）**：routeMap 需为 20+ 服务补中文关键词（云主机/云服务器/数据库/备份/监控/账单等），D10 评测准确率当前仅 21.4%，是最大体验短板。
2. **secret API 拦截（D4-3 新增）**：blockedSecretOperations 补 `kms DecryptData` 等返回明文数据的 API。
3. **审批流契约（D4-24 新增）**：consumeApprovalToken 过期/重复返回结构化 `{code}/{outcome}`，便于机器断言。
4. **遥测脱敏（D8-9 新增）**：sanitizeValue 需真正移除 AK/SK/token 敏感值，而非仅长度截断。
5. **文档同步（D8-1）**：AGENTS.md 两处「39 tools」更新为 40。
6. 历史缺陷 #673/#13/#726/#11 已连续多日复现，建议维护者优先修复 hook 绕过与路由 CJK 两大块。
