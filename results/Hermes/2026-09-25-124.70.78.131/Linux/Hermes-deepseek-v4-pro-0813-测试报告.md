# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-25 05:25:00`（北京时间）
> **执行归档**：`results/Hermes/2026-09-25-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（含 P0 缺陷 D4-2/D4-16/D4-21/D4-23/D9-12，均历史已知或新增应提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（testbot2 ECS，IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.7`（npm latest 正式版，gitHead `7456d05`，merge PR #813 release-1.1.7） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，tools/list 枚举 40） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 已配置 |
| 真云凭证 | cn-north-4（AKSK + test001 只读子账号） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 102 / 展开级 43（预筛后归本客户端+OS） |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn mcp-server 驱动协议 + 真云 E2E（建删资源归零）；证据统一落 `evidence/<case-id>/stdout.txt`（.gitignore 排除 *.log，故用 stdout.txt 确保可 push）。机器可读结论边执行边落盘。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 102 + 展开级 43 = 145 |
| 已执行 | 145（102 设计 + 43 展开；真云/协议/安装域/直调全覆盖） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | 77 / 12 / 6 / 3 / 4 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（展开级） | 32 / 11 / 0 / 0 / 0 |
| 通过率（设计级，分母=PASS+FAIL+SPEC-MISMATCH） | 83.7%（77/92） |
| P0 / P1 / P2 缺陷 | 5 / 4 / 6（含 3 项 SPEC-MISMATCH 契约漂移，详见缺陷清单） |
| 红线（I 类）违规 | 0（凭证脱敏、真云归零、只删本次创建，均合规） |
| 资源释放 | 全部归零（真云 VPC/OBS/FunctionGraph/RDS 建删归零，无残留） |

> **较上轮（v1.1.7-next.1）变化**：D4-27（redactSecrets/redactOutput 双路径脱敏——裸 token / admin-pass 变体）在 v1.1.7 已修复 → PASS。新增 P0 用例 D9-12/D9-13 首测：D9-13（tools/call 凭证不泄露与权限校验）9/9 全通过；D9-12（initialize 握手协议安全基线）6 项断言 4 通过 / 2 缺口（见缺陷 #5）。其余缺陷均原样复现。

---

## 三、状态汇总

### 3.1 设计级（102）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 77 | 有证据且通过 PASS 门禁（含真云 D2-1/D3-C4/D4-14/D4-18/19/20、只读子账号 D4-13、新增 D9-13） |
| FAIL | 12 | 不符预期：D4-2/D4-16/D4-17/D4-21/D4-23/D4-25/D4-26/D3-S5/D3-S6/D3-S7/D9-12/D10-3 |
| BLOCKED | 6 | 真·外部依赖：D2-10/D2-13/D3-S3/D4-12/D4-24/D9-6（详见第五节） |
| SPEC-MISMATCH | 3 | 契约漂移待裁决：D1-68（region 优先级）/D8-9（sanitizeValue 脱敏）/D9-9（capabilities.cancellation） |
| NOT_RUN | 4 | D1-39（Windows 专属，Linux 由 EXP-NR3-10 代表）/D8-1/D8-4/D8-6（docs 白盒比对） |
| **合计** | **102** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 32 | EXP-C4-01~22（22 服务矩阵真云）、EXP-E06/E09/E15、EXP-E08、EXP-D5-8-1/3、EXP-NR3-02/04/10/24 |
| FAIL | 11 | EXP-E01~05/07/10~14（serviceCatalog 中文路由 MISS，同 D10-3 根因） |
| **合计** | **43** | |

---

## 四、缺陷清单

