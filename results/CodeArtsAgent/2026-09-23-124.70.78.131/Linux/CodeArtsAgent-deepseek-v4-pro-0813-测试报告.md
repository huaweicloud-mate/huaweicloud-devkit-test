# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-23 05:30（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-23-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 与 P0 缺陷，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0011） |
| Node / npm / Python | Node v26.8.1 / npm 11.19.0 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.6`（npm latest，gitHead `46152dd8`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，框架运行时 tools/list=40 一致） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI，真云可用） |
| 真云凭证 | cn-north-4（AKSK 管理员 + test001 只读子账号，均已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（VPC/OBS/安全组/沙箱建删归零）/ D10 评测集 |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `plugins/huaweicloud-core/src/*` 导出函数，结论落 `evidence/<case-id>/stdout.log`；真云用例经 `hcloud`/MCP 工具真机建删并在测后归零验证；D10 评测集跑 `eval/harness/run-eval.mjs` + 双 stdio 客户端互通 fixture。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `139`（设计级 100 + 展开级 39） |
| 已执行 | `139` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `110 / 27 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `79.7%`（110/138） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（全部为历史 issue 复现，未重复开单） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/OBS/安全组/沙箱均已删净，ListVpcs current_count=0） |

---

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `83` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `1` | D9-9 取消语义未声明 |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 列标注专属，Linux 豁免） |
| **合计** | **`100`** | |

- **P0**：PASS 13 / FAIL 4（D4-3、D4-15、D4-16、D4-23）/ NOT_RUN 1（D1-39 OS 专属豁免）
- **P1**：PASS 45 / FAIL 8 / SPEC 1
- **P2**：PASS 25 / FAIL 3

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | EXP-C4 22/22 + EXP-D5 2/2 + D10 评测 HIT 3（E06/E09/E15） |
| FAIL | `12` | D10 评测集中文意图 MISS（EXP-E 12 MISS） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 详单见 `FINDINGS.md`（12 项，全部历史 issue 复现）。file_issue.py 查重后无新问题，不重复开单；历史关联见 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-15 | hook ANSI-C 编码绕过 | risk-rule-engine.mjs 未解析 ANSI-C 编码 | 历史 #673 |
| 2 | P0 | D4-16 | 命令包裹穿透 | cloud-risk-rules.json env-dump 词边界 | 历史 #673 |
| 3 | P1 | D4-17 | 畸形输入 fail-open | risk-rule-engine.mjs 无 finding 即 allow | 历史 #673 |
| 4 | P0 | D4-23 | 全局规则未注入 | rules/huawei-agent-rules.mdc 无代码引用 | 历史 #673/#770/#758/#761 |
| 5 | P2 | D4-25 | Python hook 写分类失效 | huaweicloud-safety.py:46 `(^\|[A-Za-z0-9])` 非 `` | 历史 #13 |
| 6 | P1 | D4-26/27 | token 双路径脱敏缺口 | safety-policy.mjs/risk-rule-engine.mjs 未含裸 token | 历史 #726 |
| 7 | P1 | D10-3/D3-S5/S6/S7/EXP-E | 中文意图路由 MISS（准确率不足90%） | tools.mjs:1817 routeMap 缺 CJK 关键词 | 历史 #11 |
| 8 | P0 | D4-3 | kms DecryptData 明文 secret 未拦截 | safety-policy.mjs:232 blockedSecretOperations 缺 DecryptData | 历史（已提） |
| 9 | P1 | D4-24 | 确认令牌无结构化返回 | hcloud-cli.mjs:84-96 返回 null 无 code/outcome | 历史 #745/#747 |
| 10 | P2 | D8-1 | 文档声明 39 vs 实现 40 | AGENTS.md:27/45 | 历史 #742/#674 |
| 11 | P2 | D8-9 | sanitizeValue 不脱敏敏感值 | telemetry.mjs:189 仅截断无脱敏 | 历史 #797/#791/#761 |
| 12 | P1 | D9-9 | 取消语义未声明（SPEC） | mcp-protocol.mjs:47 capabilities 无 cancellation | SPEC 延续 #774/#698 |

### 对比昨日（1.1.5 → 1.1.6）关键变化

- **D4-17 空参数 fail-closed 已修复**：`classifyHcloudArgs([])` 由 allow 转为 deny（risk-rule-engine 空输入兜底生效）；畸形制品仍 fail-open。
- **D9-6 跨客户端互通由 BLOCKED 转 PASS**：`eval/harness/fixtures/d9-6-cross-client.mjs` 双 stdio 客户端（Hermes/AtomCode）互证 initialize/tools-list(40)/tools-call/resources 全通道互通 7/7。
- **D1-65 调试模式源码级验证通过**：`update-check.mjs` debugLog 分支 `HUAWEICLOUD_DEVKIT_DEBUG==='1'||'true'` 正确开启调试日志。
- **D2-4 show_profile_redacted 脱敏正确**：accessKeyId/secretAccessKey/securityToken 均 `<redacted>`（小写 ak=/sk= 属历史 #683 已由 D4-26/27 覆盖）。
- 其余 P0/P1 缺陷在 1.1.6 中均延续（未修复）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 【调归属】OS 专属 | Windows 升级检测链（EINVAL/文件锁），OS 列标注「专属」，本机 Linux | 由展开级 EXP-NR3 终端矩阵 + D1-40 代表覆盖，Linux 侧无需执行 |

> 本轮无 BLOCKED（昨日 BLOCKED 的 D9-6 已通过 fixture 补测转 PASS；D3-S3 沙箱真机全链路通过）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（show_profile_redacted 走 redaction pipeline，ak/sk/token 均 `<redacted>`）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 只读子账号（test001）写操作被 IAM 拒绝（PolicyNotAuthorized/VPC.0010），最小权限生效
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C4/D3-S2/D4-14/D4-18/D4-20） | 是 | 已删 | ListVpcs current_count 归零 |
| OBS 桶（D3-C13） | 是 | 已删（obs rm -f） | 已归零 |
| 安全组（D4-19） | 是 | 已删（SG + 规则） | ListSecurityGroups 归零 |
| 沙箱（D3-S3） | 是 | close_session | 会话关闭，无计费残留 |

> 真云只删本次创建资源（前缀 `tctest-caa-`），测后逐一归零验证。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（tools/call 取消语义 capabilities.notifications.cancellation 未声明）。
- 历史缺陷延续（1.1.6 未修复）：D4-3/D4-15/D4-16/D4-17/D4-23/D4-24/D4-25/D4-26/D4-27/D8-1/D8-9/D10-3/D3-S5/S6/S7/EXP-E，均已在源仓库 open issue 跟踪，不重复开单。
- 建议：优先修复安全类 P0（D4-3 kms DecryptData、D4-15/16 编码/包裹绕过、D4-23 全局规则注入），及 serviceCatalog 中文路由覆盖率（D10-3，当前准确率不足 90%）。
