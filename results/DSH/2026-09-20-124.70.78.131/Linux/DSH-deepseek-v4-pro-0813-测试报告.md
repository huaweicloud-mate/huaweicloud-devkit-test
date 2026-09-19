# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-20 05:45（北京时间）
> **执行归档**：`results/DSH/2026-09-20-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）`v1.1.5`（npm latest，gitHead `e7ed6f66e`）
> **结论**：`FAIL`（设计级 17 FAIL + 1 SPEC-MISMATCH + 7 BLOCKED + 1 NOT_RUN；展开级 12 FAIL；其中 11+3 项为历史/同源缺陷，4 项新增用例暴露的新缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（机器 IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f666ac5049ab467ff03daedd463da754d8a`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI）/ doctor 确认已配置 |
| 真云凭证 | cn-north-4（AK/SK 管理员 hw018619646 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/help）/ MCP 协议(stdio+remote)/ 真云 E2E |
| daily 基础用例 | 设计级 100 / 展开级 39（预筛剔除 27 非本客户端/OS）/ 追踪表 209 |

> **执行方法**：复用上轮 27 个探针 + 本轮新增 16 个用例探针（env-var/koocli/proxy/scenario/security-new/cache/mcp-config/remote-server/tunnel/help/install-skip/D4-25/D10-4/D3-C13/D3-S1/D3-S2/D3-S4），直调全局包与源码导出函数/真机 CLI/真云建删资源，证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 100 + 展开级 39 = 139 |
| 已执行（PASS+FAIL+SPEC） | 设计级 92 + 展开级 39 = 131 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 设计级 `74 / 17 / 7 / 1 / 1`；展开级 `27 / 12 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED/NOT_RUN） | 设计级 `80.4%`（74/92）；展开级 `69.2%`（27/39） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 4`（#15~#18：D1-65/D8-9/D4-25/D4-26；均为新增用例暴露，v1.1.5 未变） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 全部归零（VPC/SG/OBS `tctest-dsh-*` 建后全删，ListVpcs/ListSecurityGroups/obs ls 残留计数 0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 74 | 有证据且通过 PASS 门禁 |
| FAIL | 17 | 不符预期，根因见缺陷清单 |
| BLOCKED | 7 | D3-C14/D3-S3/D3-S6/D3-S7/D4-12/D4-24/D9-6 |
| SPEC-MISMATCH | 1 | D9-9（tools/call 超时/取消协议契约漂移） |
| NOT_RUN | 1 | D1-39（Windows 专属，本机 Linux，OS 豁免） |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | EXP-D5-6-1/3 + EXP-C4-01~22 + EXP-E06/E09/E15 |
| FAIL | 12 | EXP-E01~E05/E07/E08/E10~E14（中文意图路由 miss） |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽）

