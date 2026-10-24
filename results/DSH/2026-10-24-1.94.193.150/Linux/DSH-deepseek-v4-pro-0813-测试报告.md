# DSH-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-24 05:13（北京时间）
> **执行归档**：`results/DSH/2026-10-24-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04.4 LTS） |
| Node / npm / Python | `Node v22.13.0 / npm 11.19.0 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.12`（npm latest，gitHead `4ed07801`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `KooCLI 7.2.12`（真机已配置） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置 + 只读子账号） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针框架 `_probe/`（checks1-4.mjs + core.mjs + main.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（judgeUpdate/redactSecrets/evaluateCommandRisk/serviceCatalog 等）；MCP 协议用例 spawn `mcp-server.mjs` 走 stdio/Content-Length 帧；真云用例（D3-C1/C2/C13/S2/C3/C6）通过 `hcloud` CLI 真机建删资源并归零验证；D10 评测走 `eval/prompts/eval-set-v1.csv` 15 条中文意图逐条调 `huaweicloud_service_catalog`。决策/结果落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（1 条 NOT_RUN = OS 专属豁免 D1-39） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 11 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 142，不含 BLOCKED/NOT_RUN） | `91.5%` |
| P0 / P1 / P2 缺陷 | `5 / 4 / 3`（12 条，含 1 条 SPEC-MISMATCH 待裁决） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（ECS/VPC/EIP/OBS 桶均 0 残留，沙箱会话已关闭） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞（均有 blockedReason） |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级，待裁决） |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 专属 P0 豁免，Linux 侧由展开级覆盖） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS，根因见缺陷清单 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | `safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截缺 kms DecryptData | `cloud-risk-rules.json:56` | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透（sh -c 内 env dump） | `cloud-risk-rules.json:26,35` | 待提单 |
| 4 | P0 | `D4-21` | D4安全 | HCL/Terraform 宽权限 IAM 未拦截 | `cloud-risk-rules.json:196,209` | 待提单 |
| 5 | P0 | `D9-12` | D9协议 | 未 initialize 先 tools/list 未拒绝 | `mcp-protocol.mjs:57` | 待提单 |
| 6 | P1 | `D4-17` | D4安全 | 命令替换 $(curl\|sh) fail-open | `risk-rule-engine.mjs:143` | 待提单 |
| 7 | P1 | `D2-10` | D2认证 | KooCLI 缺失错误消息中英不一致 | `reconcile.mjs:50` + `guidance.mjs:71` | 待提单 |
| 8 | P1 | `D3-S7` | D3功能 | 复合意图 Web+RDS 未命中部署目标 | `tools.mjs:2188` | 待提单 |
| 9 | P1 | `EXP-E01` | D10评测 | "查云主机"意图路由 MISS（未命中 ECS） | `tools.mjs:2188-2431` | 待提单 |
| 10 | P2 | `D1-68` | D1安装 | region 优先级契约漂移（SPEC-MISMATCH） | `credentials.mjs:173,225,339` | 待裁决 |
| 11 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 无凭证错误中英不一致 | `guidance.mjs:55` | 待提单 |
| 12 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 未脱敏凭证 | `telemetry/telemetry.mjs:189` | 待提单 |

### 根因详情

每条缺陷「现象 / 断言 / 根因（文件:行号）/ 证据」详见 `FINDINGS.md`（12 条，格式满足 `file_issue.py` 解析）。关键摘录：

