# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-17 06:55:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-17-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit v1.1.5（GitHub `huaweicloud/huaweicloud-devkit`，gitHead `e7ed6f66`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，无 P0 NOT_RUN 缺口）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + glm-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.5（npm latest，gitHead `e7ed6f66`） |
| 工具全集 | 40（`tools/list` 实测） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 11/11 PASS |
| 真云凭证 | cn-north-4（AKSK 已配置 + 只读子账号已配置） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status/update）/ MCP 协议 / eval harness |
| daily 基础用例 | 设计级 78 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP server JSON-RPC 协议调用 + CLI 真机执行 + eval harness 路由评测，证据统一落 `evidence/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 117（设计级 78 + 展开级 39） |
| 已执行 | 117 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 91 / 22 / 3 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 114） | 79.8% |
| P0 / P1 / P2 新增缺陷 | 6 / 4 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 63 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | 不符预期，根因见缺陷清单 |
| BLOCKED | 3 | 环境阻塞（D1-1/D1-5 无法重装/卸载，D4-11 需 LLM harness） |
| SPEC-MISMATCH | 1 | D2-16 import 文件擦除时序与描述不一致 |
| NOT_RUN | 0 | — |
| **合计** | **78** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E05/E07/E10~E14 serviceCatalog 路由 MISS |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证env打印拦截不完整 | `echo %HW_SECRET_KEY%` → deny | allow | `cloud-risk-rules.json:39` HW_ 前缀未覆盖 | 待提单 |
| 2 | P0 | D4-3 | 明文secret API参数未拦截 | `--backup-password` → deny/warn | allow | `cloud-risk-rules.json:47-66` 仅检测 DEW 操作 | 待提单 |
| 3 | P0 | D4-21 | hook_check_artifacts 未检测 IaC 明文密码 | admin_pass → findings>0 | findings=0 | `cloud-risk-rules.json` artifact 规则缺密码检测 | 待提单 |
| 4 | P0 | D4-22 | hook_check_deploy_plan 未检测公网暴露 | 0.0.0.0/0 all → findings>0 | findings=0 | `cloud-risk-rules.json:110-129` 需特定端口号 | 待提单 |
| 5 | P0 | D4-9/D4-7 | evaluateDeployPlan/Artifacts 覆盖不足 | 破坏性/密码 → findings>0 | findings=0 | 同 #3/#4 | 待提单 |
| 6 | P0 | D4-23 | 全局规则未安装到 safety 目录 | safety/ 含 huawei-agent-rules | 不含 | `setup-cli.mjs` update 未复制 | 待提单 |
| 7 | P1 | D4-24 | 无效确认令牌返回空响应 | 返回错误信息 | 空响应 | `hcloud-cli.mjs consumeApprovalToken` | 待提单 |
| 8 | P1 | D8-4 | README 缺少可机械执行安装命令 | 含 npm install -g | 未找到 | `README.md` 安装说明格式 | 待提单 |
| 9 | P1 | EXP-E01~E14 | serviceCatalog 路由准确率低 21.4% | HIT 期望服务 | 11/14 MISS | `tools.mjs serviceCatalog` 中文匹配不足 | 待提单 |
| 10 | P2 | D4-12 | package.json 路径与 npm pack | pack --dry-run 有输出 | 输出为空 | package.json 在仓库根目录 | 待提单 |

> 完整根因详情见 `FINDINGS.md`。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-1 | 设计级 | P1 | BLOCKED | 补环境 | 无法在测试执行中重装插件（会破坏当前运行环境）；doctor 11/11 PASS 间接验证安装完整性 | — |
| D1-5 | 设计级 | P1 | BLOCKED | 补环境 | 无法在测试执行中卸载插件（会破坏当前运行环境）；uninstall 干净度需独立环境验证 | — |
| D4-11 | 设计级 | P1 | BLOCKED | 补环境 | 提示注入防护需真实 LLM Agent 会话行为评测（注入 payload 在工具返回内容中，需观察 Agent 是否执行注入指令），run-eval.mjs serviceCatalog 路由层无法代理此层 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（plan_cli_command 正确识别 12 类写动词）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（show_profile_redacted 返回 `<redacted>`）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/RDS/OBS 等 | 否 | — | 无创建即无需释放 |
| Runtime 凭证 | 是（auth_init 测试） | 已清除（auth_init clear=true） | auth_status 确认 runtimeActive=false |
| creds-import.json | 是（D2-16 测试） | 已手动清除 | 文件不存在 |

---

## 八、遗留与建议

- 待裁决 SPEC：D2-16 import 文件擦除时序（描述说 "wipes it"，实现保留有效文件供重放）
- 本轮未覆盖：D1-1 全新安装 / D1-5 卸载干净度（需独立环境）；D4-11 提示注入（需 LLM harness）
- 建议：`cloud-risk-rules.json` 增加 `HW_` 前缀到 env-dump 规则；增加 artifact/deploy_plan stage 的明文密码检测规则；修复 `0.0.0.0/0 + ports:"all"` 匹配；安装 `huawei-agent-rules.mdc` 到 safety 目录
