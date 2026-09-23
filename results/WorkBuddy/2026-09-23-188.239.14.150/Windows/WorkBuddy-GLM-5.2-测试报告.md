# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-23 17:45:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-23-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：PARTIAL（19 条 FAIL + 1 条 SPEC-MISMATCH，含 2 条 P0）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + GLM-5.2 |
| OS / 架构 | Windows Server 2022 (10.0.20348) x64 |
| Node / npm / Python | Node v22.22.2 / npm 12.1.0 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.7-next.0（npm @next，gitHead 0790e92a） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS，MCP `tools/list` 实测 40） |
| hcloud / 依赖 | hcloud 7.2.12 / 真云 doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK / 已使用：真机创建并删除 1 个 VPC，归零） |
| 测试类型 | MCP 真机调用（stdio）/ 源码级模块直调 / 真机 CLI（doctor/status/help）/ eval harness / 真云 E2E |
| 设计真源 | 设计级 100 / 展开级 39 / 追踪表 211 |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：本次为**全新一轮真机执行**（非复用历史证据）。`daily_probe.mjs` 单会话驱动真实 MCP stdio（40 工具，逐个 `tools/call` 断言真实响应）、`fixup_probe.mjs` 修正首轮探针误判并复测、`realcloud_vpc.mjs` 真云建删生命周期、`eval/harness/run-eval.mjs` 路由评测、`eval/harness/protocol-probe.mjs` 协议探针、源码级模块直调（`update-check/safety-policy/risk-rule-engine/telemetry/...`）。证据统一落 `evidence/<case-id>/stdout.log`（JSON，含真实响应/返回值）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 139（设计级 100 + 展开级 39） |
| 已执行 | 139 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 119 / 19 / 0 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC = 139） | 85.6% |
| P0 / P1 / P2 新增缺陷 | 2 / 4 / 1（合并 7 条 FINDINGS） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（真云 VPC 创建 1 → 删除 1 → 残留 0；ECS/VPC/安全组/EIP 均 0） |

---

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 93 | 有真实证据且通过 PASS 门禁 |
| FAIL | 6 | D1-39、D1-42、D4-23、D4-27、D8-9、D10-3 |
| SPEC-MISMATCH | 1 | D9-9（initialize 未声明 notifications.cancellation） |
| BLOCKED | 0 | — |
| NOT_RUN | 0 | — |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 26 | 22 C4 服务矩阵 + 2 D5 客户端发现 + 3 E 路由 HIT（含 E08 N/A） |
| FAIL | 13 | EXP-C4-14/18（DMS/DEW 路由不可执行）+ EXP-E01~E05/E07/E10~E14（serviceCatalog 路由 MISS） |
| BLOCKED | 0 | — |
| NOT_RUN | 0 | — |

### 3.3 按优先级

| 优先级 | 总数 | PASS | FAIL | SPEC-MISMATCH | 通过率 |
|---|---|---|---|---|---|
| P0 | 19 | 17 | 2 | 0 | 89.5% |
| P1 | 51 | 47 | 3 | 1 | 92.2% |
| P2 | 30 | 29 | 1 | 0 | 96.7% |
| 展开（P1） | 39 | 26 | 13 | 0 | 66.7% |

---

## 四、缺陷清单

详见 `FINDINGS.md`。共 **7 条合并缺陷**（覆盖 19 条 FAIL + 1 条 SPEC-MISMATCH）：

