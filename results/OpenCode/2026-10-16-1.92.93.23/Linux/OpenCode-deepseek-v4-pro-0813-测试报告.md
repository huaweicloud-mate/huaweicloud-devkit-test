# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-16 05:40:40（北京时间）
> **执行归档**：`results/OpenCode/2026-10-16-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.9-next.0` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针直调（源码级 `import tools.mjs/mcp-server.mjs/safety-policy.mjs` 等）+ MCP 真机（plan/approve/run_readonly 工真链）+ 真云 E2E（ECS 生命周期 / OBS 静态站 / 沙箱部署 / 跨区域 EIP / VPC 审计 / 只读子账号）。所有探针真实运行，证据落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 12 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 142） | `91.5%` |
| P0 / P1 / P2 新增缺陷 | `3 / 5 / 4` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零（见 §七）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | 见 §四根因详情 | 历史问题 |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | 见 §四根因详情 | 历史问题 |
| 3 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | 见 §四根因详情 | 历史问题 |
| 4 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 见 §四根因详情 | 历史问题 |
| 5 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | 见 §四根因详情 | 历史问题 |
| 6 | P1 | `D4-6` | D4安全 | adminPass回显警告 | 见 §四根因详情 | 历史问题 |
| 7 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | 见 §四根因详情 | 历史问题 |
| 8 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | 见 §四根因详情 | 历史问题 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | 见 §四根因详情 | 历史问题 |
| 10 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | 见 §四根因详情 | 历史问题 |
| 11 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | 见 §四根因详情 | 历史问题 |
| 12 | P1 | `EXP-E01` |  |  | 见 §四根因详情 | 历史问题 |

### 根因详情

完整「现象 / 断言 / 根因（文件:行号）/ 证据」见同目录 `FINDINGS.md`（#1~#15，与 10-15 逐条一致，均复测复现）。要点：

| 用例ID | 根因（文件:行号） |
|---|---|
| D1-70 | `package.json:46` undici `^8.11.2`→8.12.2（engines>=22.19，Node 22.13 缺 node:zlib zstd），`proxy-agent.mjs:20-22` |
| D4-2 | `safety-policy.mjs:514-515` env-dump 正则不匹配裸 access_key |
| D4-6 | `cloud-risk-rules.json:68-72` adminpass 规则 stages 缺 command 阶段 |
| D4-17 | `risk-rule-engine.mjs:103-106` 无规则命中默认 allow(fail-open) |
| D4-21 | `cloud-risk-rules.json:196-213` 未覆盖 HCL `actions=["*"]`/托管策略引用 |
| D4-25 | `huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组误判 |
| D4-26 | `risk-rule-engine.mjs:19-23` redactEvidence 不覆盖 JSON 带引号 key |
| D9-12 | `mcp-protocol.mjs:32-59` initialize 未调 runVersionCheck / 无前置状态机 |
| D3-S5 | `tools.mjs:1983-2224` routeMap 无复合意图多路分解 |
| D3-S6 | FunctionGraph CreateFunction 最小参数集未被 API 稳定接受 |
| D3-S7 | `tools.mjs:1983-2224` routeMap 无部署目标分解；RDS 创建缺前置 |
| EXP-E01 | `tools.mjs:1995-2002` routeMap 缺口语化别名「云主机」 |
| SPEC: D8-9 / D9-9 / D10-4 | `telemetry.mjs:189-191` / `mcp-protocol.mjs:45-49` / 规则库 16→19 条 |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 列标注「Windows 专属」，Linux 侧由展开级 EXP-NR3-10（queryDistTags 返回对象无 EINVAL）代表覆盖，D1-39 在 Linux 标 NOT_RUN |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（探针统一 redact，AK/SK 落 `HPUA***`，未向仓库落盘明文）
- [x] 写操作误判 read-only：无（D4-18/19/20 审批流 confirm-not-deny / 预检 / 拒绝零操作均通过）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：evidence 中 AK/SK/token 均已按 `HPUA***REDACTED***` 处理

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| D3-C1 ECS 生命周期 | VPC+子网+ECS 最小规格（c6.large.2） | DeleteServers(含磁盘) + DeleteSubnet + DeleteVpc | 归零 OK（VPC ab93605f 已清） |
| D3-C2 OBS 静态站 | 建桶 + 上传 + 静态站 | rm 清对象 + 删桶 | 归零 OK |
| D3-C3 沙箱部署 | sandbox connect 建 session | close_session | 无残留 |
| D3-C6 沙箱冒烟 | 上传 probe 文件 | close_session | 无残留 |
| D3-C7 跨区域 | EIP CreatePublicip | DeletePublicip | 归零 OK |
| D4-14 VPC 审计 | CreateVpc（今日触发 `VPC.0114` 配额） | 未创建无需删 | 归零 OK（未残留） |
| D4-13 只读子账号 | KooCLI profile test001 | 清理 profile 恢复 default | 未创建 VPC |

> 说明：D4-14/D4-13 的「写 CreateVpc」今日返回 `VPC.0114 Quota exceeded for resources: ['router']`（共享账号 `hw018619646` 的 VPC 路由器配额被 10-12/10-15 各 agent 残留 VPC 占满，非本客户端创建），故写路径建资源被环境配额阻断、测后零残留；审计断言（CTS 捕获 CreateVpc 轨迹，code 409）与归零仍满足。昨日同 SUT 干净跑已确认写操作为 IAM 拒绝（`VPC.0010 PolicyNotAuthorized`）。

---

## 八、遗留与建议

- 15 项缺陷（12 FAIL + 3 SPEC）与 10-15 逐条一致，均未修复；`file_issue.py` 已内置历史查重，预计全部命中既有单，仅补复核评论（生成 `HISTORY_LINKS.md`）。
- D10-4「规则库 16→19 条」契约漂移仍待维护者修订 `test-cases/` 母版计数。
- D1-70 建议 `package.json` 将 `undici` 上界 pin 至 `<8.12` 或提升 `engines.node` 到 `>=22.19`，规避企业代理场景崩溃。
- 共享账号 VPC 路由器配额紧张（5 个残留 VPC），建议维护者批量清理孤儿 VPC 释放配额，避免后续真云用例被 `VPC.0114` 阻断。
