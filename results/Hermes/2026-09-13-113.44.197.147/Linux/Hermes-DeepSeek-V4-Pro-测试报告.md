# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-09-13（北京时间）
> **执行归档**：`results/Hermes/2026-09-13-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（4 P0 安全域缺陷在列，见缺陷清单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Linux aarch64（6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `3b6290b0`，PR #647） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认已装且凭证已配置） |
| 真云凭证 | cn-north-4（AKSK 已配置；本轮未创建/删除任何云资源） |
| 测试类型 | 源码级探针（safety-policy / risk-rule-engine / update-check / mcp-protocol / detect-framework）+ 真机 CLI（version/status/doctor） |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。本轮 5 组探针全部实跑（d4-security / d1-upgrade / d2-d9-auth-protocol / d8-skills / supplemental / d1-linux-matrix / d6-perf）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行 | 45（设计级 41 + 展开级 4） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 45 / 7 / 1 / 0 / 99 |
| 通过率（分母 = PASS+FAIL，不含 BLOCKED/NOT_RUN） | 86.5%（45/52） |
| P0 / P1 / P2 新增缺陷 | 4 / 2 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 无云资源创建，零残留 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 41 | 有证据且通过 PASS 门禁校验 |
| FAIL | 7 | 不符预期，根因见缺陷清单 |
| BLOCKED | 1 | D1-39 Windows 专属（Linux 无法复现） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 32 | 本轮未覆盖（真云 E2E / 多终端矩阵 / 审批流实时对话框 / D10 评测集等） |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 4 | EXP-D5-8-1/8-3（Hermes 行）+ EXP-NR3-02/10（Linux 行） |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 67 | 多终端矩阵（其他 9 客户端）+ 服务创建类 + D10 评测集 + Windows/macOS 行 |
| **合计** | **71** | |

---

## 四、逐用例结果（已执行项）

### 设计级 PASS（41）

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 |
|---|---|---|---|---|
| D1-1 | P1 | 全新环境引导安装 | PASS | `evidence/d1-cli/` |
| D1-3 | P1 | doctor健康自检 | PASS | `evidence/d1-cli/` |
| D1-4 | P2 | status/update幂等 | PASS | `evidence/d1-cli/` |
| D1-5 | P1 | uninstall干净度 | PASS | `evidence/d1-cli/` |
| D1-26 | P1 | 升级提醒工具注册与协议暴露 | PASS | `evidence/supplemental/` |
| D1-27 | P1 | 检测语义-已是最新 | PASS | `evidence/d1-upgrade/` |
| D1-28 | P1 | 检测语义-有新版本 | PASS | `evidence/d1-upgrade/` |
| D1-30 | P2 | semver 比对正确性 | PASS | `evidence/d1-upgrade/` |
| D1-31 | P1 | dismiss 冷却期 | PASS | `evidence/d1-upgrade/` |
| D1-33 | P2 | skip 文件持久化与多路径 | PASS | `evidence/supplemental/` |
| D1-40 | P0 | 镜像 lag 下检测正确性 | PASS | `evidence/d1-upgrade/` |
| D2-4 | P0 | 凭证脱敏正确性 | PASS | `evidence/d2-d9-auth-protocol/` |
| D2-10 | P1 | R7 current档跟随 | PASS | `evidence/supplemental/` |
| D2-11 | P0 | R3 STS token拒绝落盘 | PASS | `evidence/d2-d9-auth-protocol/` |
| D2-13 | P1 | R9 configuredBySession优先env | PASS | `evidence/supplemental/` |
| D2-16 | P1 | import文件读取后擦除 | PASS | `evidence/supplemental/` |
| D3-A1 | P1 | skill检索完整性 | PASS | `evidence/supplemental/` |
| D3-B1 | P2 | list_operations规范名 | PASS | `evidence/supplemental/` |
| D3-B5 | P2 | detect_framework识别 | PASS | `evidence/supplemental/` |
| D4-1 | P0 | 凭证文件读取拦截 | PASS | `evidence/d4-security/` |
| D4-3 | P0 | 明文secret API拦截 | PASS | `evidence/d4-security/` |
| D4-4 | P1 | 写操作审批门 | PASS | `evidence/d4-security/` |
| D4-5 | P0 | 写操作误判检测 | PASS | `evidence/d4-security/` |
| D4-7 | P1 | hook三工具有效性 | PASS | `evidence/d4-security/` |
| D4-8 | P1 | Python/Node策略一致 | PASS | `evidence/d4-security/` |
| D4-9 | P0 | 公开暴露/破坏性预检 | PASS | `evidence/d4-security/` |
| D4-11 | P1 | 提示注入防护 | PASS | `evidence/d4-security/` |
| D4-12 | P2 | 供应链安装期安全 | PASS | `evidence/d4-security/` |
| D4-13 | P1 | 最小权限凭证通过率 | PASS | `evidence/d4-security/` |
| D4-14 | P2 | 操作可审计性 | PASS | `evidence/d4-security/` |
| D4-17 | P1 | hook模糊fail-closed | PASS | `evidence/d4-security/` |
| D4-20 | P1 | 拒绝后零操作 | PASS | `evidence/d4-security/` |
| D4-22 | P0 | hook_check_deploy_plan 具名回归 | PASS | `evidence/d4-security/` |
| D5-1 | P1 | 清单发现加载 | PASS | `evidence/d1-linux-matrix/` |
| D5-3 | P1 | 工具全量枚举 | PASS | `evidence/supplemental/` |
| D6-3 | P2 | MCP冷启时间 | PASS | `evidence/d6-perf/`（649ms < 5s） |
| D8-7 | P0 | 7 个 meta/通用技能机械执行 | PASS | `evidence/d8-skills/` |
| D9-1 | P1 | tools/list合规 | PASS | `evidence/d2-d9-auth-protocol/` |
| D9-3 | P1 | tools/call响应格式 | PASS | `evidence/d2-d9-auth-protocol/` |
| D9-4 | P1 | 协议生命周期 | PASS | `evidence/d2-d9-auth-protocol/` |
| D9-8 | P2 | inputSchema版本合规 | PASS | `evidence/d2-d9-auth-protocol/` |

### 设计级 FAIL（7，根因详见缺陷清单）

| 用例 ID | 优先级 | 标题 | 结果 | 缺陷 # |
|---|---|---|---|---|
| D4-2 | P0 | 凭证env打印拦截 | FAIL | #1 |
| D4-15 | P0 | hook绕过尝试 | FAIL | #2 |
| D4-16 | P0 | 命令包裹穿透 | FAIL | #3 |
| D4-21 | P0 | hook_check_artifacts 具名回归 | FAIL | #4 |
| D4-6 | P1 | adminPass回显警告 | FAIL | #5 |
| D4-10 | P2 | 规则库新增回归 | FAIL | #6 |
| D9-2 | P1 | JSON-RPC错误码 | FAIL | #7 |

### 设计级 BLOCKED（1）

| 用例 ID | 原因 |
|---|---|
| D1-39 | Windows 专属 EINVAL 场景，本机 Linux aarch64 无法复现 |

### 展开级 PASS（4）

| 用例 ID | 优先级 | 说明 | 结果 | 证据路径 |
|---|---|---|---|---|
| EXP-D5-8-1 | P1 | Hermes D5-1 清单发现 | PASS | `evidence/d1-linux-matrix/` |
| EXP-D5-8-3 | P1 | Hermes D5-3 39 工具全量 | PASS | `evidence/d1-linux-matrix/` |
| EXP-NR3-02 | P1 | Linux D1-27 检测语义 | PASS | `evidence/d1-upgrade/` |
| EXP-NR3-10 | P0 | Linux D1-39 升级检测链 | PASS | `evidence/d1-linux-matrix/` |

> 逐用例结果与副本 CSV「执行状态」+「evidencePath」列完全一致（同一 backfill.py 回填）。

---

## 五、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `env \| grep HW_ACCESS_KEY` 应 `deny` | 返回 `allow` | `safety-policy.mjs:335-336` | P | 待提单 |
| 2 | P0 | D4-15 | $() 命令替换混淆路径绕过 | `cat ~/.hc$(echo loud)/credentials` 应 `deny` | 返回 `allow` | `safety-policy.mjs:325` | P | 待提单 |
| 3 | P0 | D4-16 | sh -c wrapper 内层穿透 | `sh -c "env \| grep HUAWEICLOUD"` 应 `deny` | 返回 `allow` | `safety-policy.mjs:321-368` | P | 待提单 |
| 4 | P0 | D4-21 | Terraform HCL broad IAM 漏检 | `Action = ["*"]` 应 `deny` | 返回 `allow` | `cloud-risk-rules.json:192` | P | 待提单 |
| 5 | P1 | D4-6 | --adminPass flag 形式不脱敏 | `--adminPass value` 应脱敏 | 返回原文 | `safety-policy.mjs:42` | P | 待提单 |
| 6 | P2 | D4-10 | fork bomb 规则失效（双重转义） | `:(){ :\|:& };:` 应 `deny` | 返回 `allow` | `cloud-risk-rules.json:359` | G | 待提单 |
| 7 | P1 | D9-2 | JSON-RPC 错误码未区分 | 未知方法应 `-32601` | 硬编码 `-32603` | `mcp-server.mjs:156-169` | P | 待提单 |

### 根因详情

**#1【P0】D4-2 凭证 env 打印拦截不完整**

- 期望：`env | grep HW_ACCESS_KEY` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:334-343`，`classifyTextCommand()` env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀；`echo $VAR` 通道亦无拦截。
- 证据：`evidence/d4-security/stdout.log`

