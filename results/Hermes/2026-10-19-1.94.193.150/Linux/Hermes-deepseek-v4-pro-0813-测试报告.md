# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-19 05:30（北京时间）
> **执行归档**：`results/Hermes/2026-10-19-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 缺陷 3 项 + SPEC 漂移 P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64 ECS） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.9`（npm latest 正式版，gitHead `05a67b6`，release PR #950） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `KooCLI 7.2.12`（插件配对 7.3.12，`auth_status` 报 `version_mismatch`，非阻断） |
| 真云凭证 | `cn-north-4`（AK/SK + 只读子账号 test001 均已就绪） |
| 测试类型 | 源码级探针直调 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 43（另摄入使命 mission-001，9 行） |

> **执行方法**：43 批探针（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn mcp-server.mjs 驱动协议 + 真云 E2E（VPC/subnet/ECS/OBS/EIP 建删），结论落 `evidence/<case-id>/stdout.txt`；CLI 安装域用例隔离 `iso-home-20261019`（HOME+HERMES_HOME 双隔离）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 12 / 9 / 3 / 4` |
| 通过率（分母 = PASS+FAIL = 134，不含 BLOCKED/NOT_RUN/SPEC） | `91.0%` |
| 缺陷总数（FAIL + SPEC-MISMATCH） | `15`（11 FAIL 设计级 + 1 FAIL 展开级 + 3 SPEC） |
| P0 / P1 / P2 缺陷 | `4 / 6 / 5`（含 SPEC） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `归零（付费资源未创建，免费资源 VPC/subnet 已删并归零）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `80` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `9` | 环境阻塞（5 补环境-夹具/通道 + 4 补环境-真云余额不足） |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9/D9-9/D10-4） |
| NOT_RUN | `4` | 未执行（含 P0 Windows 专属 D1-39） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（与 D10-3 同根因，中文「云主机」未命中） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单

