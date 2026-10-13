# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-13 05:41:00`（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-13-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit@1.1.8（GitHub `huaweicloud/huaweicloud-devkit`，gitHead `74f519dc`）
> **结论**：`FAIL`（有 4 项 P0 缺陷，均为 next.2 → 1.1.8 历史延续）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8`（npm @latest，gitHead `74f519dc`） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS，tools/list 实测 42） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AK/SK + test001 只读子账号均就绪） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/update/uninstall）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107（P0=21/P1=56/P2=30）+ 展开级 39 |

> **执行方法**：`run_all.sh` 33 支源码级/协议/harness/真云探针本机 **fresh 重跑**（对 1.1.8 @ 74f519dc），补充新增用例真云 E2E 探针 `new-e2e-probe.mjs`（D3-C7/D3-C2）、`sandbox-e2e-probe.mjs`（D3-C3/D3-C6）、`ecs-d3c1-probe.mjs`（D3-C1）、D3-S6 FunctionGraph 建删归零、D4-17 fail-closed 直调复核；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 设计级用例 | `107` |
| 展开级用例 | `39` |
| 设计级 PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `90 / 12 / 1 / 3 / 1` |
| 展开级 PASS / FAIL | `38 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `(128/144) = 88.9%` |
| P0 / P1 / P2 缺陷 | `4 / 5 / 6`（12 缺陷 + 3 SPEC 漂移） |
| 红线（I 类）违规 | `0`（真云全真机执行、建删归零、无 mock 假跑） |
| 资源释放 | `全部归零，残留 0 项` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 90 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | 不符预期，根因见缺陷清单 |
| BLOCKED | 1 | D3-S7 跨服务交付（RDS 建实例需 VPC/子网/安全组前置 + 长 provisioning） |
| SPEC-MISMATCH | 3 | D9-9 / D1-65 / D1-68 契约漂移 |
| NOT_RUN | 1 | D1-39（OS 专属：Windows 升级检测链 EINVAL，Linux 不适用） |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（D10-3 评测集『帮我查云主机』路由 MISS） |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | D4-3 | 明文 secret API 未拦截（kms DecryptData） | DecryptData 应 deny | allow/unknown_read | safety/policy.json:26 blockedSecretOperations 缺 DecryptData |
| 2 | P0 | D4-15 | hook 绕过（ANSI-C 引号命令替换） | 编码变体应 deny | allow/unknown_read | risk-rule-engine.mjs 纯正则未解析 ANSI-C |
| 3 | P0 | D4-21 | HCL/Terraform broad IAM 未拦截 | HCL actions=["*"] 应 deny | allow | risk-rule-engine.mjs iam-admin-policy 仅匹配 JSON |
| 4 | P0 | D9-12 | initialize 握手时序未强制 | 未 initialize 先 tools/list 应 -32600 | 返回 42 工具 | mcp-protocol.mjs:57 dispatch 无 initialize 前置校验 |
| 5 | P1 | D4-17 | hook 模糊 fail-closed 缺口 | 命令替换/畸形输入应 fail-closed | ok 放行 | risk-rule-engine.mjs:106 无 finding 即 allow |
| 6 | P1 | D4-26 | findings 证据脱敏不完整 | secret_key/adminPass 应脱敏 | 明文残留 | risk-rule-engine.mjs:19 redactEvidence 未覆盖 snake_case secret_key 值尾/adminPass 驼峰 |
| 7 | P1 | D4-27 | 双路径脱敏缺口（--key value 空格） | 空格形态应脱敏 | 未脱敏 | safety-policy.mjs:42 redactString 仅匹配 [:=] 分隔 |
| 8 | P1 | D3-S3 | 沙箱预览公网 URL 未建立 | 终点返回可访问 URL | devbridge_tunnel=FAIL | 缺 HW_API_KEY + 隧道暴露未完成 |
| 9 | P1 | D9-9 | tools/call 取消语义未声明 | 应声明 cancellation | declared=false | mcp-protocol.mjs:47 capabilities 未声明 |
| 10 | P2 | D4-25 | Python hook 写操作遥测分类错误 | 写应落 cli:write | cli:invoke | huaweicloud-safety.py:46 正则前置字符类不匹配空格 |
| 11 | P2 | D8-9 | sanitizeValue 未脱敏 | 应移除 AK/SK/token | 原样保留 | telemetry/telemetry.mjs:189 无敏感值脱敏 |
| 12 | P2 | D8-1 | 文档工具数漂移 | 文档=实现=42 | AGENTS.md 声明 39、openclaw.plugin.json 声明 28 | AGENTS.md:27/45 + openclaw.plugin.json:8 硬编码 |
| 13 | P2 | D3-S5 | 复合意图分层路由 MISS | 应拆分命中多 service | fallback | tools.mjs serviceCatalog 无复合拆解 |
| 14 | P2 | D1-65 | DEBUG 只认 'true' | 1/true 均应开启 | '1' 不生效 | telemetry/telemetry.mjs:81 === 'true' |
| 15 | P2 | D1-68 | region 优先级与契约相反 | HUAWEICLOUD_REGION 应优先 | HW_REGION 优先 | auth/credentials.mjs:222 HW_REGION \|\| HUAWEICLOUD_REGION |