> 全量 15 项缺陷（12 FAIL + 3 SPEC）详见 `FINDINGS.md`，下表为摘要。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截缺 `HW_` 前缀 | safety-policy.mjs:398-399 | 历史查重处置 |
| 2 | P0 | D4-16 | env-dump 被 shell 包裹穿透 | safety-policy.mjs:398 | 历史查重处置 |
| 3 | P0 | D4-21 | HCL broad IAM 制品未拦截 | cloud-risk-rules.json:179-196 | 历史查重处置 |
| 4 | P0 | D4-23 | huawei-agent-rules.mdc 未注入安装目标 | setup-cli.mjs install 复制清单 | 历史查重处置 |
| 5 | P0 | D9-12 | initialize 握手安全基线两缺口（版本检查不在此期 + 非法时序不拒） | mcp-protocol.mjs:32-59 | **新提单** |
| 6 | P1 | D4-17 | hook 模糊输入 fail-open | risk-rule-engine.mjs:103-106 | 历史查重处置 |
| 7 | P1 | D10-3 | serviceCatalog 中文路由 21.4%（+D3-S5/S6/S7） | tools.mjs:1815-1947 | 历史查重处置 |
| 8 | P1 | D4-25 | Python hook 写遥测误判 cli:invoke | huaweicloud-safety.py:46 | 历史查重处置 |
| 9 | P1 | D9-9 | capabilities.cancellation 未声明 | mcp-protocol.mjs:45-49 | 历史查重处置 |
| 10 | P2 | D4-26 | findings.evidence JSON 带引号 key 明文泄漏 | risk-rule-engine.mjs:19-23 | 历史查重处置 |
| 11 | P2 | D1-68 | region 优先级契约漂移（HW_REGION 优先） | credentials.mjs:171,222,352 | 历史查重处置 |
| 12 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK/token | telemetry.mjs:189-191 | 历史查重处置 |

> 根因逐项代码片段 + 复现证据见 `FINDINGS.md`。D4-27 上轮 P1 缺陷已在 v1.1.7 修复，不列入本清单（已在执行摘要记录）。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10（disttags 探针 NR3-10 54 断言）代表覆盖 | — |
| D8-1 | 设计级 | P2 | NOT_RUN | 改用例 | 文档与能力一致需白盒 docs 全量比对，本轮未覆盖 | 明确 docs 目录与比对基准，或拆为可机械断言子项 |
| D8-4 | 设计级 | P1 | NOT_RUN | 改用例 | 引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 | 拆为脚本化逐步核验 |
| D8-6 | 设计级 | P2 | NOT_RUN | 改用例 | 中英文文档一致需中英双源逐段比对，本轮未覆盖 | 提供中英双源清单 |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） | — |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） | — |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 connect/upload(md5)/deploy/close 全链路真实执行通过，但 deploy_nginx 返回 url 为空、deploy_check 的 devbridge_tunnel FAIL（DevStation 公网隧道/预览外发环境缺依赖） | — |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 | — |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界需审批流 + 可注入时钟 | — |
| D9-6 | 设计级 | P1 | BLOCKED | 调归属 | 跨客户端互通需多客户端并存环境（单机仅 Hermes） | 归属列改「多客户端并存」，或改抽样验证 |

> 展开级无 NOT_RUN/BLOCKED（预筛已剔除非本客户端/OS 用例）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（show_profile_redacted/auth_status 均脱敏，探针 `疑似密钥泄露? false`）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（AK/SK 均 `<redacted>`/`***REDACTED***`；credentials.json 不入库）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（realcloud-probe D4-14） | 是（tctest-hermes-20260921-*） | 已删 | ListVpcs 不含本次资源（containsOwn=false） |
| VPC（new-cloud D3-S2） | 是 | 已删 | 归零=true |
| OBS 桶（new-cloud D3-C13） | 是 | 已删 | 删除归零 |
| FunctionGraph 函数（D3-S6） | 否（CreateFunction 参数缺 code.zip_file，未建） | — | 未创建亦视为无残留 |
| RDS 实例（D3-S7） | 否（db.password 缺参 + vpc/subnet/sg 前置） | — | 未创建亦视为无残留 |
| 只读子账号 KooCLI profile（D4-13） | test001 profile | 已删 export | 归零核实未建任何 VPC（created=false） |

> 真云只删本次创建资源；删除前盘点 + 按名称前缀（tctest-hermes-*）白名单，未碰既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级——用例文案与实现描述需维护者确认哪侧为准）、`D8-9`（sanitizeValue 脱敏契约）、`D9-9`（capabilities.cancellation）。
- 新增 P0 用例 D9-12 两处缺口（版本检查不在 initialize 阶段 + 非法时序不拒 -32600）→ 统一并入合并缺陷单。
- 本轮真云 E2E 已全量真机执行（D2-1/D3-C4 22 服务/D4-14/D4-18/19/20 + D4-13 只读子账号），建删资源归零。
- 建议：serviceCatalog 中文意图路由补齐（影响面最大，21.4%）；`` HW_`` 前缀与 shell 包裹 env-dump 拦截补齐；install 注入 rules/huawei-agent-rules.mdc 落地。