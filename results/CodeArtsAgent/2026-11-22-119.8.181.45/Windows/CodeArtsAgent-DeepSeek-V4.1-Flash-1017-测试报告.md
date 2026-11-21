# CodeArtsAgent-DeepSeek-V4.1-Flash-1017 每日测试报告
> **报告名**：`CodeArtsAgent-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-22 05:52:22（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-22-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 8 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.15` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：① 源码级直调（update-check/risk-rule/safety-policy/detect-framework 等 mjs 函数）② MCP JSON-RPC 真机调用（49 工具、initialize/tools list、hook 预检、plan/confirm）③ 官方夹具 harness（eval/harness/fixtures 24 项）④ 真云 E2E（hcloud + OBS SDK：VPC/ECS 建删、OBS 桶与网站托管建删、只读查询、只读子账号最小权限）⑤ D10-3 路由评测（run-eval.mjs，15 条命中 13、N/A 1、准确率 92.9%）。全部证据落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `120 / 18 / 7 / 1 / 0` |
| 通过率（分母 = PASS+FAIL = 138） | `87.0%` |
| P0 / P1 / P2 新增缺陷 | `8 / 5 / 5` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `82` | 有证据且通过 PASS 门禁 |
| FAIL | `17` | 不符预期，根因见缺陷清单 |
| BLOCKED | `7` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
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
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链可用性 | 见 FINDINGS.md 根因列 | 待提单 |
| 2 | P1 | `D2-12` | D2认证 | R10 runtime非空禁止落盘 | 见 FINDINGS.md 根因列 | 待提单 |
| 3 | P0 | `D4-19` | D4安全 | 确认流下预检仍生效 | 见 FINDINGS.md 根因列 | 待提单 |
| 4 | P1 | `D2-1` | D2认证 | auth init三端同步 | 见 FINDINGS.md 根因列 | 待提单 |
| 5 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 见 FINDINGS.md 根因列 | 待提单 |
| 6 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | 见 FINDINGS.md 根因列 | 待提单 |
| 7 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | 见 FINDINGS.md 根因列 | 待提单 |
| 8 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | 见 FINDINGS.md 根因列 | 待提单 |
| 9 | P0 | `D4-9` | D4安全 | 公开暴露/破坏性预检 | 见 FINDINGS.md 根因列 | 待提单 |
| 10 | P0 | `D4-15` | D4安全 | hook绕过尝试 | 见 FINDINGS.md 根因列 | 待提单 |
| 11 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | 见 FINDINGS.md 根因列 | 待提单 |
| 12 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | 见 FINDINGS.md 根因列 | 待提单 |
| 13 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | 见 FINDINGS.md 根因列 | 待提单 |
| 14 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | 见 FINDINGS.md 根因列 | 待提单 |
| 15 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | 见 FINDINGS.md 根因列 | 待提单 |
| 16 | P1 | `D9-4` | D9协议 | 协议生命周期 | 见 FINDINGS.md 根因列 | 待提单 |
| 17 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | 见 FINDINGS.md 根因列 | 待提单 |
| 18 | P1 | `EXP-E01` |  |  | 见 FINDINGS.md 根因列 | 待提单 |

### 根因详情

| # | 用例 | 根因（文件:行号） |
|---|---|---|
| 1 | D1-39 | `update-check.mjs` parseDistTagsOutput 仅接受对象，未兼容 npm 12 数组输出 |
| 2 | D2-12 | `tools.mjs` auth_sync 调 `auth/service.mjs` syncAuth 仅读持久凭证，未走 runtime 凭证 |
| 3 | D4-19 | `hcloud-cli.mjs` consumeApprovalToken 调用方未将 null 映射为拒绝 |
| 4 | D2-1 | `auth/service.mjs` initAuth 隔离 HOME 下未落盘 S1/KooCLI/OBS |
| 5 | D3-C14 | `auth/credentials.mjs` resolveCredentials 清空 runtime 后回退实例文件凭证 |
| 6 | D3-S6 | 探针 func_code 传参/编码不适配（FSS.0400），非产品缺陷，不计入缺陷单 |
| 7 | D4-2 | `safety/rules/cloud-risk-rules.json` 缺 Windows `set VAR` 规则；`risk-rule-engine.mjs` |
| 8 | D4-3 | `cloud-risk-rules.json` blockedSecretOperations 未覆盖 KMS DecryptData |
| 9 | D4-9 | `risk-rule-engine.mjs` 缺 0.0.0.0/0 安全组入方向规则 |
| 10 | D4-15 | `safety-policy.mjs` classifyTextCommand 未剥离连续/转义双引号 |
| 11 | D4-16 | `safety-policy.mjs` stripExecutable/classifyTextCommand 未递归解析内层命令 |
| 12 | D4-17 | `safety-policy.mjs` classifyTextCommand 未对 NUL/非字符串 fail-closed |
| 13 | D4-25 | `huaweicloud-safety.py` record_cli_event capability 恒为 `cli`，缺 cli:invoke |
| 14 | D4-26 | `risk-rule-engine.mjs` evidence 直接 excerpt(text) 未调用 redactEvidence |
| 15 | D8-9 | `telemetry/telemetry.mjs` sanitizeValue 无凭证脱敏正则 |
| 16 | D9-4 | `mcp-protocol.mjs` tools/list 前未校验 initialized |
| 17 | D9-12 | 同 D9-4，`mcp-server.mjs` 无强制握手门禁 |
| 18 | EXP-E01 | `tools.mjs` serviceCatalog routeMap 未覆盖「华北北京四/云主机」组合 |
| 19 | D10-4 | `cloud-risk-rules.json` 新增 3 条 warn（19=9+10 vs 基线 16=9+7，SPEC 漂移） |


