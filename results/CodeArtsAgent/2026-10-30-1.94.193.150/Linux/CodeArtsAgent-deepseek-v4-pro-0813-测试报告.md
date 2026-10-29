# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-30 05:54（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-30-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.12`（npm latest，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，或 spawn `mcp-server.mjs` 驱动 JSON-RPC；D1 安装域真机 CLI（隔离 HOME，`--target hermes`，package 1.1.12）；D10 评测集走 `eval/harness/run-eval.mjs`（真实路由，HIT=13/MISS=1/N/A=1）；真云 E2E 真机建删归零（ECS/VPC/子网/SG/OBS/RDS）；结论落 `evidence/<case-id>/stdout.log`（146 条逐一实测）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 10 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `92.9%` |
| P0 / P1 / P2 新增缺陷 | `3 / 2 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | 本次创建资源全部归零（ECS/子网/SG/VPC/OBS/RDS），补充清理 2 个历史遗留测试 VPC |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行（OS 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | tools.mjs:2188 | 历史（不重复开单） |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | safety/policy.json:26 | 历史（不重复开单） |
| 3 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | tools.mjs:1310 | 历史（不重复开单） |
| 4 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归 | cloud-risk-rules.json:209 | 历史（不重复开单） |
| 5 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | huaweicloud-safety.py:46 | 历史（不重复开单） |
| 6 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | risk-rule-engine.mjs | 历史（不重复开单） |
| 7 | P2 | `D8-1` | D8质量 | 文档与能力一致 | hdk/AGENTS.md:27 | 历史（不重复开单） |
| 8 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | telemetry.mjs:189 | 历史（不重复开单） |
| 9 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | mcp-server.mjs:183-187 | 历史（不重复开单） |
| 10 | P1 | `EXP-E01` | D10评测 | 中文意图「云主机」未命中 ECS | tools.mjs:2188 | 历史（不重复开单） |

### 根因详情（源码 commit 4ed07801 / 与 2026-10-29 历史结论一致）

| 用例 | 断言（唯一可判定） | 根因（文件:行号） |
|---|---|---|
| D3-S5 | 复合意图（存储+托管）应拆分分层命中多服务 | tools.mjs:2188 serviceCatalog 未做复合意图拆分（历史 #11） |
| D4-3 | kms DecryptData/DecryptDatakey 明文 secret API 应被拦截 | safety/policy.json:26 blockedSecretOperations 缺 DecryptData/DecryptDatakey |
| D4-17 | shell 包裹/命令替换危险命令应被 hook_check_command 拦截 | tools.mjs:1310 未命中（历史 #673） |
| D4-21 | HCL/Terraform 形态 AdministratorAccess/FullAccess 应被 iam-admin-policy 拦截 | cloud-risk-rules.json:209 正则未命中 HCL role.tf |
| D4-25 | 写操作事件应分类为 cli:write | huaweicloud-safety.py:46 不识别 Create*（历史 #13） |
| D4-26 | findings.evidence 不应含明文 secret_key/adminPass | risk-rule-engine.mjs 脱敏白名单缺 secret_key/adminPass |
| D8-1 | 文档工具数应与 tools/list 实际一致（43/39 → 46） | hdk/AGENTS.md:27 硬编码未同步 |
| D8-9 | sanitizeValue 应移除/脱敏 AK/SK/token | telemetry.mjs:189 未处理（历史 #797） |
| D9-12 | 未 initialize 先 tools/list 应返回 -32600 | mcp-server.mjs:183-187 无 initialize 前置校验 |
| EXP-E01 | 中文意图「云主机」应路由至 ECS | tools.mjs:2188 缺 云主机→ECS 别名 |

> 上述 10 项 FAIL 均今日实测复现，与 2026-10-29 历史结论一致（源码 commit 4ed07801 未变）；另 1 项 SPEC-MISMATCH D9-9（tools/call 取消能力未声明，mcp-protocol.mjs capabilities 缺 notifications.cancellation，历史 #698）见 FINDINGS.md。历史查重命中，本次不重复开单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows EINVAL 专属用例（OS 列标注「专属」），本机 Linux 不适用；Linux 侧由展开级 NR3 终端矩阵代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 实测沙箱服务维护中：sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE(503)，无法建立会话。解除条件：沙箱服务恢复 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 实测沙箱服务维护中：check_user 返回 HDKIT_SANDBOX_MAINTENANCE(503)。解除条件：沙箱服务恢复 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 实测沙箱服务维护中：check_user 返回 HDKIT_SANDBOX_MAINTENANCE(503)，无法 connect。解除条件：沙箱服务恢复 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针输出已 redact，无明文 AK/SK 落盘）
- [x] 写操作误判 read-only：`0`（Create*/Delete* 均判 write，D4-14/D4-20 验证 deny 路径）
- [x] 红线（I 类）违规：`0`（真云用例真机建删、沙箱维护如实 BLOCKED、无虚报 PASS）
- [x] 脱敏复核：`通过`（真云输出 AK/SK 已 redact，证据 stdout.log 无明文凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C1/D3-S7/D4-14） | 是（真机） | 是 | 归零（ListVpcs 不含本次资源） |
| 子网（D3-C1/D3-S7） | 是 | 是 | 归零 |
| 安全组（D3-C1/D3-S7） | 是 | 是 | 归零 |
| ECS（D3-C1） | 是 | 是（DELETED） | 归零（ListServersDetails 无遗留） |
| OBS（D3-C2） | 是（建桶+上传+website config） | 是 | 归零（删桶后 ls 不含） |
| RDS（D3-S7） | 是（异步 BUILD→删除） | 是 | 归零（ListInstances 不含本次实例） |

> 今日真云 E2E：D3-S7 RDS 首跑因 RDS 异步删除释放子网私有 IP 超时（500s），遗留子网+VPC；已手动 DeleteSubnet→DeleteVpc 归零核实。另清理 2 个历史遗留测试 VPC（hdk-s7-vpc-mvu1xn8m、tctest-d424-probe-x）；tctest-tmr-u1yrtd-srv 一套含运行中 ECS，非本次创建，未动。

---

## 八、遗留与建议

- 10 项 FAIL + 1 项 SPEC-MISMATCH 均与历史一致（源码 commit 4ed07801 未变），历史单号见 HISTORY_LINKS.md，本次不重复开单（file_issue.py 查重命中）。
- D9-9 SPEC（tools/call 取消能力未声明）建议在 capabilities 明确声明 notifications.cancellation 或标注不支持。
- 沙箱 3 项（D3-C3/D3-C6/D3-S3）因华为云沙箱服务维护（HDKIT_SANDBOX_MAINTENANCE）BLOCKED，待服务恢复后补测。
- KooCLI 版本不匹配（installed 7.2.12 vs paired 7.3.12），建议 `npx huaweicloud-devkit install-hcloud` 对齐。
- 观察项（非产品缺陷）：risk-rule-engine.mjs 规则库实际 19 条（9 deny + 10 warn），探针/文档断言 16 条（9 deny + 7 warn），建议同步更新探针断言与文档。
