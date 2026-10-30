# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-31 05:16（北京时间）
> **执行归档**：`results/DSH/2026-10-31-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 6.8.0-106-generic） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `huaweicloud-devkit v1.1.13-next.0`（npm @next，gitHead `47170d1f`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `KooCLI 7.2.12`（真云凭证 cn-north-4） |
| 真云凭证 | `cn-north-4（AK/SK 已配置；只读子账号 test001 供 D4-13）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（`classifyTextCommand`/`evaluateCommandRisk`/`judgeUpdate`/`redactSecrets`/`serviceCatalog`/`risk-rule-engine` 等），决策与结果落 `stdout.log`；CLI 真机执行（check_cli/doctor/status）；MCP 协议生命周期与 46 工具枚举；真云 E2E（OBS 建站/ECS/VPC 建删）经 `hcloud` 真机执行。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（1 条 OS 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 11 / 5 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `92.1%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 2`（另有 1 条 SPEC-MISMATCH D1-68） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（OBS 桶 2 个建后删除；D3-C1 VPC/子网/安全组建后删除；ECS 0 / EIP 0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞（billing 产品、沙箱维护、跨 region 权限等） |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | Windows 专属用例 D1-39 在 Linux 不适用 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期（EXP-E01 服务目录路由 MISS） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `cloud-risk-rules.json:35` hwc-command-env-dump 正则仅匹配行首/空白后 `env`，漏 `sh -c "env"` | 历史 #1055 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `cloud-risk-rules.json:47` hwc-command-secret-value-read 正则漏 `DecryptData` | 历史 #1055 |
| 3 | P0 | `D4-21` | D4安全 | HCL broad IAM 制品未拦截 | `cloud-risk-rules.json:196` hwc-iam-admin-policy 面向 JSON IAM 语法，未覆盖 HCL `actions=["*"]` | 历史 #1055 |
| 4 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | `safety-policy.mjs:45` 第三段 replace 缺 `i` 标志，小写 `ak=`/`sk=` 未脱敏 | 历史 #1055 |
| 5 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs:61-62` `tools/list` 无 `_initialized` 前置校验 | 历史 #1055 |
| 6 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `risk-rule-engine.mjs:106` 无规则命中默认 `allow`（fail-open） | 历史 #1055 |
| 7 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付并归零 | `tools.mjs:2195` `serviceCatalog()` 复合意图未并集部署类服务组 | 历史 #1055 |
| 8 | P1 | `D2-10` | D2认证 | R7 current档跟随 | `auth/reconcile.mjs:50` 报错拼接 `guidance.mjs:71` 中文指引，破坏精确串契约 | 历史 #1055 |
| 9 | P1 | `EXP-E01` | 展开级(D10) | 服务目录路由「云主机」意图 | `tools.mjs:2195/2450` ECS 关键词表缺「云主机」，回退 `Run hcloud --help` | 历史 #1055 |
| 10 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:190-197` `sanitizeValue()` 未调用 `redactSecrets` | 历史 #1055 |
| 11 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | `auth/service.mjs:134` / `auth/guidance.mjs:55` 返回中文指引，非英文契约码 | 历史 #1055 |
| 12 | P2 | `D1-68` | D1安装 | region 环境变量优先级 | `auth/credentials.mjs:225` `HW_REGION` 优先于 `HUAWEICLOUD_REGION`（SPEC-MISMATCH） | 待裁决 |

### 根因详情

- **D2-4**：期望小写 `ak=`/`sk=` 也被脱敏；实测 `redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文。根因 `safety-policy.mjs:45`（第三段 replace 缺 `i`）。
- **D4-16 / D4-3 / D4-17 / D4-21**：安全规则库覆盖缺口（env-dump 正则漏 `sh -c "env"`、secret-read 漏 `DecryptData`、无命令替换 `$(...)` 规则、HCL broad IAM 缺覆盖），配合 `risk-rule-engine.mjs:106` 的 fail-open 兜底放行为 `allow`。
- **D9-12**：MCP 未 initialize 先 tools/list 返回全量 40+ 工具，`mcp-protocol.mjs:61-62` 无握手前置。
- **D3-S7 / EXP-E01**：`serviceCatalog()` 关键词覆盖不足（复合意图丢部署目标 / ECS 缺「云主机」）。
- **D2-10 / D3-C14**：错误文案混入中文指引，破坏「精确串」契约。
- **D8-9**：`telemetry.mjs` `sanitizeValue()` 仅做换行/长度处理，未调用 `redactSecrets`。
- 证据均见对应 `evidence/<case-id>/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 列标注「专属」的 Windows 用例，本机为 Linux，不适用；Linux 侧由展开级终端矩阵（EXP-NR3-x）代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/按需计费 | 补环境·billing 产品配额 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)——connect 即返回「沙箱功能正在升级优化，暂时无法使用」。解除条件：沙箱服务维护结束 | 补环境·沙箱服务维护 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，7 个隐式工具无法执行。解除条件：沙箱服务维护结束 | 补环境·沙箱服务维护 |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013、EIP 创建返回 VPC.0501。已实测 list_regions 含 ap-southeast-3=true、plan_cli_command 含 --cli-region=true。解除条件：账号开通 ap-southeast-3 项目/region 权限 | 补环境·真云多 region 权限 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL） | 补环境·DevStation 配额 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D4-n 攻击输入均为测试构造值 AK123/SKsecret，非真实凭证）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（D4-3/D4-16/D4-17/D4-21 为 risk-rule-engine 规则覆盖缺口导致 allow，属产品缺陷，非测试侧红线违反）
- [x] 脱敏复核：`证据目录 stdout.log 无真实 AK/SK 明文`（D4-26 findings.evidence 已脱敏、D4-27 双路径脱敏通过）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 静态站） | 是 | 已删 | `del=true` + `curl 404`，归零验证通过 |
| OBS 桶（D3-C13 静态网站 get/set） | 是 | 已删 | `get/set` 后已归零 |
| VPC + 子网 + 安全组（D3-C1） | 是 | 已删 | probe 创建→删除→归零全部成功 |
| ECS（D3-C1） | 否（billing 拒绝 Ecs.0707） | N/A | 未创建实例，无残留 |
| EIP | 否 | N/A | `ListPublicips total_count=0` |

> 残留核对（2026-10-31 实测）：ECS `ListServersDetails count=0`；EIP `total_count=0`；本次建桶均已删除。真云只删本次创建资源，未删既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68` region 环境变量优先级与契约漂移（`HUAWEICLOUD_REGION` vs `HW_REGION` 优先序）。
- 本轮未覆盖（说明范围）：D3-C3/D3-C6/D3-S3（沙箱服务维护/DevStation 配额）、D3-C1 ECS（billing 产品未开通）、D3-C7 跨 region（账号无 ap-southeast-3 项目）。
- 建议：安全规则库（`cloud-risk-rules.json`）对 `sh -c "env"`、`DecryptData`、命令替换 `$(...)`、HCL broad IAM 补规则覆盖，并审视 `risk-rule-engine` fail-open 兜底；`serviceCatalog` 补 ECS「云主机」等中文关键词；遥测 `sanitizeValue` 接 `redactSecrets`。