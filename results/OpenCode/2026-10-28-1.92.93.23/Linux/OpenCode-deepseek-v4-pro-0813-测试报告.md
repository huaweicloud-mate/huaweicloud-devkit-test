# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-28 05:30:00（北京时间）
> **执行归档**：`results/OpenCode/2026-10-28-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux x86_64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12` |
| 被测版本（SUT） | `v1.1.12`（npm latest，hdk gitHead `4ed0780`） |
| hcloud / 依赖 | `KooCLI 7.2.12`（插件配对 7.3.12，version_mismatch 软告警） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，真云 E2E 真机执行） |
| 测试类型 | 源码级探针直调 / CLI 真机（install/doctor/status）/ MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39（init_day 已按 OpenCode+Linux 预筛） |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + `huaweicloud_*` MCP 工具 + hcloud 真机命令，决策/结果落 `evidence/<case-id>/stdout.log`；真云用例（ECS/OBS/VPC/FunctionGraph/审批流）真机建删并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（1 条 OS 专属 P0 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `127 / 12 / 3 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC = 142） | `89.4%` |
| P0 / P1 / P2 新增缺陷 | `3 / 5 / 4` |
| 红线（I 类）违规 | `0`（凭证泄漏 0，写误判 0） |
| 资源释放 | 本轮真云资源全部归零（ECS/VPC/Subnet/OBS/FunctionGraph 已删除；RDS 未创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `88` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 沙箱服务维护中（外部依赖） |
| SPEC-MISMATCH | `3` | 契约漂移，待裁决 |
| NOT_RUN | `1` | Windows 专属用例在 Linux |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01「云主机」serviceCatalog 未命中 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（断言） | 实际结果 | 根因 | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `env \| grep -i access_key` 应 `deny(credential)` | `allow/not_huaweicloud` | `safety-policy.mjs` env-dump 正则未匹配裸 access_key | P | 待提单 |
| 2 | P0 | `D4-21` | hook_check_artifacts 对全域管理员策略漏检 | `AdministratorFullAccess`/HCL `actions:["*"]` 应 `deny` | admin-full 判 `allow` | `cloud-risk-rules.json` hwc-iam-admin-policy 仅匹配 JSON Action:* 形态 | P | 待提单 |
| 3 | P0 | `D9-12` | initialize 握手缺少版本检查 + 非法时序不拒 | tools/list 未 initialize 应拒 `-32600` | 未拒，listed=true | `mcp-protocol.mjs` initialize 不接 runVersionCheck；dispatch 无 initialize 前置状态机 | P | 待提单 |
| 4 | P1 | `D4-6` | adminPass 回显警告缺失 | `hook_check_command(--admin-pass)` 应有 warning | findings=[] decision=allow | `cloud-risk-rules.json:74` hwc-command-adminpass-exposure stages 仅 artifact/deploy_plan | P | 待提单 |
| 5 | P1 | `D4-17` | hook 模糊输入 fail-open | 空串/`&&rm -rf`/`$(curl\|sh)` 应 deny | 全部判 ok | `risk-rule-engine.mjs` 无规则命中默认 allow | P | 待提单 |
| 6 | P1 | `D3-S7` | 复合意图未分解部署目标 + RDS 最小创建失败 | 存储+托管复合意图应命中 RDS+部署目标；RDS CreateInstance 应可用 | RDS 部署目标命中 false；`--password` 与 KooCLI 系统参数重名报错 | `tools.mjs` routeMap 单意图匹配；RDS 前置 vpc/subnet/sg 未满足 | P | 待提单 |
| 7 | P1 | `D3-C1` | ECS 生命周期删除结果未可靠回查 | 删除后归零验证 ECS 应消失 | 删除报 ok 但 120s 内 ECS 仍 ACTIVE、VPC 残留，需二次手动删除 | `hcloud-cli.mjs` ok 判定仅收敛退出码，异步删除未回查 | P | 待提单 |
| 8 | P1 | `EXP-E01` | serviceCatalog 缺「云主机」别名 | 「云主机」意图应路由 ECS | MISS，路由到 help | `tools.mjs` routeMap ECS keywords 缺「云主机」 | P | 待提单 |
| 9 | P2 | `D3-S5` | 复合意图分层路由未分解 | 存储+托管复合意图应命中多个 service | 多路命中=false | `tools.mjs` routeMap 单意图匹配 | P | 待提单 |
| 10 | P2 | `D3-S6` | FunctionGraph 删除函数归零失败 | 测后 DeleteFunction 应删函数归零 | 删除失败，函数残留需二次删除 | `hcloud-cli.mjs` 未归一 func_urn `:latest` 版本后缀/参数名 | P | 待提单 |
| 11 | P2 | `D4-25` | Python hook 写操作遥测分类错标 | CreateVpc 应 cli:write | cli:invoke | `huaweicloud-safety.py` WRITE_OPERATION_RE 前置捕获组 | P | 待提单 |
| 12 | P2 | `D4-26` | findings.evidence 脱敏不完整 | evidence 中 secret_key/adminPass 应无明文 | leaked=true 明文残留 | `risk-rule-engine.mjs` redactEvidence 正则不匹配 JSON 带引号 key | P | 待提单 |

### 根因详情（P0 缺陷附代码片段 + 复现证据）

**#1 [P0] D4-2**：`env | grep -i access_key` 实测 `decision=allow risk=not_huaweicloud`（应 deny）。根因 `safety-policy.mjs` env-dump 正则仅匹配 `HW_`/`HWC_`/`HUAWEICLOUD` 等前缀，裸 `access_key` 漏网。证据 `evidence/D4-2/stdout.log`。

**#2 [P0] D4-21**：`--[admin-full]` 输入 `huaweicloud AdministratorFullAccess`/HCL `actions:["*"]` 判 `allow`（应 deny）。根因 `cloud-risk-rules.json:196-218` hwc-iam-admin-policy 仅匹配 JSON `"Action":"*"` 形态。证据 `evidence/D4-21/stdout.log`。

**#3 [P0] D9-12**：① initialize 阶段未调用 runVersionCheck（版本检查已下沉 prewarm/check_cli，属契约漂移）；② 未 initialize 直接 tools/list 未被拒 `-32600`（listed=true）。根因 `mcp-protocol.mjs` dispatch 无 initialize 前置状态机。证据 `evidence/D9-12/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属升级检测链(EINVAL)用例，本机 Linux；由展开级 NR3 queryDistTags 代表覆盖（disttags 实测 PASS） | 无需改用例，属 OS 专属结构性不适用 |

