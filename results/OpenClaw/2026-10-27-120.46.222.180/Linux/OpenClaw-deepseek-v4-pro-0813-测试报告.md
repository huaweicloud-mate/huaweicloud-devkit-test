# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-27 09:57:40（北京时间，fresh 全量重跑）
> **执行归档**：`results/OpenClaw/2026-10-27-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项；全部为历史延续，SUT 与昨日同比未变；另沙箱维护致 3 项 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（6.8.0-106-generic） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.12`（npm latest，gitHead `4ed07801`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS 实测 count=46） |
| hcloud / 依赖 | `hcloud 7.2.12`（plugin 配对 7.3.12，有 version_mismatch 提示） |
| 真云凭证 | `cn-north-4`（AK/SK + 只读子账号 test001 已就绪并真机执行） |
| 测试类型 | 源码级探针 / MCP 协议 / 真机 CLI / 真云 E2E / eval-harness |
| daily 基础用例 | 设计级 107 / 展开级 39（init_day 预筛后） |

> **执行方法**：探针脚本（`.mjs`）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn `mcp-server.mjs` 做协议/工具链路验证，决策/结果落 `stdout.log`；真机 CLI（hcloud）执行真云 E2E 建删归零；证据统一落 `evidence/<case-id>/`。今日 33 支源级/协议/harness 探针 + 7 支真云/沙箱探针本机 fresh 重跑。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146`（NOT_RUN 仅 1 条 OS 专属 P0 豁免 D1-39） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 12 / 4 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 138，不含 BLOCKED/SPEC/NOT_RUN） | `91.3%` |
| P0 / P1 / P2 缺陷（12 FAIL 均为历史延续） | `4 / 3 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/VPC/EIP/OBS/FunctionGraph 均建删归零；沙箱因维护未建资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `88` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单（历史延续） |
| BLOCKED | `4` | D3-C3/C6/S3 沙箱维护 + D3-S7 RDS 真云外部依赖 |
| SPEC-MISMATCH | `3` | 契约漂移（D1-65/D1-68/D9-9），待裁决 |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 列标注专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 云主机路由 MISS（历史延续） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单（12 FAIL 全部历史延续）

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | D4安全 | 明文 secret API 未拦截（kms DecryptData/DecryptDatakey） | `safety/policy.json:26` 缺两项 | 历史 |
| 2 | P0 | `D4-15` | D4安全 | hook 绕过尝试未完全拦截（ANSI-C 引号命令替换） | `risk-rule-engine.mjs` 未解析 ANSI-C | 历史 |
| 3 | P0 | `D4-21` | D4安全 | hook_check_artifacts HCL/Terraform 广泛 IAM 未拦截 | `risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON | 历史 |
| 4 | P0 | `D9-12` | D9协议 | initialize 握手时序未强制（未 initialize 先 tools/list 返回 46 工具） | `mcp-protocol.mjs:57` 无 initialize 前置校验 | 历史 |
| 5 | P1 | `D4-17` | D4安全 | hook 模糊 fail-closed 缺口（$(...) 命令替换内层 allow） | `risk-rule-engine.mjs` 无 finding 即 allow | 历史 |
| 6 | P1 | `D4-27` | D4安全 | 双路径输出脱敏缺口（--key value 空格形态未脱敏） | `safety-policy.mjs:34` 正则仅匹配 key[:=]value | 历史 |
| 7 | P1 | `EXP-E01` | D10评测 | 『云主机』中文意图路由 MISS | `tools.mjs` ECS keywords 缺「云主机」同义词 | 历史 |
| 8 | P2 | `D3-S5` | D3功能 | 复合意图分层路由 MISS | `tools.mjs` serviceCatalog 无复合意图拆解 | 历史 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类（写→cli:invoke） | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE | 历史 |
| 10 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（secret_key/adminPass 明文残留） | `risk-rule-engine.mjs:19` redactEvidence | 历史 |
| 11 | P2 | `D8-1` | D8质量 | 文档与能力漂移（AGENTS.md 39/43 vs 46 工具） | `AGENTS.md` 未随 tools.mjs 同步 | 历史 |
| 12 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏（AK/SK/token 原样保留） | `telemetry/telemetry.mjs:189` sanitizeValue | 历史 |

### 根因详情（代表性 P0 复现证据）

- **D4-3**：`classifyTextCommand('hcloud kms DecryptData ...')` → `allow/unknown_read`；对照 `ShowSecretVersion`/`GetSecretValue` → `deny/secret`。
- **D9-12**：d9-12.log 项⑥ `非法时序 tools/list 被拒 -32600` → `FAIL（listed=true）`。
- **D4-21**：hcl-probe.log 中 `hcl-actions-star` 与 `tf-admin-full-suffix` 均 `decision=allow findings=(空)`。

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 【调归属】OS 专属 | Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」） | 无需改，Linux 由 D1-40 覆盖 |
| D3-C3 | 设计级 | P1 | BLOCKED | 【补环境】 | `HDKIT_SANDBOX_MAINTENANCE：沙箱功能正在升级优化`，connect/upload/deploy 全链路外部不可用 | 沙箱维护窗口结束后补测（历史 #981 验证误判恢复复现） |
| D3-C6 | 设计级 | P1 | BLOCKED | 【补环境】 | 沙箱维护，首步 check_user 即返回维护错误，7 隐式工具冒烟不可达 | 沙箱恢复后补测 |
| D3-S3 | 设计级 | P1 | BLOCKED | 【补环境】 | 沙箱维护，connect/deploy 不可达 | 沙箱恢复后补测 |
| D3-S7 | 设计级 | P1 | BLOCKED | 【补环境】 | RDS 实例创建需 VPC/子网/安全组前置编排 + 正确 db 参数（`--password` 与系统参数冲突）+ 长 provisioning | 补 RDS 前置网络编排夹具或改用例为「只读核查+引导」 |

---

## 六、安全/红线

- 真云 E2E 全部真机执行，建删资源归零验证通过：ECS（D3-C1）创建 ACTIVE 后 ECS/磁盘/EIP/子网归零，残留 VPC 已二次确认删除；FunctionGraph（D3-S6）建函数+定时触发器后删除归零；OBS（D3-C2/C13）建桶→静态站→200→删对象删桶归零；VPC（D3-S2）建删归零 5/5；D4-13 只读子账号写 CreateVpc 返回 `VPC.0010 PolicyNotAuthorized`，被正确拒绝且未建资源。
- 红线（I 类）违规：`0`。

## 七、资源释放

- ECS / VPC / 子网 / EIP / OBS / FunctionGraph：全部归零（`tctest-openclaw-c1-*` VPC 已二次确认删除，ListVpcs 无残留）。
- 沙箱：因维护未创建任何沙箱实例，无残留。
- RDS：未创建成功，无残留。

## 八、遗留建议

- 12 项 FAIL 全部为历史延续（SUT 1.1.12 gitHead 4ed07801 与昨日一致），已生成 HISTORY_LINKS.md 关联清单，未重复提单。
- D3-C3/D3-C6/D3-S3 受沙箱云端维护阻塞，建议维护窗口结束后第一时间补测，重点复核历史 #981（deploy_nginx 验证误判）是否随沙箱恢复仍复现。
- D8-1 文档漂移（AGENTS.md 硬编码 39/43 工具数）建议由维护者在源码仓库同步一次，消除跨版本文档噪声。