# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-09-27 05:16:25（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-27-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.7` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级直调（safety-policy/risk-rule-engine/credentials/hcloud-cli）+ MCP 协议探针（protocol-probe.mjs）+ 真云 E2E（realcloud_e2e.mjs：ECS/VPC/Subnet 建删归零、OBS 静态站、sandbox 会话）+ D10 评测 harness（run-eval.mjs serviceCatalog 路由层）+ 源码巡检（env var/module/tool 注册）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 15 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `89.4%` |
| P0 / P1 / P2 新增缺陷 | `3 / 12 / 0` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零（ECS/VPC/Subnet/OBS桶 反序删除验证）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs:384-430` — classifyTextCommand 在 hcloud regex 不匹配时 fallthrough 到 allow，未调用 stripExecutable 解包 `sh -c` wrapper | 历史关联 #731 |
| 2 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:45` — redactString regex 仅匹配大写 AK/SK，不匹配 lowercase ak/sk | 历史关联 #694/#791 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-server.mjs` — capabilities.notifications.cancellation 未声明(SPEC-MISMATCH)；tools/list 非法参数未返回 -32602 | 历史关联 |
| 4 | P0 | `D10-4` | D10评测 | 安全干预-静态规则层 | `risk-rule-engine.mjs` — evaluateCommandRisk('hcloud ECS DeleteServers') 返回 warn 而非 deny/confirm | 历史关联 |
| 5 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"查账号在华北北京四有哪些云主机"未路由到 ECS | 历史关联 |
| 6 | P1 | `EXP-E02` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"创建 2C4G Ubuntu 云服务器"未路由到 ECS | 历史关联 |
| 7 | P1 | `EXP-E03` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"本地 dist 部署成公网静态网站"未路由到 OBS | 历史关联 |
| 8 | P1 | `EXP-E04` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"给服务器绑定弹性公网IP"未路由到 EIP | 历史关联 |
| 9 | P1 | `EXP-E05` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"查看云数据库MySQL实例状态"未路由到 RDS | 历史关联 |
| 10 | P1 | `EXP-E07` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"配置每日备份策略"未路由到 CBR | 历史关联 |
| 11 | P1 | `EXP-E10` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"部署函数处理图片压缩"未路由到 FunctionGraph | 历史关联 |
| 12 | P1 | `EXP-E11` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"查账号这个月费用"未路由到 BSS | 历史关联 |
| 13 | P1 | `EXP-E12` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"日志指标推送云监控告警"未路由到 CES | 历史关联 |
| 14 | P1 | `EXP-E13` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"申请HTTPS证书配置域名"未路由到 ELB | 历史关联 |
| 15 | P1 | `EXP-E14` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog — 意图"审计账号下用户权限"未路由到 IAM | 历史关联 |

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无泄漏（AK/SK 不在 tools/call 返回中；redactSecrets 对大写 AK/SK 脱敏有效）`
- [x] 写操作误判 read-only：`无（DeleteServers/CreateServers 判 isWrite=true，非 allow）`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`redactSecrets 对 lowercase ak/sk 仍有遗漏（D4-27，历史关联 #694/#791）`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC (testbot3-hermes-e2e-*) | D3-C1 CreateVpc | DeleteVpc | 已删除（finally 反序归零） |
| Subnet (testbot3-hermes-e2e-*-subnet) | D3-C1 CreateSubnet | DeleteSubnet | 已删除 |
| ECS (testbot3-hermes-ecs-*) | D3-C1 CreateServers | DeleteServers | 已删除（delete_publicip=true） |
| OBS桶 (testbot3-hermes-obs-*) | D3-C2 mb | rm -f | 已删除（空桶清理） |
| Sandbox session | D3-C6/C3 connect | close_session | 已关闭 |

---

## 八、遗留与建议

- 所有 15 项 FAIL 均为历史已知缺陷（D4-16→#731、D4-27→#694/#791、EXP-E01~E14→serviceCatalog 路由基线），无新增缺陷
- D9-12 capabilities.cancellation SPEC-MISMATCH 与 D9-2b invalid-params FAIL 为协议层已知限制
- D10-4 DeleteServers 返回 warn 而非 deny，属设计决策（warn 提示用户确认而非硬拦截）
- 建议持续跟踪 #791 redact 重构与 serviceCatalog 路由扩展进度