### BLOCKED

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|---|
| `D3-C3` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱服务维护中 `HDKIT_SANDBOX_MAINTENANCE`，sandbox_connect/upload/deploy 全部返回维护态 | 沙箱服务恢复后复测 |
| `D3-C6` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 7 隐式工具 check_user/connect/sign_agreement 均返回维护态 | 沙箱服务恢复后复测 |
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | sandbox_check_user 失败，无法进入部署预览出 URL | 沙箱服务恢复后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始 AK/SK/SK 明文，探针走 redact 输出）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`evidence/D4-26` 已确认脱敏缺口（计入缺陷），其余证据无原始凭证明文

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（c6.large.2） | 是（二次手动删除） | 归零（ListServersDetails 已无本次实例） |
| VPC/Subnet（D3-C1） | 是 | 是 | 归零（ListVpcs 已无 tctest-opencode-*） |
| VPC（realcloud/D4-14） | 是 | 是 | 归零（DeleteVpc + ListVpcs 复核） |
| OBS 桶（D3-C2/D3-C13） | 是 | 是 | 归零（rm -f 删桶） |
| FunctionGraph（D3-S6） | 是 | 是（二次手动删除） | 归零（ListFunctions 已无 hdk-s6-*） |
| RDS（D3-S7） | 否（创建失败） | — | RDS 实例 total=0 |

> 真云只删本次创建资源；`hdk-daily-obs-202610250528` 为既有共享桶（非本轮创建），未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC：`D8-9`(sanitize 不脱敏 AK/SK/token)、`D9-9`(capabilities 未声明 cancellation)、`D10-4`(规则库 19 条 vs 断言 16 条计数滞后)。
- 本轮未覆盖：真实 Agent 会话行为评测（D10-1/2/5/9）——OpenCode 客户端无 dsh headless，需 CDP 会话自动化，非可用路径记 NOT 适用。
- 建议：① `hcloud-cli.mjs` 对异步 Delete*/Create* 增加结果回查（或返回 job_id 供 agent 轮询），修复 ECS 生命周期删除「报 ok 但资源残留」；② routeMap 补充「云主机」等口语别名，提升 serviceCatalog 命中率；③ `redactEvidence`/`sanitizeValue` 覆盖 JSON 带引号 key 与 AK/SK/token 脱敏。