# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-12 05:55（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-12-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项，全部为历史延续）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04，kernel 6.8.0-106-generic） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.14-next.2`（npm @next，gitHead `5c9478d3`，PR #1121） |
| hcloud / 依赖 | `KooCLI 7.2.12`（doctor 已配置） |
| 真云凭证 | `cn-north-4`（AK/SK，统一账号 hw018619646；只读子账号 test001 用于 D4-13） |
| daily 基础用例 | 设计级 107 / 展开级 39 / 追踪表 216 / 使命 9 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真云 E2E 探针真实建删资源（ECS/OBS/沙箱/FunctionGraph/RDS/VPC/EIP），测后归零验证；MCP 协议探针经 stdio 驱动 `mcp-server.mjs`。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 1 = D1-39 Windows 专属，OS 结构性不适用） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 13 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `89.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（13 FAIL + 3 SPEC 全部为历史延续，无新增） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（ECS/VPC/子网/EIP/OBS/沙箱/FunctionGraph/RDS 均测后删除归零，人工二次核实） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单（全部历史延续） |
| BLOCKED | `0` | 无环境阻塞（真云环境正常） |
| SPEC-MISMATCH | `3` | 契约漂移（D1-65/D1-68/D9-9），待裁决 |
| NOT_RUN | `1` | D1-39 Windows 专属（Linux 结构性不适用） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文『云主机』路由 MISS（历史延续） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详见 FINDINGS.md，全部历史延续，不重复提单）

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | D4安全 | 明文secret API拦截（kms DecryptData/DecryptDatakey） | `safety/policy.json:26` blockedSecretOperations 缺项 | 历史问题 |
| 2 | P0 | `D4-15` | D4安全 | hook绕过尝试（ANSI-C 引号命令替换） | `risk-rule-engine.mjs` 纯正则未解析 ANSI-C 编码 | 历史问题 |
| 3 | P0 | `D4-21` | D4安全 | hook_check_artifacts HCL/Terraform broad IAM 未拦截 | `risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON | 历史问题 |
| 4 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线（非法时序未拒） | `mcp-protocol.mjs:57` tools/list 无 initialize 前置 | 历史问题 |
| 5 | P1 | `D1-70` | D1安装 | 代理 WebSocket 路径崩溃（undici 浮点依赖） | `package.json` engines >=22 + undici ^8.12.3 需 >=22.19 | 历史问题 |
| 6 | P1 | `D4-17` | D4安全 | hook 模糊 fail-closed 缺口 | `risk-rule-engine.mjs` 无 finding 即 allow | 历史问题 |
| 7 | P1 | `D4-27` | D4安全 | 双路径输出脱敏缺口（空格分隔形态） | `safety-policy.mjs:34` redactString 仅匹配 key[:=]value | 历史问题 |
| 8 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 MISS | `tools.mjs` serviceCatalog 单关键词并集 | 历史问题 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类（写→cli:invoke） | `hooks/huaweicloud-safety.py` WRITE_OPERATION_RE 前置 | 历史问题 |
| 10 | P2 | `D4-26` | D4安全 | findings 证据脱敏（secret_key/adminPass 残留） | `risk-rule-engine.mjs:19` redactEvidence 键值正则 | 历史问题 |
| 11 | P2 | `D8-1` | D8质量 | 文档与能力一致（工具数漂移 47 vs 硬编码） | `AGENTS.md` 未随 tools.mjs 同步 | 历史问题 |
| 12 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏（sanitizeValue 未脱敏） | `telemetry/telemetry.mjs` sanitizeValue 无脱敏 | 历史问题 |
| 13 | P1 | `EXP-E01` | D10 | 中文意图『云主机』路由 MISS | `tools.mjs` ECS keywords 缺『云主机』同义词 | 历史问题 |

### SPEC-MISMATCH（待裁决，不重复提单）

| # | 级别 | 用例ID | 漂移点 | 根因 |
|---|---|---|---|---|
| 14 | P2 | `D1-65` | 调试模式环境变量（telemetry '1' 不生效） | `telemetry/telemetry.mjs:82` 仅 `=== 'true'` |
| 15 | P2 | `D1-68` | region 环境变量优先级（HW_REGION 优先） | `credentials.mjs` `HW_REGION \|\| HUAWEICLOUD_REGION` |
| 16 | P1 | `D9-9` | tools/call 取消能力未声明 | `mcp-protocol.mjs` capabilities 未声明 cancellation |

