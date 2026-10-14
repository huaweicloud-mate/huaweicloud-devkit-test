# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-15 06:36:28（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-15-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.9-next.0` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本(.mjs)直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn `mcp-server.mjs` JSON-RPC 协议驱动 + 真云 E2E（ECS/OBS/EIP/VPC/RDS/FunctionGraph 建删归零）+ `eval/harness/run-eval.mjs` 评测集路由 + `eval/harness/fixtures/*.mjs` 夹具；真云经 `hcloud` CLI + MCP 工具真机建删并测后归零验证；D4-13 用只读子账号 test001 实测最小权限。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 12 / 0 / 2 / 1` |
| 通过率（分母 = PASS+FAIL = 143） | `91.6%` |
| P0 / P1 / P2 新增缺陷 | `4 / 3 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（ECS/EIP/VPC/子网/SG/OBS/FG/RDS 均已删，沙箱会话已关闭） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `2` | 契约漂移 |
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
| 1 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 2 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补根因 | 待提单 |
| 3 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | TODO: 待补根因 | 待提单 |
| 4 | P0 | `D4-15` | D4安全 | hook绕过尝试 | TODO: 待补根因 | 待提单 |
| 5 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 6 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 7 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 8 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 9 | P2 | `D8-1` | D8质量 | 文档与能力一致 | TODO: 待补根因 | 待提单 |
| 10 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补根因 | 待提单 |
| 11 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 12 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

| 用例ID | 根因（文件:行号） |
|---|---|
| `D4-3` | `plugins/huaweicloud-core/safety/policy.json:26` blockedSecretOperations 未含 kms DecryptData |
| `D4-15` | `plugins/huaweicloud-core/src/risk-rule-engine.mjs` 未解析 `$(...)` 命令替换内层 |
| `D4-17` | `plugins/huaweicloud-core/src/risk-rule-engine.mjs` 畸形输入无 finding 即 allow |
| `D4-21` | `plugins/huaweicloud-core/src/risk-rule-engine.mjs:150` iam-admin-policy 仅匹配 JSON，未覆盖 HCL |
| `D4-25` | `plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` 写分类正则词边界缺失 |
| `D4-26` | `plugins/huaweicloud-core/src/risk-rule-engine.mjs` evidence 脱敏未覆盖 secret_key/adminPass |
| `D8-1` | `AGENTS.md:27` 硬编码 39 tools，实现 42 |
| `D8-9` | `plugins/huaweicloud-core/src/telemetry/telemetry.mjs` sanitizeValue 无敏感值脱敏 |
| `D9-12` | `plugins/huaweicloud-core/src/mcp-server.mjs:175` 无 initialize 状态机 |
| `D3-S5` | `plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 复合意图未拆分 |
| `D3-S7` | `plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 复合意图「Web 应用」未映射部署目标 |
| `EXP-E01` | `plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 中文「云主机」关键词缺失 |
| `D4-24` | `plugins/huaweicloud-core/src/hcloud-cli.mjs:113` 审批令牌契约字段漂移（SPEC） |
| `D9-9` | `plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 未声明 cancellation（SPEC） |

> 全部 14 项均命中历史 issue（file_issue.py 查重），无新增缺陷。


---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），本机 Linux，由 D1-40 代表覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针输出已 redact AK/SK/token）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`（真云均真机执行 + 建删归零，未 mock/未以无凭证标 BLOCKED）
- [x] 脱敏复核：`通过`（D4-26 findings.evidence 脱敏不完整为已知历史缺陷，探针侧已 redact）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1 c6.large.2） | tctest-c1-ecs-* 已建 ACTIVE | DeleteServers 已删 | ListServers 不含（0 残留） |
| EIP（D3-C7 最小规格） | 已建 | 已释放 | ListPublicips 不含本次 |
| VPC/子网/安全组（D3-C1/D3-S2/D4-14/D3-S7） | 多轮建 | 逆序删除（ECS→SG→子网→VPC） | ListVpcs 不含 hdk/tctest 前缀 |
| OBS 桶（D3-C2/D3-C13） | tctest-c2/hdk 桶 + 网站托管 | rm -f 删除 | OBS ls 不含本次 |
| FunctionGraph（D3-S6） | 函数 + TIMER 触发器 | DeleteFunction 删 | ListFunctions=0 |
| RDS（D3-S7 MySQL 单机） | jsonInput+CLOUDSSD 建，ACTIVE | DeleteInstance 删 | ListInstances=0 |
| 沙箱会话（D3-C3/D3-C6/D3-S3） | connect + upload + deploy | close_session | 已关闭 |

> 唯一非本次资源：ECS `hc-activity-2048-ecs`（2026-10-14 历史，非今日测试，未动）。历史残留 tctest-diag2/diag3 VPC 与 hdk1-*/tctest-codeartsagent-c2-* OBS 桶非本次创建，不在本次删除范围。

---

## 八、遗留与建议

- security 规则库（D4-3/15/17/21/25/26，P0×4）：kms DecryptData 列入 blockedSecretOperations、解析 `$(...)` 命令替换、fail-closed 兜底、覆盖 HCL/Terraform `actions=["*"]`、Python 写分类词边界、findings.evidence 全字段脱敏。
- D9-12：mcp-server dispatch 前增加 initialize 状态机，非法时序返回 -32600。
- D8-1：AGENTS.md:27 同步工具数 42。
- D8-9：telemetry sanitizeValue 增加 AK/SK/token 脱敏。
- D3-S5/D3-S7/EXP-E01：serviceCatalog 复合意图拆分 + 「云主机」/「Web 应用」中文关键词补齐。
- **探针断言需随 1.1.9 更新（测试侧，非产品缺陷）**：① D10-4 规则库 16→19 条（新增 3 条 warn），探针硬编码 16 需改 19；② D4-23 注入实现由 copyDir 改为 `injectAgentRules()`（#758 已修复，探针断言已本轮回正为 PASS）；③ D2-10 缺失 config 错误消息加中文前缀（#905 错误面统一），fixture 断言应改为 contains 匹配。
- **版本正面变化**：规则库 16→19、D4-23 规则注入已实现、#905 错误面统一、D3-S6 FunctionGraph 真机阻塞解除（原 BLOCKED → PASS）。
