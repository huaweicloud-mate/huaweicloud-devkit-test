# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-26 05:25:00（北京时间）
> **执行归档**：`results/OpenCode/2026-10-26-1.92.93.23/Linux/`
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

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand / hook_check_* / serviceCatalog / redactSecrets 等），结论落 `evidence/<case-id>/stdout.log`；CLI 真机执行（install/status/doctor/update/isolated HOME）记录日志；MCP 协议探针直调 `mcp-server.mjs`；真云 E2E（建删资源 + 归零）真机执行 `callTool` 直调；D10 评测运转 `eval/harness/run-eval.mjs`。证据统一落 `evidence/<case-id>/`（probe + stdout.log + stdout.txt）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 12 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `89.7%` |
| P0 / P1 / P2 缺陷（FAIL） | `3 / 5 / 4` |
| P0 / P1 / P2 契约漂移（SPEC-MISMATCH） | `1 / 1 / 1` |
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
| 1 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | 见 FINDINGS #4 | 历史（已查重） |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | 见 FINDINGS #9 | 历史（已查重） |
| 3 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | 见 FINDINGS #10 | 历史（已查重） |
| 4 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 见 FINDINGS #5 | 历史（已查重） |
| 5 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | 见 FINDINGS #1 | 历史（已查重） |
| 6 | P1 | `D4-6` | D4安全 | adminPass回显警告 | 见 FINDINGS #6 | 历史（已查重） |
| 7 | P1 | `D4-17` | D4安全 | hook模糊fail-open | 见 FINDINGS #7 | 历史（已查重） |
| 8 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | 见 FINDINGS #2 | 历史（已查重） |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | 见 FINDINGS #11 | 历史（已查重） |
| 10 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | 见 FINDINGS #12 | 历史（已查重） |
| 11 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | 见 FINDINGS #3 | 历史（已查重） |
| 12 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文「云主机」未命中 ECS | 见 FINDINGS #8 | 历史（已查重） |

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
- [x] 脱敏复核：`evidence/realcloud-probe/stdout.txt`、`evidence/D4-13/stdout.txt`、各 stdout.log 中 AK/SK/adminPass 均已 redact（AKIA***/HPUA***）。

### 环境观测（非产品缺陷）

- **华为云路由器配额已恢复**：昨日（10-25）D4-14「操作可审计性」建删冒烟中 `CreateVpc` 被 `VPC.0114 OverQuota ['router']` 拒绝；今日重跑，`CreateVpc` → `DeleteVpc` → `归零验证` 全链路 OK（`tctest-opencode-20261006-*` 建后删除），说明维护侧已清理残留路由器，共享账号配额恢复。D3-C1 ECS 生命周期与本 run 内 VPC/子网/ECS 建删均成功归零。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 1（最小规格） | 已删除含磁盘 | ListServersDetails 不含本次资源 ✓ |
| VPC+子网（D3-C1） | 1+1 | 已删除 | ListVpcs 不含 `tctest-opencode-*` ✓ |
| EIP（D3-C7） | 1 | 已删除 | ListPublicips 不含本次 ✓ |
| OBS 桶（D3-C2） | 1 | 已删桶归零 | obs ls 无 `tctest-opencode-*` ✓ |
| VPC（D4-14） | 1 | 已删除 | ListVpcs 不含 `tctest-opencode-20261006-*` ✓ |
| 沙箱会话（D3-C3/D3-C6） | N | close_session | 会话已关闭 ✓ |
| 只读子账号 profile（D4-13） | 1 | 已删除 test001 profile | residualZero=true ✓ |

> 真云用例均采用「最低配置创建 → 测后删除 → 归零验证」，只删本次创建资源；无本次资源残留。

---

## 八、遗留与建议

- **3 项 SPEC-MISMATCH 待裁决**：D10-4（规则库计数 16→19，产品演进超用例断言）、D9-9（capabilities 未声明 cancellation）、D8-9（sanitizeValue 未脱敏 AK/SK/token）——属「实现与设计契约漂移」，建议维护 agent 更新用例断言或产品补齐契约，本次按 SPEC-MISMATCH 记录、不合并入 FAIL 提单。
- **12 项 FAIL 全为历史复现**（1.1.12 与昨日同一 commit 4ed07801），提交时走历史查重，命中既有 open issue 不重复开单（见 HISTORY_LINKS.md）。
- **D3-S6 根因更新**：今日 `CreateFunction` 报 `[USE_ERROR]Invalid parameter: function_name`（昨日为 `code.filename`）。定位为探针传 `--function_name`，而 KooCLI 实参为 `--func_name`（`hcloud-cli.mjs:745` REQUIRED_PARAMS 已列 `func_name`，但 plan 预检未拦截缺 `func_name` 的参数形态），函数创建失败、URN 未返回、触发器未绑定。建议产品侧在 `plan_cli_command` 预检阶段对 REQUIRED_PARAMS 做参数名归一校验，避免运行时才报错。
- **D4-13 只读子账号**：读 6 类资源全部可用（CES ListMetrics 被探针正则误判 denied 属误报，实测 exit0 返回 266KB metrics 无 error），写操作 IAM 拒绝（VPC.0010 PolicyNotAuthorized）、归零为真 → 最小权限结论 PASS。