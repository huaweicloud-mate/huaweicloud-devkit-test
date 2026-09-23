# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-23 17:05（北京时间）
> **执行归档**：`results/DSH/2026-09-23-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）`v1.1.6`（npm latest）
> **结论**：`FAIL`（设计级 18 FAIL + 1 SPEC-MISMATCH + 2 BLOCKED + 1 NOT_RUN；展开级 12 FAIL；全部 19 项为 v1.1.5 历史/同源缺陷，v1.1.6 复核确认，无当日新增）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（机器 IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.6`（npm latest，2026-09-23 安装；npm 包无 gitHead 字段，本地 hdk 未同步到 latest commit） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud（KooCLI）已配置 / doctor 已配置 |
| 真云凭证 | cn-north-4（AK/SK 管理员 hw018619646 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/help）/ MCP 协议(stdio+冷启) / 真云 E2E（VPC/SG/OBS 建删归零 + CTS 审计） |
| daily 基础用例 | 设计级 100 / 展开级 39（预筛剔除 27 非本客户端/OS）/ 追踪表 211 |

> **执行方法**：探针脚本（p1_src.mjs / p2_realcloud.mjs / p3_misc.mjs / p4_d413.mjs / p5_d425.py）直调 `huaweicloud-devkit@1.1.6` 安装包 `plugins/huaweicloud-core/src/*` 导出函数 + 真机 CLI + 真云建删资源，结论 JSON 落 `evidence/<case-id>/stdout.log`（status/why/executedAt），`backfill_daily.py --write` 一次性回填三份 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 100 + 展开级 39 = 139 |
| 已执行（PASS+FAIL+SPEC） | 设计级 97 + 展开级 39 = 136 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 设计级 `78 / 18 / 2 / 1 / 1`；展开级 `27 / 12 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED/NOT_RUN） | 设计级 `80.4%`（78/97）；展开级 `69.2%`（27/39） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（全部 19 项为 v1.1.5 历史/同源缺陷，本轮复核确认，无新增） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 全部归零（VPC/SG/OBS `tctest-dsh-*` 建后全删，计数 0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 78 | 有证据且通过 PASS 门禁 |
| FAIL | 18 | 不符预期，根因见缺陷清单（均历史） |
| BLOCKED | 2 | D3-S3（沙箱配额）/ D9-6（跨客户端多端环境） |
| SPEC-MISMATCH | 1 | D9-9（tools/call 超时/取消协议契约漂移） |
| NOT_RUN | 1 | D1-39（Windows 专属，本机 Linux，OS 豁免） |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | EXP-D5-6-1/3 + EXP-C4-01~22 + EXP-E06/E09/E15 |
| FAIL | 12 | EXP-E01~E05/E07/E08/E10~E14（中文意图路由 miss，同 D10-3） |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽）

> 19 项（18 FAIL + 1 SPEC-MISMATCH）。与 2026-09-21（v1.1.5）历史提单逐条复核一致，#1~#19 全部为历史/同源缺陷，v1.1.6 未修复。详表见 `FINDINGS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏漏小写 ak=/sk= | safety-policy.mjs:45 |
| 2 | P0 | D4-3 | 明文 secret API 拦截漏 kms DecryptData | safety-policy.mjs:432 |
| 3 | P0 | D4-15 | hook 命令替换绕过（$(...)） | risk-rule-engine.mjs:49-53 |
| 4 | P0 | D4-16 | shell 包裹穿透（bash -c 仍 allow） | safety-policy.mjs:428 |
| 5 | P1 | D4-17 | hook 畸形输入 fail-open | risk-rule-engine.mjs:104-106 |
| 6 | P0 | D4-23 | 全局规则 huawei-agent-rules 未注入 | package.json:8 |
| 7 | P1 | D10-3 | serviceCatalog 中文意图路由 miss | tools.mjs:1815-1925 |
| 8 | P1 | D4-13 | 最小权限动态切换失效 | credentials.mjs:152-160 |
| 9 | P2 | D8-1 | 文档 39 vs 实现 40 漂移 | hdk/AGENTS.md:27 |
| 10 | P1 | D9-9 | tools/call 超时/取消契约漂移(SPEC) | mcp-protocol.mjs:47 |
| 11 | P1 | D4-27 | 双路径脱敏缺裸 token | safety-policy.mjs:42 / hcloud-cli.mjs:587 |
| 12 | P2 | D3-S5 | 场景-复合路由 miss（同 D10-3） | tools.mjs:1815-1925 |
| 13 | P2 | D3-S6 | 场景-FG 路由 miss（同 D10-3） | tools.mjs:1815-1925 |
| 14 | P1 | D3-S7 | 场景-跨服务 RDS 路由不完整（同 D10-3） | tools.mjs:1815-1925 |
| 15 | P2 | D1-65 | 调试模式 env 判定不一致 | telemetry.mjs:81 |
| 16 | P2 | D8-9 | sanitizeValue 不脱敏敏感值 | telemetry.mjs:189-198 |
| 17 | P2 | D4-25 | Python hook 写命令分类失效 | huaweicloud-safety.py:46 |
| 18 | P2 | D4-26 | findings.evidence 脱敏缺裸 token | risk-rule-engine.mjs:17-27 |
| 19 | P1 | D4-24 | 确认令牌过期/重复确认边界非结构化 | hcloud-cli.mjs:84-96 / tools.mjs |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；本机 Linux，由 NR3 终端矩阵 + D1-40 代表覆盖 | — |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | check_user 可达且 agreementSigned=true，但 sandbox_connect 建立 DevStation workspace 超时(>60s，无配额/配给未完成)，无法 upload_project→deploy_nginx→deploy_check→公网URL→close_session | 恢复沙箱配额后补测即可 |
| D9-6 | 设计级 | P1 | BLOCKED | 补环境 | 需 MCP Inspector + ≥3 真实客户端并发接入验证协议互通；本机仅 DSH 单客户端（无 CDP Inspector 多客户端环境） | — |

