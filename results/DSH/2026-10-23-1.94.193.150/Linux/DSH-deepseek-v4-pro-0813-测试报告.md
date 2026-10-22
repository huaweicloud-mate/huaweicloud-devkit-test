# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-23 05:13（北京时间）
> **执行归档**：`results/DSH/2026-10-23-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH`（testbot2-DSH）+ `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04.4 LTS，kernel 6.8.0-106） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.12`（npm latest，gitHead `4ed07801`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `KooCLI 7.2.12`（doctor 确认已配置） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（per-case `evidence/<case-id>/probe.mjs`）委托 `_probe/main.mjs` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结果落 `stdout.log`；MCP 协议用 stdio 子进程真实握手；真云 E2E（OBS/ECS/沙箱/跨区域）经 `hcloud` CLI 与沙箱 MCP 工具真机建删资源并归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 11 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `92.2%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 2`（另 SPEC-MISMATCH 1 项 P2） |
| 红线（I 类）违规 | `0`（未发生凭证泄漏/误删他人资源） |
| 资源释放 | `全部归零`（ECS 建删归零、OBS 建删归零、沙箱会话已关闭） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | OS 专属豁免（D1-39 Windows 专属） |
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

## 四、缺陷清单（详尽，每个缺陷一栏）

> 12 项缺陷（11 FAIL + 1 SPEC-MISMATCH），完整根因（文件:行号）与唯一断言详见 `FINDINGS.md`。历史查重结论见 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | `safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API（kms DecryptData）未拦截 | `safety/rules/cloud-risk-rules.json:47-56` | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透（sh -c "env \| grep HW_*"） | `safety/rules/cloud-risk-rules.json:26,35` | 待提单 |
| 4 | P0 | `D4-21` | D4安全 | HCL/Terraform 宽权限 IAM 制品未拦截 | `safety/rules/cloud-risk-rules.json:196,209` | 待提单 |
| 5 | P0 | `D9-12` | D9协议 | 未 initialize 先 tools/list 未拒绝（-32600） | `mcp-protocol.mjs:57` | 待提单 |
| 6 | P1 | `D4-17` | D4安全 | $(curl\|sh) fail-open 未拦截 | `risk-rule-engine.mjs:143` | 待提单 |
| 7 | P1 | `D2-10` | D2认证 | KooCLI 缺配置错误消息中英混排 | `auth/reconcile.mjs:50` + `auth/guidance.mjs:71` | 待提单 |
| 8 | P1 | `D3-S7` | D3功能 | 复合意图 Web+RDS 未命中部署目标 | `tools.mjs:2188` | 待提单 |
| 9 | P1 | `EXP-E01` | D10评测 | "查云主机"意图路由 MISS | `tools.mjs:2188-2431` | 待提单 |
| 10 | P2 | `D1-68` | D1安装 | region 优先级契约漂移（SPEC-MISMATCH） | `auth/credentials.mjs:173,225,339` | 待裁决 |
| 11 | P2 | `D3-C14` | D3功能 | HDKit 无凭证错误消息中英不一致 | `auth/guidance.mjs:55` | 待提单 |
| 12 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 未脱敏凭证 | `telemetry/telemetry.mjs:189` | 待提单 |

### 根因详情（摘录，完整见 FINDINGS.md）

- **#1 [P0] D2-4 凭证脱敏漏小写**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文，仅大写 `AK=/SK=` 被脱敏。根因 `safety-policy.mjs:45` 正则 `/(AK|SK)\s*[:=]/g` 未覆盖小写简写。
- **#2 [P0] D4-3 kms DecryptData 未拦截**：`evaluateCommandRisk('hcloud kms DecryptData ...')` 返回 `allow`。根因 `cloud-risk-rules.json:47-56` 规则正则仅含 ShowSecretVersion 等，未含 `DecryptData`。
- **#3 [P0] D4-16 命令包裹穿透**：外层 `sh -c "..."` 使 env-dump 正则（`(^|\s)env`）失配。根因 `cloud-risk-rules.json:26,35` + 无 shell-wrapper 解包。
- **#4 [P0] D4-21 HCL IAM 未拦截**：JSON 形态 deny、HCL 形态 allow。根因 `cloud-risk-rules.json:196,209` 仅匹配大写 `"Action"`。
- **#5 [P0] D9-12 协议非法时序未拒绝**：未握手 tools/list 返回 40+ 工具。根因 `mcp-protocol.mjs:57` 无 initialize 状态门。
- **#6 [P1] D4-17 $(curl|sh) fail-open**：`evaluateCommandRisk` 返回 allow。根因 `risk-rule-engine.mjs:143` 无 fail-closed 兜底。
- **#7 [P1] D2-10 错误消息中英混排**：`reconcile.mjs:50` 英文契约 + `guidance.mjs:71` 中文前缀拼接。
- **#8 [P1] D3-S7 复合意图仅命中 RDS**：`serviceCatalog()` 未关联 Web 部署载体（`tools.mjs:2188`）。
- **#9 [P1] EXP-E01 "查云主机" MISS**：serviceCatalog 未覆盖 ECS 查询词（`tools.mjs:2188-2431`）。
- **#10 [P2] D1-68 region 优先级漂移**：`HW_REGION` 排在 `HUAWEICLOUD_REGION` 前（`credentials.mjs:173,225,339`），与契约相反，SPEC-MISMATCH 待裁决。
- **#11 [P2] D3-C14 HDKit 错误消息**：`guidance.mjs:55` messageZh 仅中文，缺英文契约串。
- **#12 [P2] D8-9 sanitizeValue 未脱敏**：`telemetry.mjs:189` 无凭据脱敏逻辑。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

### NOT_RUN

| 用例ID | 维度 | 优先级 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D1-39` | D1安装 | P0 | 调归属 | Windows 专属用例（OS 列标注「专属」），本机为 Linux，不适用；Linux 侧由展开级 EXP-NR3 终端矩阵代表覆盖。 |