### 4.1 缺陷总览

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截不完整（generic access_key） | `safety-policy.mjs:515` | 待提单 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL broad IAM | `cloud-risk-rules.json:196` | 待提单 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线（版本检查缺失 + 非法时序未拒） | `mcp-protocol.mjs:32-50/57` | 待提单 |
| 4 | P1 | `D4-6` | D4安全 | adminPass 回显警告（hook_check_command 未告警） | `cloud-risk-rules.json:68` | 待提单 |
| 5 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open | `risk-rule-engine.mjs:106` | 待提单 |
| 6 | P1 | `D4-25` | D4安全 | Python hook 写操作遥测误分类 cli:invoke | `huaweicloud-safety.py:46` | 待提单 |
| 7 | P1 | `D10-3`/`EXP-E01` | D10评测 | 路由准确率 92.9%（中文「云主机」未命中 ECS） | `tools.mjs:1999-2012` | 待提单 |
| 8 | P1 | `D3-S7` | D3功能 | 复合意图部署目标未命中 + RDS 创建缺前置 | `tools.mjs:1999` | 待提单 |
| 9 | P2 | `D4-26` | D4安全 | findings.evidence JSON 引号 key 明文泄漏 | `risk-rule-engine.mjs:19` | 待提单 |
| 10 | P2 | `D3-S5` | D3功能 | 复合意图分层路由未分解 | `tools.mjs:1999` | 待提单 |
| 11 | P2 | `D3-S6` | D3功能 | FunctionGraph CreateFunction 最小参数未通过 | `CreateFunction` 参数集 | 待提单 |
| 12 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs:47-49` | 待提单 |
| 13 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏 AK/SK/token（SPEC） | `telemetry.mjs:189` | 待提单 |
| 14 | P0 | `D10-4` | D10评测 | 规则库 16→19 条（用例断言漂移，非安全回归，SPEC） | `cloud-risk-rules.json` | 待提单 |

> 完整缺陷（现象 / 唯一断言 / 根因 / 证据）见同目录 `FINDINGS.md`（本报告不逐个重复断言细节）。
> 非产品缺陷两则不计入提单：真云账号余额不足 BLOCKED（#15）与 realcloud-probe DMS/DEW 聚合服务断言缺口（#16），详见 FINDINGS.md。

### 4.2 本轮修复回执（对比 2026-10-18 `v1.1.9-next.1`）

| 用例 | 昨日 | 今日 | 说明 |
|---|---|---|---|
| D3-C3（沙箱部署 E2E） | FAIL | **PASS** | `deploy_nginx` 不再返回 `undefined:undefined`，现返回 `static:8088` |
| D3-S3（沙箱预览出 URL） | FAIL | **PASS** | s3 upload/deploy 链路通过，nginx serving PASS |

---

## 五、未执行用例与原因

### NOT_RUN（4）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10（disttags 探针）代表覆盖 |
| `D8-1` | 设计级 | P2 | NOT_RUN | 改用例 | 文档与能力一致需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | 设计级 | P1 | NOT_RUN | 改用例 | 引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | 设计级 | P2 | NOT_RUN | 改用例 | 中英文文档一致需中英双源逐段比对，本轮未覆盖 |

### BLOCKED（9）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 阻塞原因 |
|---|---|---|---|---|---|
| `D2-10` | 设计级 | P1 | BLOCKED | 补环境 | R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | 设计级 | P1 | BLOCKED | 补环境 | R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | 真机 CreateVpc/CreateSubnet 通过，但 CreateServers 返回 `Ecs.0067` 余额不足——ECS 按需计费资源无法创建（VPC/subnet 已归零） |
| `D3-C2` | 设计级 | P1 | BLOCKED | 补环境 | OBS 建桶返回 403 `UserRestricted`（账号受限/欠费），无法完成 OBS 静态站部署 E2E |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 跨区域引导 6/7 通过，但 CreatePublicip 未返回 publicipId（EIP 按需计费受余额限制），未创建出 EIP（归零 OK） |
| `D3-C13` | 设计级 | P1 | BLOCKED | 补环境 | OBS 静态网站托管建桶返回 403 `UserRestricted`（账号受限） |
| `D4-12` | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界需审批流 + 可注入时钟 |
| `D9-6` | 设计级 | P1 | BLOCKED | 调归属 | 跨客户端互通需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据复核：show_profile_redacted/realcloud/D4-13 均在脱敏管线内，无明文 AK/SK 落盘）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（真云只建删本次创建资源；免费资源 VPC/subnet 已删并归零；付费资源未创建无残留）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2/D4-14/D3-C1） | 是 | 已删 | `subnet:OK vpc:OK` / 确认后 DeleteVpc 归零 |
| Subnet（D3-C1） | 是 | 已删 | `subnet:OK` |
| ECS（D3-C1） | 否（`Ecs.0067` 余额不足） | — | 未创建无残留 |
| OBS 桶（D3-C2/D3-C13） | 否（403 UserRestricted） | — | 未创建无残留（404 删除幂等） |
| EIP（D3-C7） | 否（未取到 publicipId） | — | `ListEips 无本次 id` 未创建 |
| 沙箱会话/文件服务（D3-C3/D3-C6/D3-S3） | 是 | close_session 关闭 | 无残留 |

> 真云只删本次创建资源；免费资源 VPC/subnet 创建/删除/归零全通过；ECS/OBS/EIP 付费资源因账号余额不足未创建（无残留、无泄漏）。

---

## 八、遗留与建议

- 待裁决 SPEC 漂移：`D9-9`（cancellation 未声明）、`D8-9`（sanitizeValue 未脱敏敏感值）、`D10-4`（规则库 16→19 条用例计数滞后，需维护者确认 19 条为预期并修订用例）。
- 环境阻塞待解除：真云测试账号 `hw018619646` 余额不足/受限（`Ecs.0067` / `403 UserRestricted`）——需充值或解除受限后，D3-C1/D3-C2/D3-C7/D3-C13 补测。
- 测试侧改进：`realcloud-probe.mjs:79` 聚合服务断言未适配 DMS/DEW（见 FINDINGS #16）。
- 建议：KooCLI 本机版本 7.2.12 与插件配对 7.3.12 不一致（`version_mismatch`），建议 `npx huaweicloud-devkit install-hcloud` 对齐，减少黑盒 flaky。