# DSH-deepseek-v4-pro-0813 每日测试报告

> **生成时间**：`2026-09-29 05:45:00`（北京时间）
> **执行归档**：`results/DSH/2026-09-29-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（7 个 P0 缺陷，均命中历史问题单，本轮为复核复现）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0011，IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.7`（npm latest 正式版，gitHead `7456d0598876b68a9313eb641eea985b63687262`） |
| 工具全集 | `40`（tools/list 枚举 40，TOOL_DEFINITIONS 一致） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 已确认（Runtime deps undici 安装） |
| 真云凭证 | cn-north-4（AKSK 管理员 + test001 只读子账号） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 102 / 展开级 39（init_day 预筛后） |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结果落 `stdout.log`；CLI 真机（doctor/status/update）隔离 DSH_HOME 执行；MCP 协议走 `protocol-probe` + `run-eval`；真云 E2E 走 VPC/OBS 建删归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `109 / 28 / 1 / 2 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `78.4%`（109/139） |
| P0 / P1 / P2 缺陷（设计级） | `7 / 4 / 6`（另有 2 项 SPEC-MISMATCH） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/OBS 无 `tctest-dsh-` 残留） |

> **较上轮（v1.1.7 2026-09-28）变化**：无代码变更（版本与 gitHead 完全一致）。全量 fresh 重跑（38 批探针 + 真云 E2E 建删资源 + 夹具 harness），结果与上轮一致，并补齐交叉核对：确认 D4-3 kms DecryptData、D2-4 小写 ak=/sk=、D4-2 HW_ 前缀、D4-16 shell 包裹穿透等 P0 均原样复现。

---

## 三、状态汇总

### 3.1 设计级（102）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 81 | 有证据且通过 PASS 门禁（含真云 D2-1/D3-C4/D4-14/D4-18/19/20 + D4-13 只读子账号 + D4-12 供应链夹具） |
| FAIL | 17 | 不符预期（详见缺陷清单） |
| BLOCKED | 1 | D3-S3 沙箱 devbridge_tunnel FAIL → 预览 URL 为空（补环境） |
| SPEC-MISMATCH | 2 | D1-68（region 优先级）/ D9-9（capabilities.cancellation） |
| NOT_RUN | 1 | D1-39 Windows 专属（Linux 由 D1-40 + 展开级终端矩阵代表覆盖） |
| **合计** | **102** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | EXP-D5-6-1/3 + EXP-C4-01~22（22 服务矩阵真云）+ EXP-E06/E08/E09/E15 |
| FAIL | 11 | EXP-E01~05/07/10~14（serviceCatalog 中文路由 MISS，同 D10-3 根因） |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽）

> 完整 19 项缺陷（17 FAIL + 2 SPEC，含根因文件:行号）见 `FINDINGS.md`。摘要如下：

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏漏小写 ak=/sk= | safety-policy.mjs:45 |
| 2 | P0 | D4-2 | 凭证 env 打印拦截缺 HW_ 前缀 | safety-policy.mjs:398-424 |
| 3 | P0 | D4-3 | 明文 secret API 拦截漏 kms DecryptData/Decrypt | safety-policy.mjs:240/432 |
| 4 | P0 | D4-16 | env-dump 被 shell 包裹穿透 | safety-policy.mjs:398 |
| 5 | P0 | D4-21 | HCL broad IAM 制品未拦截 | cloud-risk-rules.json:179-196 |
| 6 | P0 | D4-23 | huawei-agent-rules.mdc 未注入安装目标 | package.json:8-18 |
| 7 | P0 | D9-12 | initialize 握手两缺口（版本检查+非法时序未拒） | mcp-protocol.mjs:32-59 |
| 8 | P1 | D4-17 | hook 模糊输入 fail-open | risk-rule-engine.mjs |
| 9 | P1 | D4-24 | 审批令牌过期/重复确认未结构化 | hcloud-cli.mjs:85-92 / tools.mjs:1260 |
| 10 | P1 | D10-3 | serviceCatalog 中文路由 21.4%（+11 EXP-E MISS） | tools.mjs:1815-1947 |
| 11 | P1 | D3-S7 | 复合意图命中 RDS 未命中部署目标 | tools.mjs:1947 |
| 12 | P2 | D1-65 | 调试开关遥测域仅 'true' | telemetry/telemetry.mjs:81 |
| 13 | P2 | D4-25 | Python hook 写命令遥测误分类 cli:invoke | huaweicloud-safety.py:44-46 |
| 14 | P2 | D4-26 | findings.evidence 明文泄漏 | risk-rule-engine.mjs |
| 15 | P2 | D3-S5 | 复合意图分层路由未命中 | tools.mjs:1947 |
| 16 | P2 | D3-S6 | FG 路由 MISS + CreateFunction 缺 function_name | tools.mjs:1947 |
| 17 | P2 | D8-9 | sanitizeValue 未移除 AK/SK/token | telemetry/telemetry.mjs:189 |
| 18 | SPEC | D1-68 | region 优先级契约漂移 | credentials.mjs:171,222,352 |
| 19 | SPEC | D9-9 | capabilities.cancellation 未声明 | mcp-protocol.mjs:45-49 |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注「Windows 专属」升级检测链；本机 Linux 由 D1-40 反向提醒 + 展开级终端矩阵代表覆盖 | 设计级建包对 OS 专属用例同样预筛 |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | `sandbox_check_user` agreementSigned=true、connect/upload(deploy md5 verified)/deploy_nginx 均成功，但 `deploy_check` 的 devbridge_tunnel=FAIL → deploy_nginx url 为空，公网预览 URL 不可访问 | 补 DevStation 公网隧道/预览外发环境后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D9-13 tools/call 返回无 AK/SK/token 明文复测通过）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（AK/SK 均 `<redacted>`/`***REDACTED***`；credentials 不入库）
- [x] 只读子账号最小权限：D4-13 实测 read 成功、write 被 IAM 拒（VPC.0010 PolicyNotAuthorized）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（tctest-dsh-20260929-*，D4-14 审计） | 是 | 已删 | ListVpcs 不含本次资源（归零 OK） |
| VPC（tctest-dsh-s2-*，D3-S2） | 是 | 已删 | 删除后归零=true |
| OBS 桶（tctest-dsh-obs-*，D3-C13） | 是 | 已删 | rm 归零 |
| 只读子账号写测试（D4-13） | 否 | 无副作用 | CreateVpc 被 IAM 拒，资源计数=0 |

> 真云只删本次创建资源；删除前按 `tctest-dsh-` 前缀白名单盘点，未触碰既有/他人资源。D3-S6（FG）/D3-S7（RDS）因路由 MISS + 参数缺省未真正创建资源，无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级 HW_REGION vs HUAWEICLOUD_REGION）、`D9-9`（capabilities.cancellation）。
- 最高价值修复项：serviceCatalog 中文意图路由层（tools.mjs:1815-1947）——15 条中文意图仅 3 命中（21.4%），需补齐中文意图→服务映射字典；以及 safety-policy.mjs 的凭证拦截补漏（小写 ak=/sk=、HW_ 前缀 env-dump、shell 包裹穿透、kms DecryptData）。
- 本轮未覆盖（说明范围）：真实 LLM Agent 会话行为评测（D10-1/2/5/9 执行器）不在每日精选范围；D1-39 Windows 专属由 Windows 客户端覆盖。
- 环境备注：本机 `.obsutilconfig`（S3）曾出现 stale AK（InvalidAccessKeyId）指纹不一致，经 `setup_obs_config` 从全局凭证库重同步后真云 OBS 用例 PASS；建议维护侧在 AK 轮换后同步触发各机 auth sync。