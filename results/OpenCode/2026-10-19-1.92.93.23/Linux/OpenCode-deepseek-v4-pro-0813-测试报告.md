# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-19 05:30（北京时间）
> **执行归档**：`results/OpenCode/2026-10-19-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项；另有 4 项真云用例因账号冻结 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.9`（npm latest 正式版，gitHead `05a67b6`，PR #950） |
| 真云凭证 | `cn-north-4（主账号 hw018619646 + 只读子账号 test001）` |
| daily 基础用例 | 设计级 107 / 展开级 39（合计 146） |

> **执行方法**：探针直调（源码级 `import tools.mjs/mcp-server.mjs/safety-policy.mjs` 等）+ MCP 真机（plan/approve/run_readonly 工具链）+ 真云 E2E（ECS 生命周期 / OBS 静态站 / 沙箱部署 / 跨区域 EIP / VPC 审计 / 只读子账号）。所有探针本轮真实运行，证据落 `evidence/<case-id>/stdout.log`。
>
> **⚠️ 关键环境变化**：共享账号 hw018619646 自 10-17 后余额不足且被冻结——ECS 建机返回 `Ecs.0067 insufficient balance`、EIP 返回 `VPC.0502 op_restricted`、OBS 建桶返回 `403 UserRestricted`。4 项真云写操作用例（D3-C1/D3-C2/D3-C13/D3-C7）据实标 BLOCKED（非产品缺陷），其余只读/免费资源类真云用例仍真机通过。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 1 = OS 专属 D1-39） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 12 / 4 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 141） | `89.4%` |
| P0/P1/P2 缺陷（FAIL+SPEC，不含 BLOCKED） | `4 / 6 / 5` |
| 真云 BLOCKED（账号冻结） | `4`（D3-C1/D3-C2/D3-C13/D3-C7） |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零（见 §七）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `88` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `4` | 真云账号冻结（D3-C1/D3-C2/D3-C13/D3-C7） |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9/D9-9/D10-4） |
| NOT_RUN | `1` | D1-39 Windows 专属 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（云主机未命中），根因见缺陷清单 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic access_key | `safety-policy.mjs:514-515` | 历史问题 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL broad IAM 制品 | `cloud-risk-rules.json:196-213` | 历史问题 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线两处缺口 | `mcp-protocol.mjs:32-59` | 历史问题 |
| 4 | P0 | `D10-4` | D10评测 | 安全规则库 16→19 条（用例断言契约漂移） | 规则库 16→19 条 | 历史问题 |
| 5 | P1 | `D4-6` | D4安全 | hook_check_command 对 --admin-pass 命令不告警 | `cloud-risk-rules.json:68-72` | 历史问题 |
| 6 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open（默认放行） | `risk-rule-engine.mjs:103-106` | 历史问题 |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务交付（Web 应用+RDS）复合意图部署目标未命中 | `tools.mjs:1983-2224` | 历史问题 |
| 8 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未声明（契约漂移） | `mcp-protocol.mjs:45-49` | 历史问题 |
| 9 | P1 | `D1-70` | D1安装 | 代理配置后 ProxyAgent/WebSocket 代理崩溃 | `package.json` undici 浮点依赖 | 历史问题 |
| 10 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图「云主机」未命中 | `tools.mjs:1995-2002` | 历史问题 |
| 11 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由未分解 | `tools.mjs:1983-2224` | 历史问题 |
| 12 | P2 | `D3-S6` | D3功能 | FunctionGraph 定时任务 CreateFunction 最小参数校验失败 | CreateFunction 最小参数集不被接受 | 历史问题 |
| 13 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类 cli:invoke | `huaweicloud-safety.py:46` | 历史问题 |
| 14 | P2 | `D4-26` | D4安全 | findings.evidence 脱敏未覆盖 JSON 带引号 key | `risk-rule-engine.mjs:19-23` | 历史问题 |
| 15 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏 AK/SK/token（契约漂移） | `telemetry.mjs:189-191` | 历史问题 |

### 根因详情

完整「现象 / 断言 / 根因（文件:行号）/ 证据」见同目录 `FINDINGS.md`（#1~#15 产品缺陷，#16~#19 环境阻塞）。本轮 v1.1.9（stable）新鲜复测，15 项产品缺陷与 10-17（v1.1.9-next.0）逐条一致、均未修复，仅有 D3-S6 的 API 报错参数从 `code.zip_file` 变为 `code.filename`（同根因：CreateFunction 最小参数集缺失）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注「Windows 专属」，Linux 侧由展开级 NR3-10 代表覆盖（`queryDistTags` 返回对象无 EINVAL 异常，已在本轮 disttags.log 验证），非本 OS 用例 |

