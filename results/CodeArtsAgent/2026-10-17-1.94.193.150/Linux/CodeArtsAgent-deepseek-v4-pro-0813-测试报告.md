# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-17 05:50（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-17-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 6.8，ECS） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.9-next.0`（npm @next，gitHead `6302921c`，latest=1.1.8） |
| 工具全集 | `42`（`tools.mjs` tools/list 实测） |
| hcloud / 依赖 | `hcloud 7.2.12（doctor 确认已配置）/ obsutil 已配置` |
| 真云凭证 | `cn-north-4（AKSK hw018619646 + 只读子账号 test001）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP JSON-RPC 协议 / 真云 E2E / eval-harness 评测集 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本(.mjs)直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn `mcp-server.mjs` JSON-RPC 驱动 + 真云 E2E（ECS/OBS/EIP/FG/RDS/VPC 建删归零）+ `eval/harness/run-eval.mjs` 评测集路由；真云经 hcloud CLI + MCP 工具真机建删并测后归零；D4-13 用只读子账号 test001 实测最小权限。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（另 D1-39 Windows 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 13 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `90.3%` |
| P0 / P1 / P2 产品缺陷 | `4 / 2 / 6` |
| 红线（I 类）违规 | `0`（真云均真机执行 + 建删归零，未 mock） |
| 资源释放 | `全部归零`（ECS/VPC/子网/SG/EIP/OBS/FG/RDS 本次创建均已删） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单（含 D3-S3 非产品缺陷/偶发） |
| BLOCKED | `0` | 环境阻塞 |
| SPEC-MISMATCH | `1` | D9-9 cancellation 未声明 |
| NOT_RUN | `1` | D1-39 Windows 专属 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文「云主机」MISS |
| BLOCKED | `0` | 环境阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行（不适用） |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | kms DecryptData 明文 secret API 未拦截 | `safety/policy.json:26` | 历史 |
| 2 | P0 | `D4-15` | hook 命令替换(ANSIC/printf/base64)绕过 | `risk-rule-engine.mjs` 未解析 `$(...)` | 历史 #673 |
| 3 | P0 | `D4-21` | hook_check_artifacts HCL broad IAM 未拦截 | `risk-rule-engine.mjs:150` | 历史 |
| 4 | P0 | `D9-12` | initialize 时序未强制（-32600） | `mcp-server.mjs:175` | 历史 #699/#774 |
| 5 | P1 | `D4-17` | hook 畸形输入 fail-open | `risk-rule-engine.mjs` 无 fail-closed | 历史 #673 |
| 6 | P1 | `D9-9` | tools/call cancellation 未声明（SPEC） | `mcp-protocol.mjs:47` | 历史 #774/#698 |
| 7 | P1 | `D3-S7` | 复合意图部署目标未命中 | `tools.mjs` serviceCatalog | 历史 #11 变体 |
| 8 | P2 | `D3-S5` | 复合意图分层路由 MISS | `tools.mjs` serviceCatalog | 历史 #11 |
| 9 | P2 | `EXP-E01` | 评测集中文「云主机」MISS | `tools.mjs` serviceCatalog | 历史 |
| 10 | P2 | `D4-25` | Python hook 写操作遥测分类失效 | `hooks/huaweicloud-safety.py:46` | 历史 #13 |
| 11 | P2 | `D4-26` | findings 证据脱敏不完整 | `risk-rule-engine.mjs` | 历史 |
| 12 | P2 | `D8-1` | 文档声明 39 tools 实现 42 | `AGENTS.md:27` | 历史 |
| 13 | P2 | `D8-9` | sanitizeValue 不脱敏 AK/SK/token | `telemetry/telemetry.mjs` | 历史 #797 |
| 14 | 非产品缺陷 | `D3-S3` | 沙箱 deploy_nginx 偶发异常返回（部署实际成功） | `session-manager.mjs:deployNginx` execOneShot 超时假阳 | 非产品/需复查 |

> 14 项中 #1~#13 为产品缺陷（全部命中历史 issue，无新增产品缺陷）；#14 D3-S3 为非产品缺陷/疑似偶发（部署实际成功 nginx HTTP 200，不进产品提单）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 专属（EINVAL 升级检测链），本机 Linux，由 D1-40 代表覆盖 |

### BLOCKED

无。

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
| ECS（D3-C1 c6.large.2） | tctest-c1-ecs-* 已建 ACTIVE | DeleteServers 已删 | ListServersDetails 不含（归零 OK） |
| VPC/子网/安全组（D3-C1/f6207/D3-S2/D3-S7） | 多轮建 | 逆序删除（ECS→SG→子网→VPC） | ListVpcs 不含本次 |
| OBS 桶（D3-C2/D3-C13） | tctest-c2/hdk 桶 + 网站托管 | obs rm -f 删除 | obs ls 不含本次 |
| EIP（D3-C7 最小规格） | 已建 | 已释放 | ListPublicips 不含本次 |
| FunctionGraph（D3-S6） | 函数 + TIMER 触发器 | DeleteFunction 删 | ListFunctions 不含本次 |
| RDS（D3-S7） | hdk-s7 CLOUDSSD 建起 | DeleteInstance 删 | ListInstances 不含本次（手动核实归零） |
| 沙箱会话（D3-C3/D3-C6/D3-S3） | connect + upload + deploy | close_session | 已关闭 |

> D3-S7 独立探针因 RDS 删除轮询超时 exit124，残留 VPC/子网/SG 已手动删除归零（hcloud 核实 ListVpcs 不含 hdk-s7-vpc-*）。历史非本次资源（tctest-diag2、其他 agent 残留）不在本次删除范围。

---

## 八、遗留与建议

- security 规则库（D4-3/15/17/21/25/26）：kms DecryptData 列入 blockedSecretOperations、解析 `$(...)` 命令替换、fail-closed 兜底、覆盖 HCL/Terraform `actions=["*"]`、Python 写分类词边界、findings.evidence 全字段脱敏。
- D9-12：mcp-server dispatch 前增加 initialize 状态机，非法时序返回 -32600。
- D8-1：AGENTS.md:27 同步工具数 42。
- D8-9：telemetry sanitizeValue 增加 AK/SK/token 脱敏。
- D3-S5/D3-S7/EXP-E01：serviceCatalog 复合意图拆分 + 「云主机」「Web 应用」中文关键词补齐。
- D3-S3（非产品/需复查）：deployNginx 在 execOneShot 超时假阳时应结构化降级返回 `ok:false`+port，而非抛异常导致返回结构缺失。
- **版本正面变化（与上轮一致）**：D4-24 审批令牌契约 #745 已结构化修复、规则库 16→19、D4-23 injectAgentRules 已实现、D3-C1 探针参数已修正（ListServersDetails + --delete_volume 顶层 + 轮询 DELETED）本轮真机建删归零 PASS。

