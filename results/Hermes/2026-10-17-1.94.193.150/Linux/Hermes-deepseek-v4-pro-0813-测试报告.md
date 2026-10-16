# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-17 05:26:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-17-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64 ECS） |
| Node / npm / Python | `node v22.13.0` / `npm` / `Python 3.12.3` |
| 被测版本（SUT） | `v1.1.9-next.0`（npm @next，gitHead `6302921c`，PR #914） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：43 批探针（`run_all.sh` 编排）——源码级 `.mjs` 探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classify/hook/auth/protocol/extended/supplement/d8/d1/safety/scenario 等）+ spawn `mcp-server.mjs` 驱动 MCP 协议（D9/D10/routing/eval-harness）+ 真云 E2E（`realcloud_e2e.mjs`：D3-C1/C2/C3/C6/C7）+ 只读子账号（D4-13）+ 真云建删资源归零。证据统一落 `evidence/<case-id>/stdout.txt`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 12 / 5 / 3 / 4` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 141） | `89.4%` |
| P0 / P1 / P2 新增缺陷 | `4 / 6 / 4`（14 项产品缺陷，11 FAIL + 3 SPEC-MISMATCH） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本轮真云四用例 VPC/ECS/subnet/OBS/EIP/沙箱会话均建删归零；残留仅历史泄漏非本轮创建）` |

> **本轮关键变化**：VPC router 配额已恢复（昨日泄漏 VPC 被清理，现存 2 个 VPC），昨日 4 个 BLOCKED 真云用例（D3-C1/D3-S2/D4-14/D4-13）本轮全部真机跑通转 PASS；D3-C1 上游清理修复（`ddcbaa865`/`8ed45f93f`）本轮真机复测验证通过。源码 `6302921c` 与昨日同版，14 项产品缺陷逐条复现一致。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `84` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单（EXP-E01） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

> 14 项产品缺陷（11 FAIL + 3 SPEC-MISMATCH），与昨日逐条一致（源码 `6302921c` 未变）。完整「期望/实际/根因（文件:行号）/证据」见同目录 `FINDINGS.md`。

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） |
|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `safety-policy.mjs:515` |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL broad IAM 制品 | `cloud-risk-rules.json:196` |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线两处缺口 | `mcp-protocol.mjs:32-41,55-57` |
| 4 | P0 | `D10-4` | D10评测 | 安全规则库 16→19 条断言漂移（SPEC） | `cloud-risk-rules.json` |
| 5 | P1 | `D4-6` | D4安全 | hook_check_command 对 `--admin-pass` 不告警 | `cloud-risk-rules.json:68` |
| 6 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open | `risk-rule-engine.mjs:106` |
| 7 | P1 | `D4-25` | D4安全 | Python hook 写操作遥测误分类 cli:invoke | `huaweicloud-safety.py:46` |
| 8 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs:47-49` |
| 9 | P1 | `D10-3` | D10评测 | 中文意图「云主机」未命中（92.9%，含 EXP-E01） | `tools.mjs:1985-2000` |
| 10 | P1 | `D3-S7` | D3功能 | 跨服务交付复合意图部署目标未命中 | `tools.mjs:1985` |
| 11 | P2 | `D4-26` | D4安全 | findings.evidence 脱敏未覆盖 JSON 带引号 key | `risk-rule-engine.mjs:19` |
| 12 | P2 | `D3-S5` | D3功能 | 复合意图分层路由未分解 | `tools.mjs:1985` |
| 13 | P2 | `D3-S6` | D3功能 | FunctionGraph CreateFunction 参数校验未通过 | FunctionGraph 最小参数集 |
| 14 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏 AK/SK/token（SPEC） | `telemetry.mjs:189` |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 专属用例（OS 列标注「专属」），Linux 侧由 EXP-NR3-10(disttags 探针 queryDistTags 返回对象、无 EINVAL)代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 【改用例】需白盒 docs 全量比对，本轮未覆盖；建议提供可机器判定的文档↔能力映射清单 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 【改用例】需逐条核验 getting-started 步骤，本轮未覆盖；建议落到可脚本化步骤断言 |
| `D8-6` | D8质量 | 中英文文档一致 | 【改用例】需中英双源逐段比对，本轮未覆盖；建议提供中英对照抽取脚本 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D2-10` | D2认证 | R7 current档跟随 | 【补环境】R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | D2认证 | R9 configuredBySession优先env | 【补环境】R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D4-12` | D4安全 | 供应链安装期安全 | 【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界 | 【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（CLI/真云操作均走脱敏，证据目录无明文 AK/SK）
- [x] 写操作误判 read-only：`0`（D4-13 最小权限 writeDenied=true 干净，只读 6/6 可用）
- [x] 红线（I 类）违规：`无`（真云只建本次资源、测后归零；本轮 VPC/ECS/subnet/OBS/EIP/沙箱均建删归零）
- [x] 脱敏复核：`已复核`（evidence 目录 stdout.txt 无原始凭证/未脱敏明文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS + 系统盘（D3-C1） | 是 | 已删（含 volume） | ECS 轮询已归零 |
| VPC/subnet（D3-C1 / D3-S2 / D4-14） | 是 | 已删 | ListVpcs 不含本次资源 |
| OBS 桶（D3-C2 / D3-C13） | 是 | 已删 | `rm -f` removed / Delete bucket successfully |
| 沙箱会话（D3-C3 / D3-C6 / D3-S3） | 是 | close_session ok | 无残留 |
| EIP（D3-C7） | 否（跨区域引导，未新建） | — | ListEips 无本次 id |

> 真云只删本次创建资源；删除前全量盘点 + 白名单。本轮盘点 cn-north-4 现存 2 个 VPC（`tctest-diag2`、`testbot1-hermes-e2e-2099592118`）与 2 台 ECS（`testbot1-hermes-ecs-2099592118`、`hc-activity-2048-ecs`）均为前序/他人资源，本轮未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未声明）、`D8-9`（sanitizeValue 未脱敏 AK/SK/token）、`D10-4`（规则库 16→19 条计数漂移）
- 本轮已恢复：真云四用例 D3-C1/D3-S2/D4-14/D4-13 由昨日 BLOCKED 转 PASS；D3-C1 上游清理修复真机验证通过
- 历史泄漏未清理（非本轮创建，红线禁止误删）：VPC `testbot1-hermes-e2e-2099592118`、ECS `testbot1-hermes-ecs-2099592118`（ACTIVE）
- 建议：① 上游优先修复 P0（D4-2 / D4-21 / D9-12 / D10-4）；② 建立 VPC/ECS 泄漏周期清理任务，避免配额耗尽反复阻塞真云用例；③ 修订 D10-4 用例规则计数断言（16→19）