### BLOCKED（真云账号冻结，非产品缺陷）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | 真机执行 CreateServers 返回 `Ecs.0067 "insufficient balance"`（账号余额不足）；VPC/子网建删归零成功，仅 ECS 创建被阻断；解除条件=账号充值 |
| `D3-C2` | 设计级 | P1 | BLOCKED | 补环境 | 真机执行 `hcloud OBS mb` 返回 `403 UserRestricted`（账号受限）；OBS 静态站全链路阻断；解除条件=账号解除 OBS 受限 |
| `D3-C13` | 设计级 | P1 | BLOCKED | 补环境 | 真机执行 `hcloud OBS mb` 返回 `403 UserRestricted`；`obs_set_website_config` 因桶不存在返回 `404 NoSuchBucket`；解除条件=账号解除 OBS 受限 |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 真机执行 `CreatePublicip` 返回 `VPC.0502 "Tenant status is op_restricted"`（账号冻结）；region/readonly/plan 断言均 PASS，仅 EIP 建删阻断；解除条件=账号解冻 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（探针统一 redact，AK/SK 落 `HPUA***REDACTED***`，未向仓库落盘明文）
- [x] 写操作误判 read-only：无（D4-18/19/20 审批流 confirm-not-deny / 预检 / 拒绝零操作均通过）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：evidence 中 AK/SK/token 均已按 `HPUA***REDACTED***` 处理
- [x] 真机凭证：主账号 + 只读子账号 test001（D4-13 实测最小权限：只读 6/6 可用（CES regex 误判实为 code=0）、写 CreateVpc 被拒、residualZero=true）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| D3-S2 删VPC确认 | CreateVpc（tctest-opencode-s2-*） | plan 确认后 DeleteVpc | 归零 OK |
| D3-C1 ECS 生命周期 | VPC+子网（CreateVpc/CreateSubnet） | ECS 建机被 Ecs.0067 阻断，VPC+子网删净 | 归零 OK（ECS count=0） |
| D3-C2 OBS 静态站 | OBS mb 被 403 阻断（未建成） | 无残留 | 归零 OK（无本次桶） |
| D3-C13 OBS 托管 | OBS mb 被 403 阻断（未建成） | 无残留 | 归零 OK |
| D3-C7 跨区域 EIP | CreatePublicip 被 VPC.0502 阻断（未建成） | 无残留 | 归零 OK（无本次 EIP） |
| D3-C3 沙箱部署 | sandbox connect 建 session | close_session | 无残留 |
| D3-C6 沙箱冒烟 | 上传 probe 文件 | close_session | 无残留 |
| D4-14 VPC 审计 | CreateVpc（tctest-opencode-20261006-*） | DeleteVpc | 归零 OK（ListVpcs 不含本次资源） |
| D4-13 只读子账号 | KooCLI profile test001 | 清理 profile 恢复 default | 未创建资源（写被 IAM 拒，residualZero=true） |

> 说明：本轮主账号 hw018619646 **余额不足/被冻结**（ECS `Ecs.0067`、EIP `VPC.0502`、OBS `403 UserRestricted`），4 项真云写操作用例据实标 BLOCKED（已真机尝试、证据落盘、无残留）。免费/只读类真云用例（VPC 建删、沙箱、只读查询、审批流、最小权限）仍全部真机通过。所有本客户端创建的资源均已归零。

---

## 八、遗留与建议

- 15 项产品缺陷（12 FAIL + 3 SPEC）与 10-17 逐条一致，均未修复；`file_issue.py` 已内置历史查重，预计全部命中既有单（生成 `HISTORY_LINKS.md` 并补复核评论），不重复开新单。
- **【高优先级·账号】共享账号 hw018619646 已于 10-17 后余额不足/被冻结**，直接影响真云写操作类用例（ECS/OBS/EIP）执行。建议维护者立即充值/解冻，否则后续所有客户端的真云 E2E 写操作用例将持续 BLOCKED。
- D10-4「规则库 16→19 条」契约漂移仍待维护者修订 `test-cases/` 母版计数。
- D1-70 建议 `package.json` 将 `undici` 上界 pin 至 `<8.12` 或提升 `engines.node` 到 `>=22.19`，规避企业代理场景崩溃（本轮以真实安装包 8.12.2 复现确认）。