### BLOCKED

| 用例ID | 维度 | 优先级 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|
| `D3-C1` | D3功能 | P1 | 补环境 | ECS `CreateServers` 订单被 billing 拒绝 `Ecs.0707 "Can not find product"`（账号 BSS 无该镜像产品映射）。已实测 VPC/子网/安全组 创建→删除→归零 全成功，ECS 到达订单提交层。 | 账号开通 ECS 购买产品/按需计费 |
| `D3-C7` | D3功能 | P1 | 补环境 | 跨区 `ap-southeast-3` 不在项目范围（账号 project 仅 cn-north-4）：ECS 只读返回 `Common.0013`、EIP 创建返回 `VPC.0501`。已实测 `list_regions` 含该区、`plan_cli_command` 含 `--cli-region`。 | 账号开通 ap-southeast-3 项目/region 权限 |
| `D3-S3` | D3功能 | P1 | 补环境 | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL）。connect 已实测成功，仅取 URL 隧道不可用。 | 沙箱配额就绪且 devbridge 隧道可用 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无明文 AK/SK；脱敏复核通过）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：evidence 目录 stdout.log 均无原始凭证/未脱敏日志（真云探针输出去敏感）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 静态站（D3-C2） | 是（bucket testbot2-dsh-obs-*） | 已删（rm -r -f） | 是（ls 不含 bucket） |
| 沙箱会话（D3-C3/D3-C6） | 是（connect 会话） | 已 close_session | 是（会话关闭） |
| ECS/VPC/子网/安全组（D3-C1） | 部分（VPC/子网/SG 建后删；ECS 订单被拒未建） | 已删（finally 清理） | 是 |
| 跨区域 EIP（D3-C7） | 否（region 无权限，未建） | — | 是（未创建资源） |

> 真云只删本次创建资源；D3-C1/C3-C7 因外部配额/权限在真机层被拒前已触发 finally 归零，无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（HW_REGION vs HUAWEICLOUD_REGION 优先级契约漂移）。
- 本轮 BLOCKED（`D3-C1`/`D3-C7`/`D3-S3`）为真云外部依赖（billing 产品配额 / 多 region 权限 / 沙箱 DevStation 配额），补环境后可复测解锁。
- 建议：优先修复 5 项 P0 安全/协议缺陷（凭证脱敏、secret API、命令包裹、HCL IAM、MCP 时序门），均为确定性源码级缺陷，修复成本低。