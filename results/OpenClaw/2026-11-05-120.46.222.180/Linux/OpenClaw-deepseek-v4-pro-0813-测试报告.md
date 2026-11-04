# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-05 05:43:52（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-05-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.13-next.5` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真机 hcloud CLI + MCP server 协议探针 + 真云 AK/SK 建删归零；结果落 `evidence/<case-id>/stdout.log`，回填三份 CSV。SUT 由 1.1.13-next.4 升级至 1.1.13-next.5（20 文件变更，沙箱 sandbox-pool 重构）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `121 / 13 / 8 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 134） | `90.3%` |
| P0 / P1 / P2 新增缺陷 | `4 / 4 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（VPC/子网/EIP/ECS 本次创建均已核实）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `83` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `8` | 环境/权限/凭证阻塞 |
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
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | `package.json` engines >=22 + undici ^8.12.3（需 >=22.19 + node:zlib zstd），Node 22.13 无 zstd → undici decompress.js:78 import 期崩溃 | 待提单 |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs` serviceCatalog 单关键词并集无复合意图拆解 | 待提单 |
| 3 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety/policy.json:26` blockedSecretOperations 缺 DecryptData/DecryptDatakey | 待提单 |
| 4 | P0 | `D4-15` | D4安全 | hook绕过尝试 | `risk-rule-engine.mjs` 纯正则未解析 ANSI-C 引号内层 | 待提单 |
| 5 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `risk-rule-engine.mjs` 无 finding 即 allow，$(...)内层未解析未 fail-closed | 待提单 |
| 6 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON，未覆盖 HCL actions=["*"] | 待提单 |
| 7 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置 (^|[A-Za-z0-9]) 不匹配空格分隔写动词 | 待提单 |
| 8 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `risk-rule-engine.mjs:19` redactEvidence 键值正则键后须紧冨 :/=，引号 JSON key 场景不命中 | 待提单 |
| 9 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:34` redactString 仅匹配 key[:=]value，--key value 空格分隔未覆盖 | 待提单 |
| 10 | P2 | `D8-1` | D8质量 | 文档与能力一致 | hdk AGENTS.md 硬编码 43/39 工具数未随 tools.mjs 同步（实际 46） | 待提单 |
| 11 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs` sanitizeValue 仅 trim+截断，无敏感值脱敏 | 待提单 |
| 12 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs:57` dispatch tools/list 无 initialize 前置校验 | 待提单 |
| 13 | P1 | `EXP-E01` | D10评测 | 中文意图『云主机』路由 MISS | `tools.mjs` ECS keywords 缺『云主机』同义词 | 待提单 |

### 根因详情

> 每个 FAIL/SPEC 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」详见 FINDINGS.md（#1~#21），根因均已定位到文件:行号，证据落 `evidence/<case-id>/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 专属用例在非对应 OS，Linux 侧由展开级 EXP-NR3-10 代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 真·外部依赖：账号计费状态受限（Ecs.0067 insufficient balance），ECS 创建被云端计费系统拒绝；解除条件=账号余额/计费状态恢复后重跑建删归零 |
| `D3-C2` | D3功能 | OBS静态站部署E2E | 真·外部依赖：账号 OBS 写限制（403 UserRestricted）；解除条件=账号 OBS 写权限恢复后重跑完整建站 E2E |
| `D3-C3` | D3功能 | 沙箱部署E2E | 真·外部依赖：HDKIT_SANDBOX_MAINTENANCE 沙箱服务维护中，连接/上传/部署均不可用；解除条件=沙箱维护窗口结束 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 真·外部依赖：HDKIT_SANDBOX_MAINTENANCE 沙箱服务维护中；解除条件=沙箱维护窗口结束 |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | 真·外部依赖：账号 OBS 写限制（403 UserRestricted）；解除条件=账号 OBS 写权限恢复 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 真·外部依赖：HDKIT_SANDBOX_MAINTENANCE 沙箱服务维护中；解除条件=沙箱维护窗口结束 |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | 真·外部依赖：账号 FunctionGraph 写限制（FSS.0403 user restricted）；解除条件=账号 FunctionGraph 写权限恢复 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 真·外部依赖：RDS 实例创建需 VPC/子网/安全组前置环境 + 正确 db 参数 + 长 provisioning 窗口 |

---

## 六、安全与红线合规

- 凭证泄漏事件：`无（D2-4/D4-6/D4-27/D4-26/D8-9 已按凭证脱敏口径执行；D4-26/D8-9 脱敏缺口已记历史缺陷）`
- 写操作误判 read-only：`无（D4-5/D4-29 误判检测均 deny/write 非只读）`
- 红线（I 类）违规：`0`
- 脱敏复核：`通过（show_profile_redacted 走脱敏管道；真云探针输出已 redact AK/SK）`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14 / D3-S2 / D3-C1） | 是（tctest- 前缀，最低规格） | 是（DeleteVpc） | 是（ListVpcs 不含本次资源，quota 4/5） |
| ECS（D3-C1） | 否（Ecs.0067 欠费拒绝） | n/a | 是（未创建） |
| 子网（D3-C1） | 是 | 是（DeleteSubnet） | 是（ListSubnets 不含本次） |
| EIP（D3-C7） | 否（assert only） | n/a | 是（ListEips 空） |
| OBS 桶（D3-C2/C13） | 否（403 UserRestricted 拒绝） | n/a | 是（无残留） |
| FunctionGraph（D3-S6） | 否（FSS.0403 拒绝） | n/a | 是（无残留） |

> 今日真云建删归零核实：D3-C1 探针创建 VPC(8d2cbd19)+子网后 ECS 因账号欠费（Ecs.0067）失败，VPC/子网已手工 DeleteSubnet+DeleteVpc 归零（ListVpcs 0 命中）；D4-14/D3-S2 建→删→归零全 OK；无残留资源。

---

## 八、遗留与建议

- **SPEC-MISMATCH 3 项待维护者裁决**：D1-65（telemetry 域 '1' 不生效）、D1-68（HW_REGION 优先级）、D9-9（cancellation 未声明）——均为版本文档契约与实现漂移，根因已定位（见 FINDINGS.md #19/#20/#21）。
- **BLOCKED 8 项需外部解锁**：账号计费/写限制（D3-C1 Ecs.0067 / D3-C2/C13 OBS 403 / D3-S6 FSS.0403）历史 10-19 曾出现并于次日恢复，建议账号侧确认余额与写权限；沙箱 3 项（D3-C3/C6/S3）待 HDKIT_SANDBOX_MAINTENANCE 维护窗口结束；RDS（D3-S7）需 VPC/子网/安全组前置编排 + 正确 db 参数。
- **13 项 FAIL 全部历史延续**（fresh 复现，无新增产品缺陷），不重复提单，关联见 HISTORY_LINKS.md。
