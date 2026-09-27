# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-28（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-28-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 与 P0 缺陷，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0011，IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.7`（npm latest，gitHead `7456d059`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，框架运行时 tools/list=40 一致） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI，真云可用）；obsutil 凭证已同步 |
| 真云凭证 | cn-north-4（AKSK 管理员 + 只读子账号 test001，均已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（VPC/OBS/安全组/沙箱建删归零）/ D10 评测集 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `evidence/<case-id>/stdout.log`（JSON 含 status/why/executedAt）；真云用例经 `hcloud`/MCP 工具真机建删并在测后归零验证；D3-S3 沙箱全链路真机执行（connect→upload→deploy_nginx→deploy_check→close_session）；D9-6 跨客户端互通经 `eval/harness/fixtures/d9-6-cross-client-interop.mjs` 双 stdio 桩客户端互证 12/12；D10 评测集直调 `huaweicloud_service_catalog` 逐条路由断言；D4-13 最小权限用只读子账号 test001 实测写被 IAM 拒绝。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `113 / 26 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `80.7%`（113/140） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（12 项缺陷全部命中历史 issue，复现未重复开单） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/OBS/安全组/沙箱均已删净） |

---

## 三、状态汇总

### 3.1 设计级（102）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `86` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `1` | D9-9 取消语义未声明 |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 列标注专属，Linux 豁免） |
| **合计** | **`102`** | |

- **P0**（21）：PASS 15 / FAIL 5（D4-3、D4-15、D4-16、D4-23、D9-12）/ NOT_RUN 1（D1-39 OS 专属豁免）
- **P1**（51）：PASS 46 / FAIL 4（D4-17、D4-24、D10-3、D3-S7）/ SPEC 1（D9-9）
- **P2**（30）：PASS 25 / FAIL 5（D4-25、D8-1、D8-9、D3-S5、D3-S6）

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | EXP-C4 22/22 + EXP-D5 2/2 + D10 评测集中文意图 HIT 3（E06/E09/E15） |
| FAIL | `12` | D10 评测集中文意图 MISS 11（E01~E05/E07/E10~E14）+ E08 诊断类未分流 |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 详单见 `FINDINGS.md`（12 项）。file_issue.py 查重后全部命中历史 issue 不重复开单；历史关联见 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData 明文 secret 未拦截 | safety/policy.json:26 缺 DecryptData | 历史（已提） |
| 2 | P0 | D4-15 | hook ANSI-C 编码绕过 | risk-rule-engine.mjs 未解析 ANSI-C 编码 | 历史 #673 |
| 3 | P0 | D4-16 | 命令包裹穿透 | cloud-risk-rules.json env-dump 词边界 | 历史 #673 |
| 4 | P0 | D4-23 | 全局规则未注入 | package.json files 缺 rules；mdc 孤儿 | 历史 #673/#770 |
| 5 | P0 | D9-12 | 未 initialize 先 tools/list 未返回 -32600 | mcp-server.mjs:166 + mcp-protocol.mjs:57 无时序校验 | 历史 #699/#774 |
| 6 | P1 | D4-17 | 畸形输入 fail-open | risk-rule-engine.mjs 无 finding 即 allow | 历史 #673 |
| 7 | P1 | D4-24 | 确认令牌无结构化返回 | hcloud-cli.mjs:85 consumeApprovalToken | 历史 #745/#747 |
| 8 | P1 | D10-3/D3-S5/S6/S7/EXP-E | 中文意图路由 MISS（准确率 21.4%） | tools.mjs:1817 routeMap 缺 CJK 关键词 | 历史 #11/#705 |
| 9 | P1 | D9-9 | 取消语义未声明（SPEC） | mcp-protocol.mjs:47 capabilities 无 cancellation | SPEC 延续 #774/#698 |
| 10 | P2 | D4-25 | Python hook 写分类失效 | huaweicloud-safety.py 写分类正则非 \b | 历史 #13 |
| 11 | P2 | D8-1 | 文档声明 39 vs 实现 40 | AGENTS.md:27 硬编码 39 | 历史（已提） |
| 12 | P2 | D8-9 | sanitizeValue 不脱敏敏感值 | telemetry.mjs:189 仅截断无脱敏 | 历史 #797 |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 【调归属】OS 专属 | Windows 升级检测链（EINVAL/文件锁），OS 列标注「专属」，本机 Linux | 由展开级 EXP-NR3 终端矩阵 + D1-40 代表覆盖，Linux 侧无需执行 |

> 本轮无 BLOCKED（D9-6 经 fixture 双 stdio 客户端互证 12/12 PASS；D3-S3 沙箱真机全链路通过；D3-C13 OBS 真机建桶/配置/删除归零）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（show_profile_redacted 走 redaction pipeline，ak/sk/token 均 `<redacted>`）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 只读子账号（test001）写操作被 IAM 拒绝（PolicyNotAuthorized），最小权限生效
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C4/D3-S2/D4-14/D4-18/D4-20） | 是 | 已删 | ListVpcs 归零 |
| OBS 桶（D3-C13） | 是 | 已删（obs rm -f） | 已归零 |
| 安全组（D4-19） | 是 | 已删（SG + 规则） | ListSecurityGroups 归零 |
| 沙箱（D3-S3） | 是 | close_session | 会话关闭，无计费残留 |

> 真云只删本次创建资源（前缀 `tctest-caa-`），测后逐一归零验证。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（tools/call 取消语义 capabilities.notifications.cancellation 未声明）。
- 本轮无新增缺陷：12 项缺陷全部命中历史 issue，已生成 HISTORY_LINKS.md 关联清单，不重复开单。
- 历史缺陷延续（1.1.7 未修复）：D4-3/D4-15/D4-16/D4-17/D4-23/D4-24/D4-25/D8-1/D8-9/D10-3/D3-S5/S6/S7/EXP-E/D9-9/D9-12。
- 建议：优先修复安全类 P0（D4-3 kms DecryptData、D4-15/16 编码/包裹绕过、D4-23 全局规则注入、D9-12 initialize 时序校验），及 serviceCatalog 中文路由覆盖率（D10-3，当前准确率 21.4%）。