**#3【P0】D4-16 sh -c 命令包裹穿透**：`classifyTextCommand()` 只检测整行文本，未提取 wrapper 内层参数做二次判定，`sh -c "env | grep HUAWEICLOUD"` 与 `sh -c "hcloud ecs DeleteServer"` 均 `allow`。

**#4【P0】D4-21 Terraform HCL broad IAM 漏检**：`hwc-iam-admin-policy` 规则 Action 正则仅匹配 JSON `"Action":"*"`，`Action = ["*"]` / `effect = "Allow"`（带引号 HCL）不命中。

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-39 | Windows 专专属 EINVAL 场景 | Windows 10 环境 | 提供 Windows 机器复测 |
| D4-18/19 | 审批流实时对话框需真实 Agent 会话确认流 | 真云+标准客户端 | 半自动/真机会话 |
| D4-23 | 11 安装目标 rules 注入需逐目标安装验证 | 11 个 Agent 目标环境 | 逐目标安装 |
| D10 评测集 | 需真实 harness + 真实 Agent 运行评测 | 评测 harness | 搭建评测环境 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`（claude 探针均走 redactSecrets/只读，未输出明文凭证）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（d1-cli 探针已过滤 accessKeyId/secretAccessKey/token 行）

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 华为云 ECS/沙箱/OBS 等 | 否 | — | 本轮未创建任何云资源，零残留 |

> 本轮仅执行源码级静态探针 + 只读 CLI（version/status/doctor），未创建/删除任何华为云资源。

---

## 九、遗留与建议

- 待裁决 SPEC：无新增（本 daily 轮未标 SPEC-MISMATCH）。
- 本轮未覆盖（说明范围）：真云 E2E（D3-C4/C5、D2-1/2/5）、多终端矩阵（D5 其余 9 客户端、D1-39 Windows、D9-6）、审批流实时对话框（D4-18/19/24）、D10 评测集（D10-1~5）、性能压测（D6-1/4）。
- 建议：4 个 P0 安全域缺陷（D4-2/15/16/21）建议优先修复——均为 `classifyTextCommand()` / 风险规则的绕过面，涉及凭证泄露与写操作穿透。