> D3-S6/D3-S7 已由 source-level 确定性断言（serviceCatalog 路由）实测，均 miss（同 D10-3），转 FAIL（非 BLOCKED）。其「真云 FG 定时触发器 / RDS 建删」计费步骤属真云专项，建议母版将这两步拆为「路由断言 + 真云专项」两段。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据仅含 ak 前缀掩码/指纹，无明文 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（tctest-dsh-c4/s2/c18/c20 等） | 是（多次建删） | 全部删除 | ListVpcs 过滤 tctest-dsh- 计数 0 |
| 安全组（tctest-dsh-sg-*） | 1 | 已删（规则先删再删 SG） | ListSecurityGroups 计数 0 |
| OBS 桶（tctest-dsh-web-*） | 1 | 已删 | obs ls 计数 0 |
| ECS/RDS 等计费实例 | 0 | 0 | 未创建任何计费实例 |

> 真云只删本次创建资源（仅操作 `tctest-dsh-*` 前缀），删除前盘点 + 白名单，禁删既有/他人资源；本轮实测残留 VPC 0 / SG 0 / OBS 0。

---

## 八、遗留与建议

- **v1.1.6 缺陷复核确认**：npm latest 已更新至 1.1.6，但 #1~#19 项缺陷（与 2026-09-21 v1.1.5 一致）均在 1.1.6 复现，未修复；`file_issue.py` 历史查重后生成 `HISTORY_LINKS.md`，不重复开单。
- **D4-13 最小权限**：本轮用 `run-as-readonly.py` 等价 env 注入实测「动态切换」仍失效（返回管理员）；只读子账号写被 IAM 正确拒绝（VPC.0010 PolicyNotAuthorized），写保护层正确。只读子账号直连读需显式 project-id 才能完整解析（ECS/CTS/IMS 项目上下文解析受限），建议维护 agent 确认为环境侧（test001 项目关联）还是产品侧问题。
- **建议优先修复**：P0 安全类（D2-4/D4-3/D4-15/D4-16/D4-23）仍为最高优先级；裸 `token=` 脱敏缺口已在三处路径复现（D4-26 redactEvidence / D4-27 safety-policy + redactOutput）——建议把 `token` 关键字统一收口到 safety-policy 与 risk-rule-engine 共用的关键字表。