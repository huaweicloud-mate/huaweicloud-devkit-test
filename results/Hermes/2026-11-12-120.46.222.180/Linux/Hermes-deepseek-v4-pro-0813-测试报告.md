# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-12 05:16（北京时间）
> **执行归档**：`results/Hermes/2026-11-12-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.13（npm `latest`，gitHead `8a6d8be2`）
> **测试客户端**：Hermes (deepseek-v4-pro-0813) / Linux (aarch64) / 120.46.222.180
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项；21 项缺陷均为历史在案缺陷复现，本日 0 新增）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` (aarch64) |
| 被测版本（SUT） | `1.1.13`（npm latest 正式版，hdk gitHead `8a6d8be2`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：①探针直调（`file://` 导入 hdk 源码模块 + 真实函数返回值断言，非 mock、非硬编码 PASS）②真云 E2E（最低配置创建 → 测后删除归零 → 只删本次创建，ECS/VPC/子网/EIP/OBS/沙箱全真机）③MCP 真机（沙箱 connect/upload/deploy/close_session）④eval-harness 确定性路由（`run-eval.mjs` 15 条中文意图，无 LLM）。本日 **150 用例全部真机/探针重跑**（非复读昨日结论）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149`（唯一 NOT_RUN：D1-39 Windows 专属） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 18 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 146） | `87.7%` |
| P0 / P1 / P2 缺陷（FAIL） | `4 / 10 / 4` |
| 红线（I 类）违规 | `无` |
| 资源释放 | 全部真云资源创建后删除并归零验证通过（含昨日易泄漏的 D3-C1 ECS 生命周期），0 残留、0 BLOCKED（见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `88` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行（D1-39 Windows 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

完整 21 项缺陷（FAIL 18 + SPEC-MISMATCH 3）逐条「现象/断言/根因(文件:行号)/影响/证据」见同目录 `FINDINGS.md`；历史单号关联清单见 `HISTORY_LINKS.md`。摘要如下：

| # | 级别 | 用例ID | 维度 | 标题 | 根因要点 |
|---|---|---|---|---|---|
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | proxy-agent.mjs 依赖 undici，arm64/Node22.13 导入即崩（zstd 绑定缺失）+ 源码 clone 未随附 undici |
| 2 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | safety-policy.mjs redactString `(AK\|SK)` 正则大小写敏感 + 不匹配裸 ak/sk 键名 |
| 3 | P1 | `D3-C4` | D3功能 | 服务创建类回归 | tools.mjs list_operations 对 DMS/DEW 无 command/result |
| 4 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | routeMap 单意图匹配，未分解复合意图 |
| 5 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph | CreateFunction 最小参数集缺 code（code.filename） |
| 6 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付并归零 | RDS 最小参数集缺 db.password + 部署目标未分解 |
| 7 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | env-dump 检测未覆盖裸 access_key 前缀 |
| 8 | P1 | `D4-4` | D4安全 | 写操作审批门 | policy.json writeOperationPrefixes 缺 Change 前缀 |
| 9 | P1 | `D4-6` | D4安全 | adminPass回显警告 | 规则 stages 缺 command 阶段 + 空格/JSON-key 未脱敏 |
| 10 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | risk-rule-engine 无规则命中默认 allow（fail-open） |
| 11 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归 | 规则仅匹配 JSON Action:*，未覆盖 HCL/托管策略 |
| 12 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | huaweicloud-safety.py WRITE_OPERATION_RE 前置捕获组 |
| 13 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | redactEvidence 不匹配 JSON 带引号 key |
| 14 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | dispatch 无 initialize 前置状态机 + 未接 runVersionCheck |
| 15 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | routeMap 缺「云主机」同义词（HIT=13 MISS=1） |
| 16 | P1 | `EXP-C4-14` | C4矩阵 | DMS list_operations 无路由 | tools.mjs list_operations(DMS) 无 command/result |
| 17 | P1 | `EXP-C4-18` | C4矩阵 | DEW list_operations 无路由 | tools.mjs list_operations(DEW) 无 command/result |
| 18 | P1 | `EXP-E01` | D10评测 | 「云主机」中文意图 MISS | ECS routeMap 缺「云主机」 |
| 19 | P0 | `D10-4` | D4安全 | 安全干预-静态规则层（SPEC） | 规则 16→19 条，用例断言未同步 |
| 20 | P1 | `D9-9` | D9协议 | tools/call 取消能力（SPEC） | initialize capabilities 未声明 cancellation |
| 21 | P2 | `D8-9` | D8文档 | 安装ID与遥测脱敏（SPEC） | sanitizeValue 无 AK/SK/token 脱敏 |

> 21 项缺陷经 `file_issue.py` 历史查重全部命中上游已有 issue（强关联），本轮不重复开单（详见 `HISTORY_LINKS.md`）。历史 D3-C1「ECS 异步删除归零泄漏」已连续两日真机重跑 **未复现**（8/8 PASS、资源归零），不在缺陷清单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 列标注「专属」（Windows 专属 EINVAL 检测链）；本机为 Linux，由展开级 `EXP-NR3-10`（`queryDistTags` probe）代表覆盖，已 PASS |

**BLOCKED**：无（0 项）。真云、只读子账号、沙箱、评测 harness 全部可用。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无**（真云读写全程无 AK/SK 明文落地；只读子账号 D4-13 读 6/6、写 IAM 拒绝=true、归零=true）
- [x] 写操作误判 read-only：**无**（D4-5「写不被误判只读」PASS；已知 D4-25「写→cli:invoke 分类」为已提单历史缺陷）
- [x] 红线（I 类）违规：**无**（真云最低配置建删、只删本次创建、无 mock 假跑、无零产出）
- [x] 脱敏复核：D2-4 / D4-26 / D8-9 脱敏缺口均为历史在案缺陷，本轮实测仍复现，已在 HISTORY_LINKS.md 关联

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS + 系统盘（D3-C1） | CreateServers 最小规格 | 删除含磁盘 | **归零 OK**（本日删除完成，`ListServersDetails` 不含本次 `tctest-hermes-ecs-*`） |
| VPC + 子网（D3-C1） | CreateVpc + CreateSubnet | 清理 VPC+子网 | `cleanOk=true`，`ListVpcs` 不含本次资源 OK |
| VPC（D4-14） | CreateVpc tctest-hermes-* | DeleteVpc + CTS 审计 | `归零验证 ListVpcs 不含本次` OK |
| 跨区域 EIP（D3-C7） | CreatePublicip | DeletePublicip 释放 | `ok=true` + ListPublicips 不含本次 |
| OBS 桶（D3-C2） | mb tctest-hermes-obs-* + 静态站 | OBS rm 删桶 | 删桶归零 |
| 沙箱会话（D3-C3/C6/S3） | connect + deploy + upload | close_session | `ok` |

> 本轮真云资源已全部归零：收尾 `ListVpcs` / `ListPublicips` / `ListServersDetails` / `OBS ls` / `ListSubnets` 均不含 `tctest-hermes-*` 本次创建资源。
> 预扫描/收尾见到的 `tctest-openclaw-c1-*` 等 VPC/ECS 为其它客户端并发遗留或正在使用，非本次创建、未触碰。

---

## 八、遗留与建议

- 21 项缺陷均为**历史在案**、跨版本持续复现，建议上游按 P0 优先级推进：D2-4 / D4-2 / D4-21 / D9-12（凭证脱敏与环境变量打印拦截、HCL 宽泛 IAM 拦截、协议握手）。
- **D3-C1（昨日新增归零泄漏）本日未复现**：ECS 含磁盘删除在探针归零窗口内完成、VPC/子网清理干净。该缺陷为异步删除时序敏感，建议上游仍为真云删操作补充「删除完成轮询/归零确认」原语（昨日根因 `tools.mjs:2241 runApprovedCommand` 仅返回提交结果、无异步完成确认）以防间歇复现。
- 3 项 SPEC-MISMATCH 需维护方裁决是否更新 `test-cases/` 母版断言（规则计数 16→19、cancellation 能力、sanitizeValue 脱敏契约）。
- D1-70（undici/代理）在 arm64 + Node v22.13.0 上持续不可用（`require('undici')` 报 `Cannot read properties of undefined (reading 'bind')`，zstd 绑定缺失），建议上游内联 undici 回退或降级依赖。
- 建议下轮继续以「真机重跑」口径判定真云用例（本次 0 BLOCKED，证实账号/配额/沙箱均可用）。