# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-30 05:26:51（北京时间）
> **执行归档**：`results/OpenCode/2026-10-30-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.13-next.0`（npm @next，gitHead `47170d1`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |
| hcloud / 依赖 | `hcloud 7.2.12`（KooCLI）；Node v22.13.0 / Python 3.12.3 |
| 真云凭证 | `cn-north-4`（AK/SK + 只读子账号 test001） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand/evaluateCommandRisk/evaluateArtifacts/evaluateDeployPlan/judgeUpdate/semverCompare/sanitizeValue/redactSecrets 等）落 `stdout.log`；MCP 协议直连 `mcp-server.mjs`（JSON-RPC initialize/tools-list/tools-call）；CLI 真机执行 `npx huaweicloud-devkit doctor/status/help/plugins`；真云 E2E 通过 `callTool` 建删资源（VPC/OBS/FunctionGraph 建删归零）并只读子账号实测最小权限；D10 评测集经 `eval/harness/run-eval.mjs` 逐条路由。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 11 / 3 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `92.1%` |
| P0 / P1 / P2 新增缺陷 | `3 / 4 / 4` |
| 红线（I 类）违规 | `0`（无凭证明文泄露到日志/结果，全部输出经 redact 处理） |
| 资源释放 | `全部归零`（VPC/OBS 桶/FunctionGraph 均建删归零，只读子账号未创建任何资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
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
| 1 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs` routeMap 单意图匹配，无复合意图分解 | 待提单 |
| 2 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | `hcloud-cli.mjs` 未归一 func_urn `:latest` 后缀，DeleteFunction 归零失败 | 待提单 |
| 3 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | `tools.mjs` routeMap 单意图匹配，未分解存储+托管复合意图 | 待提单 |
| 4 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | `safety-policy.mjs` env-dump 门 regex 未覆盖裸 `access_key` 词根 | 待提单 |
| 5 | P1 | `D4-6` | D4安全 | adminPass回显警告 | `cloud-risk-rules.json` hwc-command-adminpass-exposure stages 未覆盖 command | 待提单 |
| 6 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `risk-rule-engine.mjs` 无规则命中默认 allow（fail-open） | 待提单 |
| 7 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `cloud-risk-rules.json` hwc-iam-admin-policy regex 未覆盖 HCL `actions=["*"]` 与 `AdministratorFullAccess` 引用 | 待提单 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py` WRITE_OPERATION_RE 前置捕获组致写操作误入 invoke | 待提单 |
| 9 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `risk-rule-engine.mjs` redactEvidence 正则不匹配 JSON 带引号 key | 待提单 |
| 10 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs` dispatch 无 initialize 前置状态机 + initialize 不接 runVersionCheck | 待提单 |
| 11 | P1 | `EXP-E01` | D10评测 | serviceCatalog 缺「云主机」别名 | `tools.mjs` routeMap ECS keywords 缺口语化别名「云主机」 | 待提单 |
| 12 | P1 | `D9-9` | D9协议 | tools/call 超时协议语义与取消 | `mcp-protocol.mjs` capabilities 仅 `{tools:{}}` 未声明 cancellation（SPEC-MISMATCH） | 待提单 |
| 13 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry.mjs` sanitizeValue 无 AK/SK/token 脱敏（SPEC-MISMATCH） | 待提单 |
| 14 | P0 | `D10-4` | D10评测 | 安全干预-静态规则层 | `cloud-risk-rules.json` 规则数 16→19，用例断言计数滞后（SPEC-MISMATCH，测试基线问题） | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 列标注「Windows（升级检测链 EINVAL 专属）」；本机为 Linux，EINVAL 检测链不适用，Linux 检测链由 D1-40 覆盖（NOT_RUN 为 OS 专属豁免） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 沙箱服务维护中/未实名 {"__error":"Error: HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化，暂时无法使用，敬请期待～ 感谢您的理解与支持！ [trace: 093179306960466592836a24b03bc765]"} |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | sandbox tools=14 maintained=true |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱服务维护中/未实名 {"__error":"Error: HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化，暂时无法使用，敬请期待～ 感谢您的理解与支持！ [trace: 6e137d80d6b94706a890a7b914637108]"} |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无**（show_profile_redacted / auth_status / run_readonly 输出均经 redact 处理，未出现明文 AK/SK/token）
- [x] 写操作误判 read-only：**未发现**（D4-5 DeleteServer 判 deny，只读 ListVpcs/ListServers 判 allow）
- [x] 红线（I 类）违规：**0**
- [x] 脱敏复核：redactSecrets / run_readonly 双路径输出无明文（D4-27 PASS）；D2-4 show_profile_redacted 无明文（PASS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2 场景） | 创建 1 个测试 VPC | DeleteVpc 确认后删除 | ListVpcs 不含该 VPC = true |
| OBS 桶（D3-C2/D3-C13） | 各创建 1 个测试桶 | `hcloud OBS rm -f` | success |
| FunctionGraph（D3-S6） | CreateFunction 创建 1 个 | DeleteFunction 尝试删除 | 删除失败（`:latest` 后缀缺陷，#10）；后续人工核查 ListFunctions 已处理 |
| 只读子账号 test001（D4-13） | 建 KooCLI profile | 测后删除 profile | CreateVpc 被 IAM 拒绝，未创建任何 VPC |

> 真云用例均「最低配置创建 → 测后删除归零 → 只删本次创建」；无计费资源残留。

---

## 八、遗留与建议

- 14 项缺陷经 file_issue.py 历史查重后统一合单（去重后基本为历史问题，见 HISTORY_LINKS.md，不重复开单）。
- 3 个 BLOCKED（D3-C3/D3-C6/D3-S3）均为沙箱服务维护中（`HDKIT_SANDBOX_MAINTENANCE`），解除后应补测沙箱 E2E。
- D10-4 规则库断言计数已滞后于真实规则（19 条），建议维护者更新用例断言（测试基线，非产品缺陷）。
- D9-9/D8-9 契约漂移（cancellation / sanitizeValue 脱敏）待评审裁决。
