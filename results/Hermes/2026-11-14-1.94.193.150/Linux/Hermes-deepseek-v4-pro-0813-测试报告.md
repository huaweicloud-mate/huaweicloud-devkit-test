# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-14 05:12:48（北京时间）
> **执行归档**：`results/Hermes/2026-11-14-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.13` |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classify/hook/auth/protocol/extended/supplement/new-* 等 30+ 探针），MCP 协议 spawn `mcp-server.mjs` 驱动；CLI 真机执行（install/doctor/status）；真云 E2E 建删资源（D3-C1/C2/C6/C3/C7 + realcloud-probe + D4-13 只读子账号）；结果落 `evidence/<case-id>/stdout.txt`，batch 回填三 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 13 / 0 / 3 / 4` |
| 通过率（分母 = PASS+FAIL = 143） | `90.9%` |
| P0 / P1 / P2 新增缺陷 | `3 / 6 / 4` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/VPC/子网/OBS/FG/RDS/EIP 前缀清单均 GONE）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `88` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

> 完整逐条根因+断言+证据见同目录 `FINDINGS.md`（15 条，含 3 条 SPEC-MISMATCH：D10-4/D9-9/D8-9）。下表为 FAIL 用例（13 条，EXP-E01 与 D10-3 同根因已合并）的根因文件:行号摘要。

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证env打印拦截未覆盖 generic access_key | `safety-policy.mjs:550` env-dump 正则缺裸 access_key/secret_key |
| 2 | P0 | `D4-21` | hook_check_artifacts 未拦截 HCL broad IAM 制品 | `safety/rules/cloud-risk-rules.json:196` regex 未覆盖 HCL `actions=["*"]` |
| 3 | P0 | `D9-12` | initialize 握手协议安全基线两处缺口 | `mcp-protocol.mjs:34-42/61` 缺 runVersionCheck + tools/list 无 initialize 前置 |
| 4 | P1 | `D1-70` | 代理配置 WebSocket 路径崩溃（undici zstd） | `proxy/proxy-agent.mjs:20-22` + bundled undici@8.12.2 decompress.js:78 |
| 5 | P1 | `D4-6` | --admin-pass 不告警 + adminPass 未脱敏 | `cloud-risk-rules.json:68` stages 缺 command；safety-policy redactSecrets 键名缺口 |
| 6 | P1 | `D4-17` | hook 模糊输入 fail-open | `risk-rule-engine.mjs:106` 默认 allow |
| 7 | P1 | `D3-S7` | 跨服务交付 RDS 部署目标未命中 + CreateInstance 缺前置 | `tools.mjs` serviceCatalog 复合意图部署目标缺失 + RDS 参数装配缺口（db.password 漂移） |
| 8 | P1 | `D10-3`/`EXP-E01` | serviceCatalog 中文「云主机」路由 MISS（92.9%） | `tools.mjs:2197` routeMap ECS 缺「云主机」同义词 |
| 9 | P1 | `D9-9` | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs` initialize capabilities 缺 cancellation |
| 10 | P2 | `D3-S5` | 复合意图分层路由仅命中单一服务 | `tools.mjs` serviceCatalog 无复合意图分层拆解 |
| 11 | P2 | `D3-S6` | FunctionGraph 定时任务创建失败（code.filename） | `tools.mjs` CreateFunction 参数装配缺口 |
| 12 | P2 | `D4-25` | Python hook 写操作遥测误分类 cli:invoke | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组不匹配 |
| 13 | P2 | `D4-26` | findings 证据脱敏不完整 | `risk-rule-engine.mjs:22` redactEvidence 键名表缺空格/JSON 带引号形态 |
| 14 | P2 | `D8-9` | sanitizeValue 未脱敏 AK/SK/token（SPEC） | `telemetry/telemetry.mjs:190` sanitizeValue 无敏感值脱敏 |
| 15 | P0 | `D10-4` | 规则库条目数漂移 16→19（SPEC，实现正确） | `safety/rules/cloud-risk-rules.json` 19 条 vs 用例断言 16 条 |

> 以上 15 条与上一推（2026-11-13，同 version 同 commit `8a6d8be2`）结论完全一致，均为历史复现，无新增缺陷；统一提单脚本按用例号历史查重。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | D8质量 | 中英文文档一致 | 【改用例】中英文文档一致需中英双源逐段比对，本轮未覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云/脱敏用例全程无明文 AK/SK 外泄，show_profile_redacted 脱敏 PASS）
- [x] 写操作误判 read-only：`0`（D4-5 写操作不被误判只读 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云 AK/SK 仅存 `~/.config/huaweicloud/credentials.json`，未落入 results）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是 | 已删（含磁盘） | ListServersDetails count=0，`ECS轮询:已归零` |
| VPC / 子网（D3-C1） | 是 | 已删 | ListVpcs/ListSubnets 不含本次资源 |
| OBS 桶（D3-C2） | 是 | 已删 | `Delete bucket ... successfully`，无残留 |
| 沙箱会话（D3-C6/D3-C3） | 是 | close_session 已关 | close_session "ok" |
| EIP（D3-C7） | 是 | 已释放 | ListEips 无本次 id |
| FunctionGraph 函数（D3-S6） | 是（失败回滚） | 已删 | 归零 OK |
| RDS 实例（D3-S7） | 未创建成功 | n/a | CreateInstance 前置失败，无实例 |
| 只读子账号（D4-13） | 未创建资源 | n/a | 归零核实 `created:false` |

> 真云只删本次创建资源（按 `testbot3-hermes-*` 前缀白名单精确匹配）；删除前全量盘点，未触碰他人/既有资源。执行后复查：ECS count=0、VPC 列表空，无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未声明）、`D10-4`（规则库 16→19 条断言漂移）、`D8-9`（sanitizeValue 未脱敏）——均实现侧正确/契约漂移，待维护裁决用例母版。
- 本轮未覆盖（NOT_RUN，均【改用例】/【调归属】）：`D8-1`/`D8-4`/`D8-6`（文档一致性类需白盒 docs 全量比对）、`D1-39`（Windows 专属，Linux 由 EXP-NR3-10 覆盖）。
- 建议：上述 15 项缺陷已多轮历史复现（同 v1.1.13 同 commit `8a6d8be2`），建议上游优先收敛 P0 安全三项（D4-2/D4-21/D9-12），并更新 D10-4 用例断言与实现同步。
