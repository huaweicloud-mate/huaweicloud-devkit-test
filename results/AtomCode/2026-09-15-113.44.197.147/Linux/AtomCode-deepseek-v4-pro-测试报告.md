# AtomCode-deepseek-v4-pro 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-测试报告.md`
> **生成时间**：`2026-09-15 13:05:00`（北京时间）
> **执行归档**：`results/AtomCode/2026-09-15-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 4 个 P0 + 1 个 P1 缺陷，均已在 #650/#651/#652 跟踪、今日 latest v1.1.4 复测仍复现）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro |
| OS / 架构 | Linux x86_64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（npm latest，gitHead `9b67256e`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，较设计级预期 39 新增 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | hcloud 已配置（`~/bin/hcloud`） |
| 真云凭证 | 已配置（`~/.config/huaweicloud/credentials.json`，cn-north-4）；本轮未发起真云写/创建资源 |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 39（建包预筛剔除 32 条非本客户端/OS） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<domain>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `120`（设计级 81 + 展开级 39） |
| 已执行 | `120`（全量回填，无 NOT_RUN/空） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `83 / 5 / 31 / 1 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `93.3%`（83/89） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（5 项历史缺陷今日 latest 复测仍复现，见缺陷清单） |
| P0 / P1 / P2 复现缺陷 | `4 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `未创建真云资源，无残留` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `59` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | D4-2 / D4-16 / D4-21 / D4-23 / D9-2（根因见缺陷清单） |
| BLOCKED | `16` | 环境阻塞（安装/真云/LLM/CTS/SBOM/交互 install 等，见阻塞项） |
| SPEC-MISMATCH | `1` | D5-3 工具全集 39→40 契约漂移（测试侧，改用例） |
| NOT_RUN | `0` | |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `24` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | |
| BLOCKED | `15` | 需 LLM 评测/多轮自主执行环境 |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整（HW_ 前缀） | `printenv HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow`，`HW_` 前缀未拦截 | `safety-policy.mjs:336` | P | 已提单 #650/#651/#652 |
| 2 | P0 | `D4-16` | 命令包裹穿透（sh -c） | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny` | 返回 `allow` | `safety-policy.mjs:335` | P | 已提单 #650/#652 |
| 3 | P0 | `D4-21` | IaC broad IAM 缺口（HCL actions=["*"]） | `evaluateArtifacts(actions=["*"])` 应 `deny` | findings 空、未检出 | `cloud-risk-rules.json:192` | P | 已提单 #651/#652 |
| 4 | P0 | `D4-23` | 全局规则 kms Decrypt 直连未识别为 secret | `hcloud kms Decrypt` 应 `deny`/`secret` | `allow`，落入只读放行分支 | `policy.json:26` + `safety-policy.mjs:177,349` | P | 已跟踪 #650/#651 |
| 5 | P1 | `D9-2` | JSON-RPC 错误码未区分 -32601/-32603 | 未知 method 应返回 `-32601` | 统一返回 `-32603` | `mcp-server.mjs:169` | P | 已提单 #650/#652 |

> 以上 5 项均为昨日（next.6）已提单缺陷，今日 latest `v1.1.4`（gitHead `9b67256e`）复测**仍复现**，无新增缺陷；根因行号与昨日一致（源码相关段无改动）。

### 契约漂移（非产品缺陷）

| # | 级别 | 用例ID | 漂移点 | 说明 |
|---|---|---|---|---|
| 6 | P1（测试侧） | `D5-3` | 工具全集 39 → 40 | `tools.mjs` 新增 `huaweicloud_obs_set_website_config`，母版预期值 39 过时，须改用例 |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截不完整**：`plugins/huaweicloud-core/src/safety-policy.mjs:336`——env-dump 检测正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀。证据 `evidence/d4-security/stdout.log`。

**#2 [P0] D4-16 命令包裹穿透**：`plugins/huaweicloud-core/src/safety-policy.mjs:335`——`(^|\s)(env|...)` 单词边界匹配原始文本，`sh -c "env ..."` 内层 `env` 前是引号未命中，未递归解包 shell 包裹。证据 `evidence/d4-security/stdout.log`。