---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 2026-11-22 05:57 实测 huaweicloud_sandbox_check_user 返回 ok=false（无会话体），本机无 DevStation 沙箱 workspace 配额/登录态；影响：sandbox upload/deploy_nginx 部署链路无法真实执行；解除条件：提供沙箱配额与已签署协议的有效会话 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 同上，本机无沙箱会话；影响：sandbox_deploy_check/expose_tunnel 等 7 工具无法实测；解除条件：提供 DevStation 沙箱会话 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 同上，本机无沙箱会话，expose_tunnel 无法建立；影响：公网预览 URL 无法验证；解除条件：提供沙箱 workspace 与隧道配额 |
| `D3-S4` | D3功能 | 场景-领券闭环 | 2026-11-22 real: voucher_status returned HDKIT_CRED_RATE_LIMIT; impact: coupon loop blocked by external rate limit; unblock: retry after rate-limit window |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 本次窗口已真机完成 VPC/ECS/OBS 建删，RDS 实例创建需 10-20 分钟且需部署目标；未在窗口内完成；影响：RDS+Web 多服务编排与连接串注入未端到端验证；解除条件：预留 30 分钟 RDS 建删窗口 + 沙箱/ECS 部署目标 |
| `D4-11` | D4安全 | 提示注入防护 | 需真实 LLM Agent 读取工具返回后行为判定，本客户端无 dsh headless / LLM harness；影响：无法判定 Agent 是否执行注入指令；解除条件：提供 Agent 会话自动化（CDP）或 LLM harness 环境 |
| `D4-14` | D4安全 | 操作可审计性 | 2026-11-22 real: hcloud CTS ListTraces rc=0 but traces=0 (CTS not enabled / no visible audit trail); impact: cannot verify auditability; unblock: enable CTS and grant trace read |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无明文 AK/SK 写入 results（D2-4/PROFILE 脱敏 PASS；D4-26 findings.evidence 未脱敏已提单）
- [x] 写操作误判 read-only：D4-5/D4-10 写=deny或warn、只读=allow，无误判
- [x] 红线（I 类）违规：无（未创建未删除资源；未以 mock 冒充真云）
- [x] 脱敏复核：evidence 内无明文凭证；hcloud 输出已过滤 secret-key

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2） | tctest-daily-20261122053114 | hcloud VPC DeleteVpc rc=0 | VPC ListVpcs 无该 id（仅他机 hermes 资源） |
| ECS（D3-C1） | tctest-ecs-20261122054351（c6.large.2/EulerOS 3.0） | DeleteServers(servers.1.id, delete_publicip/volume) | ListServersDetails count=0，ShowServer=DELETED |
| 子网/安全组（D3-C1） | tctest-ecs-* 随 VPC 创建 | DeleteSubnet(vpc_id)+DeleteSecurityGroup | 子网/安全组列表无本次创建 |
| OBS 桶（D3-C2） | tctest-obs-* | deleteObject+deleteBucket | headBucket=404 |
| OBS 桶与网站配置（D3-C13） | tctest-obsweb-* | deleteBucketWebsite+deleteBucket | headBucket=404 |
| FunctionGraph（D3-S6） | 创建失败(FSS.0400) | 无资源产生 | ListFunctions 无本次函数 |
| 只读子账号写测试（D4-13） | VPC.0010 被 IAM 拒绝，未创建 | 无需清理 | 无残留 |


---

## 八、遗留与建议

- **D10-4 SPEC-MISMATCH**：规则库 19 条（9 deny+10 warn）与用例基线 16 条漂移，建议维护者更新用例基线或标注版本化规则数。
- **P0 安全缺口（建议优先修复）**：D4-2/D4-3/D4-9/D4-15/D4-16/D4-19/D9-12 共 7 项，全部为 hook/预检/握手层可绕过或漏判，建议在 1.1.16 前修复并回归。
- **升级链 D1-39**：npm 12 `dist-tags --json` 输出为数组，Windows 检测链静默降级为 check_failed，属用户可感知回归。
- **未覆盖/阻塞**：沙箱（D3-C3/C6/S3）缺 DevStation 配额，RDS 编排（D3-S7）需长窗口，提示注入（D4-11）需 LLM harness；建议维护者提供沙箱与 harness 后补测。
- **环境提示**：本机 credentials.json 曾被前次 D2-26 测试写入占位 AK（AK_BK_00…），已恢复真实凭证并留备份，建议用例执行后自愈。
