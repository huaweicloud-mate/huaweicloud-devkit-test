# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-25 05:40:14（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-25-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `huaweicloud-devkit v1.1.12`（npm latest，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（源码级）；MCP JSON-RPC 真机（initialize/tools/list/tools/call）；真云 E2E（ECS/VPC/子网/OBS/FG/审批流/只读子账号，建删归零）；隔离 HOME 安装域探针。证据统一落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `127 / 14 / 1 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `90.1%` |
| P0 / P1 / P2 新增缺陷 | `4 / 5 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS 0 / EIP total_count=0 / 本次 VPC 已删）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞 |
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
| 1 | P1 | `D3-C3` | D3功能 | 沙箱部署E2E | `sandbox/session-manager.mjs:1010` deployNginx 未 stripTerminalEscapes（OSC-133 遮挡 DB_NGINX_T=） | 历史 #981 |
| 2 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | 同 D3-C3（同一根因） | 历史 #981 |
| 3 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs` serviceCatalog 单关键词并集无复合意图拆解 | 历史 |
| 4 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety/policy.json:26` blockedSecretOperations 缺 DecryptData/DecryptDatakey | 历史 |
| 5 | P0 | `D4-15` | D4安全 | hook绕过尝试 | `risk-rule-engine.mjs` 纯正则未解析 ANSI-C 引号编码内层 | 历史 |
| 6 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `risk-rule-engine.mjs` 无 finding 即 allow，$(...) 内层未解析 | 历史 |
| 7 | P0 | `D4-21` | D4安全 | hook_check_artifacts 制品预检 | `risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON 未覆盖 HCL | 历史 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置不匹配空格分隔写动词 | 历史 |
| 9 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `risk-rule-engine.mjs:19` redactEvidence 引号包裹 JSON key 未命中 | 历史 |
| 10 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:34` redactString 仅匹配 key[:=]value | 历史 |
| 11 | P2 | `D8-1` | D8质量 | 文档与能力一致 | `AGENTS.md` 硬编码工具数未随 tools.mjs 同步 | 历史 |
| 12 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:189` sanitizeValue 无敏感值脱敏 | 历史 |
| 13 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs:57` dispatch tools/list 无 initialize 前置校验 | 历史 |
| 14 | P1 | `EXP-E01` | D10评测 | 评测集『云主机』路由 MISS | `tools.mjs` ECS keywords 缺『云主机』同义词 | 历史 |

### 根因详情

> 全部 14 项 FAIL 均为历史缺陷延续（SUT 与昨日同为 v1.1.12，gitHead `4ed07801` 未变），已 fresh 复现并落盘 `evidence/<case-id>/stdout.log`；经 `file_issue.py` 查重，全部命中上游已有 open issue，故**不重复提单**，关联清单见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属：Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」；Linux 由 D1-40 覆盖） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 真·外部依赖：RDS 实例创建需 VPC/子网/安全组前置环境 + 正确 db 参数 + 长 provisioning 窗口 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（evidence 全目录脱敏复核：无原始 AK/SK/明文 password 残留）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：show_profile_redacted 返回 `<redacted>`；hist 无明文敏感值；D4-13 写操作 IAM 正确拒绝。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（ACTIVE） | 已删 | ECS 0、EIP total_count=0 |
| VPC+子网（D3-C1/D3-S2/D4-14） | 是 | 已删 | ListVpcs 复核本批 VPC 均已消失 |
| OBS 桶+静态站（D3-C2/D3-C13） | 是 | 已删 | 先删对象后删桶归零 |
| FunctionGraph 函数+TIMER 触发器（D3-S6） | 是 | 已删 | DeleteFunction 归零 ok=true |
| 沙箱（D3-C3/D3-C6） | 连接 | close_session ok | 会话关闭 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留即 FAIL。

---

## 八、遗留与建议

- 待裁决 SPEC（3 项，非缺陷）：`D1-65` telemetry 域 debug 开关 `'1'` 不生效、`D1-68` region 优先级 HW_REGION 先于 HUAWEICLOUD_REGION、`D9-9` capabilities 未声明 notifications.cancellation。
- 非产品缺陷 1 项：`D3-S7` RDS 跨服务交付需 VPC/子网/安全组前置 + 正确 db 参数 + 长 provisioning，真云外部依赖。
- 遗留建议：无。