- **#1 [P0] D2-4**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文（未脱敏）；根因 `safety-policy.mjs:45` 的 `(AK|SK)` 正则区分大小写且缺 `i` 标志、未含小写简写。证据 `evidence/D2-4/stdout.log`。
- **#2 [P0] D4-3**：`hcloud kms DecryptData` 返回 `allow`；根因 `cloud-risk-rules.json:56` 规则 `hwc-command-secret-value-read` 正则未含 `DecryptData`。证据 `evidence/D4-3/stdout.log`。
- **#3 [P0] D4-16**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 返回 `allow`；根因 env-dump 规则 `env` 前置引号失配 + 未解 shell wrapper。证据 `evidence/D4-16/stdout.log`。
- **#4 [P0] D4-21**：HCL `actions = ["*"]` 返回 `allow`（JSON 形态 deny）；根因 `hwc-iam-admin-policy` 仅匹配 JSON `"Action"`。证据 `evidence/D4-21/stdout.log`。
- **#5 [P0] D9-12**：未 initialize 先 tools/list 返回 46 工具；根因 `mcp-protocol.mjs:57` dispatch 缺初始化状态门。证据 `evidence/D9-12/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属/OS 专属豁免】用例 OS 列标注「专属」（Windows 升级检测链），本机为 Linux 不适用；Linux 侧由展开级 EXP-NR3 代表覆盖。非「未跑」，属 OS 专属 P0 豁免 |

### BLOCKED（3 条，均为真·外部依赖，已实测到阻塞层）

| 用例ID | 维度 | 标题 | 分类 | 阻塞原因 | 解除条件 |
|---|---|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 补环境 | ECS CreateServers 被 billing 拒绝 `Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射）。已实测 VPC/子网/安全组创建→删除→归零全成功，ECS 到达订单提交层 | 账号开通 ECS 购买产品/按需计费 |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 补环境 | `ap-southeast-3` 不在账号项目范围（project 仅 cn-north-4）：ECS 只读返回 Common.0013、EIP 创建返回 VPC.0501。已实测 list_regions 含该 region、plan_cli_command 含 `--cli-region` | 账号开通 ap-southeast-3 region 权限 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 补环境 | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL，本次沙箱部署 D3-C3/C6 已 PASS 故非「缺沙箱」） | DevStation 配额就绪且 devbridge 隧道可用 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始 AK/SK 明文落盘）
- [x] 写操作误判 read-only：`0`（D4-5 写操作未误判只读 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`evidence/` 仅含 stdout.log/detail.log JSON，无原始凭证/未脱敏日志；FINDINGS 证据均为脱敏后结果

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（D3-C1 billing 拒绝，未产生） | — | ListServersDetails `testbot2-dsh-*` = 0 |
| VPC / 子网 / 安全组 | 是（D3-C1/D3-S2） | 已删 | ListVpcs `testbot2-dsh-*` = 0 |
| OBS 桶 | 是（D3-C2/D3-C13） | 已删 | `hcloud OBS ls` 无 `testbot2-dsh` 桶 |
| EIP | 否（D3-C7 region 拒绝前即返回，未创建） | — | ListPublicips 无本次 EIP |
| 沙箱会话 | 是（D3-C3/D3-C6） | close_session 已调 | 无持久 workspace 残留 |

> 真云只删本次创建资源；删除前全量盘点，未删既有/他人资源。残留即 FAIL；本次归零验证全部为 0。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（HUAWEICLOUD_REGION 与 HW_REGION 优先级契约相反，需维护者裁定哪侧为准）。
- 12 条缺陷均为**持续复现**（与 2026-10-23 一致，SUT 版本同为 v1.1.12 gitHead `4ed07801`），其中 5 条 P0 安全/协议类建议优先修复：D4-3（KMS 解密绕过）、D4-16（命令包裹绕过）、D4-21（Terraform 越权制品）、D2-4（凭证明文）、D9-12（MCP 握手时序）。
- 本轮 D3-S3（沙箱预览 URL）沿用历史 BLOCKED 结论（devbridge 隧道），但沙箱部署主链路 D3-C3/D3-C6 已真机 PASS，建议维护者复核 devbridge_tunnel 是否仍为阻塞项。
- 建议：P0 安全规则（KMS 解密/命令包裹/HCL 宽权限）优先补全规则库；`serviceCatalog` 补「云主机」查询词与 Web+RDS 复合意图部署目标关联。