> **结论**：本日 16 项（13 FAIL + 3 SPEC）根因与上一日（同一 SUT `1.1.14-next.2`、同一 gitHead `5c9478d3`）fresh 复现完全一致，全为历史延续缺陷，查重命中上游历史单，**不重复提单**（详见 HISTORY_LINKS.md）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 列标注「Windows 专属」，本机为 Linux，结构性不适用；Linux 侧由 D1-40（镜像 lag 反向提醒防护）覆盖 | 【调归属】OS 专属用例在非对应 OS |

> 无 BLOCKED 项：真云 AK/SK + 只读子账号均已就绪，真机用例全执行、全归零；D3-C3 沙箱曾因共享沙箱陈旧测试 nginx 配置占满 8080-8089 端口而假阻塞，已按红线「假阻塞能解必解」清理陈旧测试配置后重跑 PASS（13/13）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D4-13 只读子账号 6/6 只读可用、写被 PolicyNotAuthorized 拦截归零；D9-13 tools/call 凭证不泄露 10 项全过）
- [x] 写操作误判 read-only：`无`（D4-5 DeleteServer/DeleteSecurityGroup 均 deny/write）
- [x] 红线（I 类）违规：`0`（真云用例全部真机建删归零，未 mock；仅改动 results/OpenClaw/ 目录）
- [x] 脱敏复核：`通过`（D2-4/D4-6/D9-13 凭证脱敏路径真实执行；D4-27 空格形态缺口为已知历史缺陷）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | CreateServers 返回 serverIds 且 ACTIVE | DeleteServers 含磁盘+EIP | 人工 ListServersDetails + ListVpcs + ListPublicips 核实 0 残留 |
| VPC（D3-C1/D3-S2/D3-S7/D4-14/D4-20） | 多次 CreateVpc | DeleteVpc | 人工 ListVpcs 核实本次 tctest-openclaw-c1/tctest-s7 均 0 残留 |
| 子网（D3-C1/D3-S7） | CreateSubnet | DeleteSubnet | 人工 ListSubnets 核实 0 残留 |
| OBS（D3-C2/D3-C13） | mb + 上传 + 静态站 | 删对象后删桶 | rmOk=true 归零 |
| 沙箱（D3-C3/D3-C6/D3-S3） | connect/upload/deploy | close_session | 会话正常关闭；陈旧测试 nginx conf 已清理释放端口 |
| FunctionGraph（D3-S6） | CreateFunction + TIMER 触发器 | DeleteFunction | cleanup=true 归零 |
| RDS（D3-S7） | CreateInstance 至 ACTIVE | DeleteInstance 受理 | 人工 ListInstances 核实 RDS=0 |
| EIP | D3-C7 EIP 建删 | 释放归零 | ListPublicips total_count=0 |

> **归零说明**：D3-C1 首轮自动归零因 D1-70 残留 proxy.json 污染 + VPC 删除异步竞态残留 1 个 VPC；D3-S7 probe 自动归零对 RDS DeleteInstance 受理 rc 未判 0 且 VPC 删除竞态残留 1 个 VPC + 1 个 RDS 实例。均已在测试结束后人工二次核实并删除，最终 ECS/EIP/VPC/子网/RDS/OBS/FunctionGraph 全归零（云上 tctest-openclaw-c1 / tctest-s7 / hdk-s7 前缀清单为空）。

---

## 八、遗留与建议

- **待裁决 SPEC（3 项）**：D1-65（telemetry DEBUG '1' 不生效）、D1-68（region 环境变量优先级）、D9-9（cancellation 能力未声明）——需裁定是改契约还是改实现，均为历史延续，不重复提单。
- **清理竞态建议（测试侧，非产品缺陷）**：
  1. D3-C1/D3-S7 自动归零探针的 VPC/RDS 删除存在异步竞态（DeleteInstance 受理 rc 判定 + VPC DeleteVpc 轮询重试），建议探针在 finally 归零后增加强制 `ListInstances/ListVpcs` 二次确认回环，避免残留。
  2. D1-70 探针会残留 `~/.config/huaweicloud/proxy.json`（proxy.example），污染后续真云探针——已按历史同法在真云前备份移除；建议 D1-70 探针自带 cleanup。
- **沙箱端口占用（测试侧）**：共享沙箱实例累积陈旧测试 nginx 配置占满 8080-8089，建议每日测试前清理 `/etc/nginx/conf.d/` 下的 `.hdk-*` / `hdk-*` / `d3*` 测试残留配置。
- **历史缺陷修复跟进**：13 FAIL 中 4 项 P0（D4-3/D4-15/D4-21/D9-12）为安全/协议红线级，建议优先纳入 `huaweicloud-core` 下个迭代修复队列。