1. **【P0】D1-39 Windows 升级检测链失效** — `src/update-check.mjs:86` `parseDistTagsOutput` 直接拒绝数组，而 `npm view ... dist-tags --json` 返回数组 `[{...}]`，导致 `queryDistTagsSync()` 恒 null → `check_update` 恒返回 `check_failed`。
2. **【P0】D4-23 huawei-agent-rules.md 全局规则文件缺失** — 插件目录与全仓均无该文件，MUST 约束无法注入。
3. **【P1】D1-42 dismiss 真实闭环不成立** — 与 D1-39 同源，`targetVersion` 恒 null，dismiss 无可记录版本，跨调用/重启均不生效。
4. **【P1】EXP-E01~E14 / D10-3 serviceCatalog 中文意图路由准确率仅 21.4%** — 11/14 中文意图 MISS，返回兜底 "Run hcloud --help"。
5. **【P1】D4-27 redactSecrets 未脱敏 accessKeyId 字段名** — `src/safety-policy.mjs:49` 正则仅匹配 `AK:` 前缀，`accessKeyId:` 格式明文外泄。
6. **【P1】EXP-C4-14/18 DMS/DEW list_operations 静默失败** — `hcloud DMS/DEW --help` 返回「不支持的服务名称」但工具仍回 exitCode=0，错误未暴露。
7. **【P2】D8-9 sanitizeValue 未移除 AK/SK/token 敏感值** — `src/telemetry/telemetry.mjs:189` 仅裁剪空白与长度，凭证原样保留。

---

## 五、未执行用例与原因

无未执行用例。139 条用例全部真机执行并回填（无 NOT_RUN / BLOCKED）。

---

## 六、安全/红线

| 检查项 | 结果 |
|---|---|
| 真云用例执行 | ✅ 真机执行（VPC 建→可见→删→归零，baseline 0 → after 0） |
| 凭证脱敏 | ✅ show_profile_redacted 输出 accessKeyId/secretAccessKey/securityToken 均为 `<redacted>` |
| 凭证文件读取拦截 | ✅ hook_check_command 对 cat/type 凭证文件 → deny（hwc-command-credential-file） |
| 凭证 env 打印拦截 | ✅ printenv HUAWEICLOUD_AK / env\|grep HWC_ → deny（hwc-command-env-dump） |
| 明文 secret API 拦截 | ✅ DEW ShowSecretVersion/DownloadSecret → deny |
| 写操作审批门 | ✅ plan_cli_command 对写操作 → deny + safeToRun=false + approvalToken |
| STS token 拒绝落盘 | ✅ tools.mjs persistCredentials 对非空 securityToken → rejected |
| 规则库完整 | ✅ 9 deny + 7 warn = 16 规则（实测 loadRiskRules） |
| PASS 门禁 | ✅ verify_no_fake_pass.py 通过 |
| 覆盖率门禁 | ✅ verify_coverage.py 通过（NOT_RUN+空 0.0%，P0 无 NOT_RUN） |

---

## 七、资源释放

| 资源类型 | 创建数 | 删除数 | 残留 |
|---|---|---|---|
| VPC（本次真机 E2E） | 1 | 1 | 0 |
| ECS 实例 | 0 | 0 | 0 |
| 子网 | 0 | 0 | 0 |
| 安全组 | 0 | 0 | 0 |
| EIP | 0 | 0 | 0 |

真云 E2E 仅创建唯一命名 VPC（`workbuddy-daily-0156161938`）并立即删除，验证「创建可见 → 删除后归零」。其余真云操作均为只读（ListServersDetails/ListVpcs），未创建任何计费资源。

---

## 八、遗留建议

1. **升级检测链（P0，最高优先）**：`parseDistTagsOutput` 需同时兼容 `npm view --json` 的数组与对象两种输出；否则全平台升级提醒永久失效。
2. **全局规则注入（P0）**：确认 `huawei-agent-rules.md` 是设计移除还是实现缺失；若保留设计，需补文件 + 11 安装目标注入验证。
3. **serviceCatalog 中文路由（P1）**：扩展中文服务词典（云主机→ECS、弹性公网IP→EIP、云数据库→RDS 等），当前 21.4% 严重拖累中文体验。
4. **双路径脱敏一致性（P1）**：`redactSecrets` 正则补 `accessKeyId`/`access_key`/`SecretAccessKey` 等字段名变体。
5. **list_operations 服务名校验（P1）**：对 KooCLI 不支持的 service 名（DMS/DEW）应显式报错，避免静默返回错误 help。
6. **遥测脱敏（P2）**：`sanitizeValue` 增加对 AK/SK/token 形态值的占位替换。
