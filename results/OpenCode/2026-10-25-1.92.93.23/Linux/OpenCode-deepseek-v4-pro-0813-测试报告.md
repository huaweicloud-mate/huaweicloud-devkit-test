# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-25 05:19:37（北京时间）
> **执行归档**：`results/OpenCode/2026-10-25-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（6.8.0-106-generic） |
| Node / npm / Python | `v22.13.0 / 10.9.2 / 3.12.3` |
| 被测版本（SUT） | `1.1.12`（gitHead 4ed07801，正式版 latest） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand / hook_check_* / serviceCatalog / redactSecrets 等），结论落 `evidence/<case-id>/stdout.log`；CLI 真机执行（install/status/doctor/update/isolated HOME）记录日志；MCP 协议探针直调 `mcp-server.mjs`；真云 E2E（建删资源 + 归零）真机执行 `callTool` 直调；D10 评测运转 `eval/harness/run-eval.mjs`。证据统一落 `evidence/<case-id>/`（probe + stdout.log）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 12 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 142） | `91.5%` |
| P0 / P1 / P2 新增缺陷 | `3 / 5 / 4` |
| 红线（I 类）违规 | `0`（凭证脱敏拦截未新增泄露事件） |
| 资源释放 | `全部归零`（见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | TODO: 待补根因 | 待提单 |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 3 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补根因 | 待提单 |
| 5 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | TODO: 待补根因 | 待提单 |
| 6 | P1 | `D4-6` | D4安全 | adminPass回显警告 | TODO: 待补根因 | 待提单 |
| 7 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 8 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 10 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 11 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 12 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> 完整「现象/断言/根因/影响/证据」见同目录 `FINDINGS.md`（12 FAIL 缺陷 + 3 SPEC 契约漂移，共 15 项）。以下为 P0/P1 关键根因摘要：

| 用例ID | 根因（文件:行号） |
|---|---|
| D4-2 | `safety-policy.mjs:546` env-dump 正则未覆盖裸 `access_key`/`secret_key` |
| D4-21 | `safety/rules/cloud-risk-rules.json:196-218` hwc-iam-admin-policy 仅匹配 JSON `"Action":"*"`，未覆盖 HCL `actions=["*"]` 与 `AdministratorFullAccess` |
| D9-12 | `mcp-protocol.mjs:32-59` initialize 不接 runVersionCheck；dispatch 无 initialize 前置状态机 |
| D3-S3 | `sandbox/session-manager.mjs:814-820` evaluateDeployNginxVerify 要求 nginxTest==='PASS' 致 deploy_nginx 假阴性无 URL |
| D3-S7 | `tools.mjs:2023-2277` routeMap 复合意图未分解部署目标；`hcloud-cli.mjs` RDS CreateInstance REQUIRED_PARAMS 缺 `--db.password` |
| D4-6 | `safety/rules/cloud-risk-rules.json:74` hwc-command-adminpass-exposure 未覆盖 command 阶段；redactString 不匹配空格/JSON 引号形态 |
| D4-17 | `risk-rule-engine.mjs:103` 无规则命中默认 decision=allow（fail-open） |
| EXP-E01 | `tools.mjs:2033-2037` routeMap ECS keywords 缺口语化别名「云主机」 |
| D10-4(SPEC) | `safety/rules/cloud-risk-rules.json` 规则数 16→19 条，用例计数断言滞后 |
| D9-9(SPEC) | `mcp-protocol.mjs:47-49` capabilities 仅 `{tools:{}}` 未声明 cancellation |
| D8-9(SPEC) | `telemetry/telemetry.mjs:189-197` sanitizeValue 无 AK/SK/token 脱敏 |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 列标注「Windows 专属」，本客户端为 Linux，按状态口径 OS 专属 P0 用例在非对应 OS 豁免（`verify_coverage.py` _os_scoped_out 已豁免），Linux 侧由展开级 + D1-40 反向下发防护覆盖。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无新增泄露。脱敏探针（D2-4 redactSecrets、D4-6/D4-27 双路径脱敏）均已实测，裸 access_key env-dump 拦截缺口为已知历史缺陷（D4-2，见 FINDINGS #1）。
- [x] 写操作误判 read-only：无新增。写操作审批门（D4-4/D4-5）、confirm-not-deny（D4-18）、拒绝零操作（D4-20）、hook 三工具（D4-7）均实测通过。
- [x] 红线（I 类）违规：`0`。真云用例全部真机执行（非 mock），凭证未硬编码进探针日志（redact 处理）。
- [x] 脱敏复核：`evidence/realcloud-probe/stdout.txt`、各 stdout.log 中 AK/SK/adminPass 均已 redact（AKIA***/HPUA***）。

### 环境观测（非产品缺陷）

- **华为云路由器配额耗尽（VPC.0114 OverQuota: ['router']）**：D4-14「操作可审计性」建删冒烟中 `CreateVpc` 被配额拒绝，未能新建→删除 VPC。核查账号现存 4 个 ACTIVE 路由器均为其他 agent 历史残留（`testbot3-hermes-e2e-*`、`tctest-d424-probe-x`），本客户端按红线「只删本次创建资源」无权清理。D4-14 核心断言（命令可追溯：CTS ListTraces 返回审计轨迹、ListVpcs 命令可追溯）仍实测通过，故标 PASS；建删归零环节被配额阻塞已如实记录。D3-C1（ECS 生命周期）在同 run 内建删 VPC/ECS 成功并归零，说明配额为残留路由器占满所致，非本次创建泄漏。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 1（c6.large.2，最小规格） | 已删除含磁盘 | ListServersDetails 不含本次资源 ✓ |
| VPC+子网（D3-C1） | 1+1 | 已删除 | ListVpcs 不含 `tctest-opencode-*` ✓ |
| EIP（D3-C7） | 1 | 已删除 | ListPublicips total_count=0 ✓ |
| OBS 桶（D3-C2） | 1 | 已删桶归零 | obs ls 无 `tctest-opencode-*` ✓ |
| 沙箱会话（D3-C3/D3-C6） | N | close_session | 会话已关闭 ✓ |
| 只读子账号 profile（D4-13） | 1 | 已删除 test001 profile | residualZero=true ✓ |
| VPC（D4-14） | 未创建成功（配额拒绝） | — | ListVpcs 无残留 ✓ |

> 真云用例均采用「最低配置创建 → 测后删除 → 归零验证」，只删本次创建资源；无本次资源残留。

---

## 八、遗留与建议

- **3 项 SPEC-MISMATCH 待裁决**：D10-4（规则库计数 16→19，产品演进超用例断言）、D9-9（capabilities 未声明 cancellation）、D8-9（sanitizeValue 未脱敏 AK/SK/token）——属「实现与设计契约漂移」，建议维护 agent 更新用例断言或产品补齐契约，本次按 SPEC-MISMATCH 记录、不合并入 FAIL 提单。
- **12 项 FAIL 全为历史复现**（1.1.12 与昨日同一 commit 4ed07801），提交时走历史查重，命中既有 open issue 不重复开单（见 HISTORY_LINKS.md）。
- **环境缓解建议**：华为云共享账号 cn-north-4 路由器配额被其他 agent 残留占满，建议维护侧统一清理 `testbot3-hermes-e2e-*` / `tctest-d424-probe-x` 等残留路由器，避免影响后续真云建删用例（D4-14 建删归零冒烟）。
- **D3-S6/D3-S7 最小参数编排**：FunctionGraph 缺 code 参数、RDS 缺 db.password/db.port，建议产品侧补齐 REQUIRED_PARAMS 最小参数集，使跨服务/函数场景可全自动编排。