> 15 项缺陷全部可追溯到源码级文件:行号，均已在本日（2026-10-13）fresh 探针重跑中复核复现。除 D3-S3（缺 HW_API_KEY 真·外部依赖 + 公网 URL 能力）外，其余 14 项均为一手源码级确定性缺陷。相对 1.1.8-next.2，唯一变化：D4-17 空串/空白输入由「放行」改进为「deny(invalid-input)」，但命令替换 `$(...)` 与畸形 artifacts JSON 仍 fail-open。

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 【调归属】OS 专属 | Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」）；Linux 由 D1-40 覆盖 |
| D3-S7 | 设计级 | P1 | BLOCKED | 【补环境】 | 跨服务交付(Web+RDS)需先编排 VPC/子网/安全组前置再创建 RDS，且 RDS provisioning 10~20min + 按需计费；探针 CreateInstance 返回 USE_ERROR Invalid parameter: db.password（preflight 缺 vpc_id/subnet_id/security_group_id 前置）。建议独立补测轮 |

---

## 六、安全 / 红线

- 真云用例全部真机执行、建删归零已核验：D3-C1 ECS 生命周期（Build→ACTIVE→删除含磁盘→count=0、VPC/子网/EIP 全归零）；D3-C2 OBS 静态站（build→cp 200→set 静态站 200→chattri public-read→curl 200→删桶归零）；D3-C7 跨区域（ap-southeast-3 命令含 --cli-region + 精确错误码 Common.0013 + EIP 归零）；D3-C3/C6 沙箱（connect→deploy→URL HTTP 200→close_session）；D3-S6 FunctionGraph（建函数+定时触发器→删函数归零）；D3-S2/D4-14 VPC 建→审计→删归零；D4-13 只读子账号写 CreateVpc 被 IAM 拒绝且归零。
- 凭证脱敏红线：D4-26/D4-27 存在残留缺口（已列入缺陷，命中历史单）。
- 未 mock、未假跑、未以无凭证标 BLOCKED（真云已具备执行条件即真机执行）。
- D4-24 确认令牌过期/重复确认边界直调 PASS（not_found/valid/already_consumed 精确，run_approved_command 返回结构化 CONFIRM_TOKEN_NOT_FOUND）。

---

## 七、资源释放

| 资源 | 创建 | 删除 | 归零验证 |
|---|---|---|---|
| ECS（tctest-openclaw-c1-*） | 2 轮 | 已删 | `ListServersDetails count=0` ✅ |
| VPC/子网（tctest-openclaw-c1-*） | 2 轮 | 已删（含探测脚本清理竞态人工补删） | `ListVpcs/ListSubnets` 无 openclaw-c1 残留 ✅ |
| OBS 桶（tctest-openclaw-c2-*） | 多轮 | 已删 | OBS ls 无 c2 残留 ✅ |
| EIP（ap-southeast-3 / cn-north-4） | 0（跨区域 project 不匹配未建成） | - | `total_count=0` ✅ |
| FunctionGraph（hdk1-s6-*） | 1 | 已删 | `ListFunctions` 无残留 ✅ |
| 沙箱 session | 多轮 | 已关 | close_session ok ✅ |
| RDS | 0 | - | D3-S7 未建成（BLOCKED），无残留 |

---

## 八、遗留建议

- 4 项 P0 缺陷（D4-3/D4-15/D4-21/D9-12）均为历史延续，建议维护方优先修复。
- D3-S3 devbridge 隧道需补 HW_API_KEY 长生命周期凭证后复测（真·外部依赖）。
- D3-S7 建议独立补测轮（RDS provisioning 窗口），日常每天轮次不宜纳入。
- 版本演进核对：1.1.8（74f519dc）相对 next.2（681895da）新增 `huaweicloud_competition_voucher_claim` 工具（tools.mjs 42→42，next.2 已含）、setup-cli.mjs +133、mcp-config-merge.mjs +100、hdkitservice-api.mjs +14；工具数由 41→42。serviceCatalog 与 agent-rules 已同步，今日 D3-C4（22 服务）、D3-A1（检索）、D8-7（7 技能）均验证通过，无重命名断链缺陷。