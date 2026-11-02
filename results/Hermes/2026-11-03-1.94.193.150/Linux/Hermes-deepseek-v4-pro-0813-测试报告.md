# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-03 05:26（北京时间）
> **执行归档**：`results/Hermes/2026-11-03-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项；15 项缺陷均历史复现，无新增）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64 ECS） |
| 被测版本（SUT） | `1.1.13-next.0`（gitHead `47170d1f`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：`run_all.sh` 编排 43 批探针——源码直调（classify/hook/auth/protocol/extended/d1 安装域/updatecheck/disttags/merge/routing/supplement/new-*）；spawn `mcp-server.mjs` 驱动 MCP 协议（D5/D8/D9）；真云 E2E 建删资源（realcloud-probe 的 D2-1/D3-C4/D4-14/D4-18/19/20、D4-13 只读子账号、D4-23 mdc 注入、D3-C1~C7）。证据逐用例落 `evidence/<case-id>/stdout.txt`，执行状态回填三份 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 13 / 8 / 3 / 4` |
| 通过率（分母 = PASS+FAIL = 135） | `90.4%` |
| P0 / P1 / P2 缺陷 | `3 / 6 / 6`（FAIL 12 + SPEC 3） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `真云资源已全部归零（ECS/VPC/subnet/OBS/EIP）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `80` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `8` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行（OS 专属 1 + 文档级 3） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（与 D10-3 同根因） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单

完整根因（文件:行号）+ 断言 + 证据见同目录 `FINDINGS.md`（15 项）。下表为概览：

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） |
|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `safety-policy.mjs:550` |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL broad IAM | `cloud-risk-rules.json:196` |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线两处缺口 | `mcp-protocol.mjs:34-42,61` |
| 4 | P1 | `D1-70` | D1安装 | 代理 WebSocket 崩溃（undici 缺 node zstd） | `proxy-agent.mjs:20-22` |
| 5 | P1 | `D4-6` | D4安全 | `--admin-pass` 不告警 + JSON key adminPass 未脱敏 | `cloud-risk-rules.json:68` |
| 6 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open | `risk-rule-engine.mjs:106` |
| 7 | P1 | `D3-S7` | D3功能 | 复合意图部署目标未命中 + CreateInstance 缺前置 | `tools.mjs` |
| 8 | P1 | `D10-3` | D10评测 | 「云主机」意图路由 MISS（92.9%） | `tools.mjs:2197` |
| 9 | P1 | `EXP-E01` | D10评测 | 同上（展开级代表，同 D10-3 根因） | `tools.mjs:2197` |
| 10 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单一服务 | `tools.mjs` |
| 11 | P2 | `D3-S6` | D3功能 | FunctionGraph 定时任务创建失败 | `tools.mjs`（FUNCTION_OPS 装配） |
| 12 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类 cli:invoke | `huaweicloud-safety.py:46` |
| 13 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（明文 secret 残留） | `risk-rule-engine.mjs:22` |
| 14 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏（SPEC） | `telemetry.mjs:190` |
| 15 | P2 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs` |
| 16 | P2 | `D10-4` | D10评测 | 风险规则库 16→19 条断言漂移（SPEC） | `cloud-risk-rules.json` |