**#3 [P0] D4-21 IaC broad IAM 拦截缺口**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:192`（规则 `hwc-iam-admin-policy` L179）——IAM 正则只覆盖 JSON 形态 `"Action":"*"`/`Action=`，未覆盖 Terraform HCL 小写 `actions = ["*"]` 块语法。证据 `evidence/d4-security-core/stdout.log`。

**#4 [P0] D4-23 全局规则注入生效性缺口**：`plugins/huaweicloud-core/safety/policy.json:26` `blockedSecretOperations` 仅含 `["ShowSecretVersion","DownloadSecret","GetSecretValue"]`，未含 `Decrypt`；`safety-policy.mjs:177` 的 secret 正则未含 `decrypt`，故 `hcloud kms Decrypt` 未进入 `safety-policy.mjs:349` 的 secret 拦截分支（该分支仅 `ShowSecretVersion|GetSecretValue|secret_string|secret_binary`）。证据 `evidence/d4-rules/stdout.log`。

**#5 [P1] D9-2 JSON-RPC 错误码**：`plugins/huaweicloud-core/src/mcp-server.mjs:169`——runStdioServer 的 catch 对所有异常统一 `code: -32603`，未按规范区分方法不存在 `-32601`。证据 `evidence/d9-protocol/stdout-d9-mcp-protocol.log`。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 本轮无 NOT_RUN；BLOCKED 逐类列出如下。

| 用例ID | 层级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|
| `D1-1/2/5/6`, `D7-4` | 设计级 | BLOCKED | 补环境 | run-only 每日测试不执行破坏性全局安装/卸载/改源 | — |
| `D1-58`, `EXP-D1-58-*` | 设计级 | BLOCKED | 补环境 | 需交互式 install 菜单 option3 白名单探测（PTY） | — |
| `D3-B3`, `D4-13`, `D3-C4` | 设计级 | BLOCKED | 补环境 | 需真实华为云资源创建/销毁（红线：最低配置→测后删除） | — |
| `D4-14` | 设计级 | BLOCKED | 补环境 | 需真实 CTS 审计记录 | — |
| `D4-8` | 设计级 | BLOCKED | 补环境 | Python hook 路径本机未携带，无法做同源策略对比 | — |
| `D4-12` | 设计级 | BLOCKED | 补环境 | 供应链/SBOM 审计需独立 CI + npm audit 全量核对 | — |
| `D9-5` | 设计级 | BLOCKED | 补环境 | stdio 大 payload/断连恢复需真实 MCP 传输压测 | — |
| `D9-6` | 设计级 | BLOCKED | 补环境 | 需其他客户端/Inspector/多机环境 | — |
| `D10-3/5` | 设计级 | BLOCKED | 补环境 | 需 LLM 评测/多轮自主执行环境 | — |
| `EXP-E*`（15 行） | 展开级 | BLOCKED | 补环境 | 需 LLM 评测环境 | — |
| `EXP-D5-*`（其余客户端矩阵） | 展开级 | 建包剔除 | 调归属 | 其他客户端 D5 矩阵枚举，建包按 agent/OS 预筛剔除 | — |

> 「改用例」仅 1 项：`D5-3` 工具全集预期 39 → 40（见契约漂移）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针全程无明文 AK/SK 输出，脱敏验证 D2-4 PASS）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 华为云资源（ECS/OBS/沙箱等） | 否 | — | 本轮未创建，无残留 |

---

## 八、遗留与建议

- 待裁决 SPEC：`D5-3`（工具全集 39→40，测试侧改用例，非产品缺陷）
- 本轮未覆盖（说明范围）：真云 E2E / 多终端矩阵 / 审批流实时对话框 / LLM 多轮评测
- 历史缺陷复核：5 项 FAIL（#650/#651/#652）在 latest v1.1.4 仍复现，建议维护方按原单跟进修复
- 建议：一次性补齐 `HW_*` 前缀、shell 包裹解包、HCL `actions=["*"]`、`kms Decrypt` 四类安全拦截缺口，并修正 JSON-RPC 错误码映射