> 18 项（17 FAIL + 1 SPEC-MISMATCH）。#1~#11 为 v1.1.5 历史已提单问题（本轮复核确认）；#12~#14 为新增场景级用例暴露的同一路由缺陷（同 D10-3）；#15~#18 为当日新增用例暴露的新缺陷。详见 `FINDINGS.md`，历史关联见 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏漏小写 ak=/sk= | safety-policy.mjs:45 |
| 2 | P0 | D4-3 | 明文 secret API 拦截漏 kms DecryptData | safety-policy.mjs:432 |
| 3 | P0 | D4-15 | hook 命令替换绕过（$(...)） | risk-rule-engine.mjs:50-53 |
| 4 | P0 | D4-16 | shell 包裹穿透（bash -c 仍 allow） | safety-policy.mjs:428 |
| 5 | P1 | D4-17 | hook 畸形输入 fail-open | risk-rule-engine.mjs:106 |
| 6 | P0 | D4-23 | 全局规则 huawei-agent-rules 未注入 | package.json:8 |
| 7 | P1 | D10-3 | serviceCatalog 中文意图路由 miss | tools.mjs:1776-1907 |
| 8 | P1 | D4-13 | 最小权限动态切换失效 | credentials.mjs:152-160 |
| 9 | P2 | D8-1 | 文档 39 vs 实现 40 漂移 | hdk/AGENTS.md:27,45 |
| 10 | P1 | D9-9 | tools/call 超时/取消契约漂移(SPEC) | mcp-protocol.mjs:63-65 / mcp-server.mjs:169 |
| 11 | P1 | D4-27 | 双路径脱敏缺裸 token | safety-policy.mjs:42 |
| 12 | P1 | D3-S1 | 场景-只读查ECS 路由 miss（同 D10-3） | tools.mjs:1776-1907 |
| 13 | P1 | D3-S2 | 场景-删VPC先确认 路由 miss（同 D10-3） | tools.mjs:1776-1907 |
| 14 | P2 | D3-S5 | 场景-复合意图路由 miss（同 D10-3） | tools.mjs:1776-1907 |
| 15 | P2 | D1-65 | 调试模式 env 判定不一致（telemetry 仅认 true） | telemetry/telemetry.mjs:81 |
| 16 | P2 | D8-9 | sanitizeValue 不脱敏敏感值 | telemetry/telemetry.mjs:189-198 |
| 17 | P2 | D4-25 | Python hook 写命令分类失效 | hooks/huaweicloud-safety.py:46 |
| 18 | P2 | D4-26 | findings.evidence 脱敏缺裸 token | risk-rule-engine.mjs:19-27 |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；本机 Linux，由 NR3 终端矩阵 + D1-40 代表覆盖 | — |
| D3-C14 | 设计级 | P2 | BLOCKED | 补环境 | 沙箱 HDKit 服务需 DevStation 沙箱配额，本机无沙箱 quota，无法真实 connect/hdkitCredentials | — |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱预览需 DevStation 沙箱配额，本机无沙箱 quota，无法部署前端项目出预览 URL | — |
| D3-S6 | 设计级 | P2 | BLOCKED | 补环境 | FunctionGraph 定时函数需 FG 配额 + 函数代码 zip 打包 + 委托 agency 配置，超出每日测试最低配置范围 | 若需每日覆盖，建议改为「plan_cli_command 预先生成 CreateFunction 命令块 + serviceCatalog 路由」轻量断言 |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | 跨服务编排需真云 RDS 计费实例 + 沙箱配额，RDS 计费实例建删成本高且需配额，本机未配置 | 建议拆分为「编排顺序断言（serviceCatalog 多路命中）+ 连接串注入（纯函数）」+「真云 RDS 建删」两段，后者标真云专项 |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期安全需 SBOM 产出工具链（cyclonedx/syft），本机未安装 | — |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌 TTL 边界需可注入时钟夹具加速 approval token TTL(300s)，本机无时钟夹具 | — |
| D9-6 | 设计级 | P1 | BLOCKED | 补环境 | 跨客户端互通需 MCP Inspector + ≥3 真实客户端并发接入，本机仅 DSH 单客户端 | — |

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
| VPC（tctest-dsh-*） | 6（D3-C4/D4-14/D4-18/D3-S2 多轮） | 全部删除 | ListVpcs 过滤 tctest-dsh- 计数 0 |
| 安全组（tctest-dsh-*） | 1（D4-19 含入站 0.0.0.0/0:22 规则） | 已删（规则先删再删 SG） | ListSecurityGroups 计数 0 |
| OBS 桶（tctest-dsh-web-*） | 3（D3-C13 探针 + 2 次手动建删） | 全部删除 | obs ls 计数 0 |
| ECS/RDS 等计费实例 | 0 | 0 | 未创建任何计费实例 |

> 真云只删本次创建资源（仅操作 `tctest-dsh-*` 前缀），删除前盘点 + 白名单，禁删既有/他人资源；本轮实测残留 VPC 0 / SG 0 / OBS 0。

---

## 八、遗留与建议

- **v1.1.5 缺陷确认**：本轮 npm latest 仍为 1.1.5（gitHead `e7ed6f66e`）。#1~#11 项缺陷与 2026-09-18/09-19 复测一致，均为历史已提单问题；`file_issue.py` 查重后生成 `HISTORY_LINKS.md`，不重复开单。
- **新增 4 项缺陷（#15~#18）**：本轮 daily 母版新增 17 个源码能力覆盖用例（D1-65~70 / D2-27 / D3-C13/C14 / D3-S1~S8 / D4-25/26/28/29 / D6-9 / D8-9/10 / D9-10/11），其中 4 个用例暴露产品缺陷：D1-65（telemetry DEBUG 判定不一致）、D8-9（sanitizeValue 不脱敏）、D4-25（Python hook 写分类失效）、D4-26（findings.evidence 裸 token 缺口）。均为 P2，根因见 FINDINGS。#12~#14 为场景级用例对 D10-3 路由缺陷的复现（同源，不重复开单）。
- **D10-4 从 BLOCKED 转为 PASS**：昨日误标 BLOCKED（「需真实 Agent 会话 LLM harness」），实际 D10-4「安全干预-静态规则层」为 source-level 可测（`loadRiskRules`/`evaluateCommandRisk`），本轮直调回填：规则库 16 条 = 9 deny + 7 warn，高危命令 deny、只读 allow 均符合预期。
- **新增真云用例 PASS**：D3-C13（OBS 静态网站托管 get/set/delete AWS4 签名 REST 全链路）与 D3-S4（voucher_status 本账号已领取 claimed=true）真机执行 PASS；D3-S1/D3-S2 除路由 miss 外，只读执行/确认删 VPC 归零链路本身正常。
- **建议优先修复**：P0 安全类（D2-4/D4-3/D4-15/D4-16/D4-23）仍为最高优先级；裸 `token=` 脱敏缺口在第三处路径（D4-26 redactEvidence）复现，建议把 `token` 关键字统一收口到 safety-policy 与 risk-rule-engine 共用的关键字表。