> 合计 16 行中，SPEC 3 项为「契约漂移」（实现正确，需维护用例母版），产品缺陷 13 项（FAIL 12 设计级 + EXP-E01 1 展开级）。15 项与 2026-11-02（同 gitHead）结论完全一致，无新增缺陷。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10（disttags 探针）代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 【改用例】需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 【改用例】需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | D8质量 | 中英文文档一致 | 【改用例】需中英双源逐段比对，本轮未覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因（解除条件） |
|---|---|---|---|
| `D2-10` | D2认证 | R7 current档跟随 | 【补环境】需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | D2认证 | R9 configuredBySession优先env | 【补环境】需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D3-C3` | D3功能 | 沙箱部署E2E | 【补环境】沙箱维护中（HDKIT_SANDBOX_MAINTENANCE）；解除=华为云沙箱维护完成 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 【补环境】沙箱维护中；解除=华为云沙箱维护完成 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 【补环境】沙箱维护中；解除=华为云沙箱维护完成 |
| `D4-12` | D4安全 | 供应链安装期安全 | 【补环境】需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界 | 【补环境】需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 【调归属】需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。本轮 AK/SK/adminPass 均未明文落盘；D4-26/D4-6/D8-9 为「产品未脱敏」缺陷（属被测缺陷，非测试侧泄漏）。
- [x] 写操作误判 read-only：无。D4-14/D4-18/19/20 写操作 plan 均正确 `deny`/`confirm`；D4-13 只读子账号写操作 IAM 拒绝=true（readPassRate=100%，writeDenied=true）。
- [x] 红线（I 类）违规：无。
- [x] 脱敏复核：`credentialPanel`/`auth_status`/`redactSecrets`/`redactOutput` 均验证通过；证据 stdout 已避免回显明文 AK/SK。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1，`testbot3-hermes-ecs-3654123197`） | ✓ serverId `bb32b83b-…` | ✓ DeleteServers(手工补删) | ✓ ListServersDetails 中 testbot3-hermes active ECS=0 |
| VPC（D3-C1，`3afbd3df-…`） | ✓ | ✓ DeleteVpc | ✓ ShowVpc 报 VPC.9904 not found |
| subnet（D3-C1，`48b51e41-…`） | ✓ | ✓ DeleteSubnet | ✓ ListSubnets 无本次子网 |
| OBS（D3-C2，`testbot3-hermes-obs-3654285234`） | ✓ | ✓ rm -f 删桶 | ✓ Delete bucket successfully |
| EIP（D3-C7，跨区域） | ✓ | ✓ DeletePublicip | ✓ ListEips 无本次 id |
| EIP（D3-C1，随 ECS） | ✓ | ✓ DeleteServers --delete_publicip | ✓ ListPublicips total_count=0 |
| VPC（D4-14，`08f74b79-…`） | ✓ | ✓ DeleteVpc | ✓ containsOwn=false |

> 注：真云沙箱用例（D3-C3/D3-C6/D3-S3）因 `HDKIT_SANDBOX_MAINTENANCE` 维护中未创建任何资源，无残留；全部真云写操作按名称前缀白名单只删本次创建资源（本机另有一处历史残留 subnet `testbot3-hermes-e2e-3308444841-subnet`，vpc_id=null 属前日遗留，非本轮创建）。D3-C1 本轮自动化 finally 删除轮询（150s）对慢速 ECS 删除超时，已手工补删除并核对 ECS/subnet/vpc/EIP 全部归零（见证据 `evidence/D3-C1/stdout.txt` 手工归零补充）。

---

## 八、遗留与建议

- 15 项缺陷（FAIL 12 + SPEC 3）与 2026-11-02（同 gitHead `47170d1f`）结论**完全一致，无新增缺陷、无修复**；均由上游 `file_issue.py` 历史查重关联既有 open issue（见 `HISTORY_LINKS.md`），不重复开单。
- 3 项 SPEC-MISMATCH（D8-9/D9-9/D10-4）需维护者裁决用例母版是否同步。
- D1-70：建议 devkit 将 bundled undici 与 zstd-capable node 门槛对齐（Node>=22.15 引擎下限，或 proxy-agent 增加 zstd 缺失降级路径）。
- 沙箱用例（D3-C3/D3-C6/D3-S3）待华为云沙箱维护完成后补测解除 BLOCKED。
- 环境建议：本轮 D3-C2 OBS 一次通过（`~/.obsutilconfig` 凭证正常，无需重同步）；建议维护者在 `prepare_env.py` 增加 obsutilconfig 自愈步骤以防周期性失效。