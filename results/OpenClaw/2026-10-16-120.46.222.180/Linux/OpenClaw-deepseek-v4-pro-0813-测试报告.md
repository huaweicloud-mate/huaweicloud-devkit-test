# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-16 06:05:00（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-16-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项，均为历史延续问题）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（Ubuntu 24.04.4 LTS，aarch64） |
| Node / npm / Python | `Node v22.13.0` / `npm 10` / `Python 3.12` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.9-next.0`（npm `@next`，gitHead `6302921c`，PR #914） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12` / doctor 确认已配置 |
| 真云凭证 | `cn-north-4`（AKSK 主账号 + test001 只读子账号） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：run_all.sh 33 支探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真机 CLI + 真云 E2E（建删归零），决策/结果落 `evidence/<case-id>/stdout.log`；真云用例（D3-C1/D3-C2/D3-C3/C6/C7/D3-S2/D3-S6/D4-13/D4-14）真机建删并逐项归零核验。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 13 / 1 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 144） | `88.9%`（PASS 128 / 144） |
| P0 / P1 / P2 缺陷 | `4 / 5 / 7`（16 项发现：FAIL 13 + SPEC 3） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 全部归零（tctest-openclaw-* 残留 0） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单（均历史问题） |
| BLOCKED | `1` | D3-S7（RDS 真·外部依赖） |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | D1-39（Windows 专属，Linux 不适用） |
| **合计** | **`107`** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（云主机路由 MISS，历史） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（16 项，均历史延续，未重复提单）

> 完整逐条（现象/断言/根因/证据）见同目录 `FINDINGS.md`；历史查重关联见 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData/DecryptDatakey 明文 secret 未拦截 | safety/policy.json blockedSecretOperations 缺 DecryptData | 历史 |
| 2 | P0 | D4-15 | ANSI-C 引号命令替换绕过写规则 | risk-rule-engine.mjs 纯正则未解析 ANSI-C | 历史 |
| 3 | P0 | D4-21 | HCL/Terraform broad IAM 未拦截 | risk-rule-engine.mjs iam-admin-policy 仅匹配 JSON | 历史 |
| 4 | P0 | D9-12 | initialize 时序未强制 | mcp-protocol.mjs tools/list 无 initialize 前置校验 | 历史 |
| 5 | P1 | D4-17 | 模糊输入 fail-closed 缺口（$(...) 放行） | risk-rule-engine.mjs 无 finding 即 allow | 历史 |
| 6 | P1 | D4-27 | --key value 空格形态凭证未脱敏 | safety-policy.mjs redactString 仅匹配 key[:=]value | 历史 |
| 7 | P1 | D3-S3 | expose_tunnel 公网 URL 解析失效（OSC 133 未剥离） | session-manager.mjs:1280 getField ^key= 行锚定 | 历史 |
| 8 | P1 | EXP-E01 | 『云主机』中文意图路由 MISS | tools.mjs ECS keywords 缺『云主机』 | 历史 |
| 9 | P2 | D4-25 | Python hook 写操作遥测分类错误（cli:invoke） | huaweicloud-safety.py WRITE_OPERATION_RE 前置字符类 | 历史 |
| 10 | P2 | D4-26 | findings 证据脱敏不完整（secret_key/adminPass） | risk-rule-engine.mjs redactEvidence 键名表不全 | 历史 |
| 11 | P2 | D8-9 | sanitizeValue 未脱敏凭证 | telemetry.mjs sanitizeValue 无敏感值脱敏 | 历史 |
| 12 | P2 | D8-1 | 文档声明 39 tools 实现 42 | AGENTS.md 硬编码未同步 | 历史 |
| 13 | P2 | D3-S5 | 复合意图分层路由 MISS | tools.mjs serviceCatalog 单关键词并集 | 历史 |
| 14 | P2 | D1-65 | DEBUG 开关仅认 'true'（SPEC） | telemetry.mjs:81 === 'true' | 历史 |
| 15 | P2 | D1-68 | region 优先级 HW_REGION 先于 HUAWEICLOUD_REGION（SPEC） | credentials.mjs:225 HW_REGION \|\| HUAWEICLOUD_REGION | 历史 |
| 16 | P2 | D9-9 | cancellation 未声明（SPEC） | mcp-protocol.mjs capabilities 未声明 | 历史 |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注「Windows 专属」（Windows 升级检测链 EINVAL 语义），本机 Linux 结构性不适用；Linux 侧由 D1-40 覆盖 | — |

### BLOCKED

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|---|
| D3-S7 | 设计级 | P2 | BLOCKED | 补环境 | 跨服务交付(Web+RDS)：复合意图命中 RDS 但 CreateInstance 返回 USE_ERROR Invalid parameter: db.password，且需 vpc/subnet/sg 前置编排 + 10~20min provisioning + 按需计费。RDS API 只读可达已验证。 | RDS 前置网络编排 + 正确 db 参数（password 字段）+ 配额 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（root 下未出现明文 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录 probe 脚本均使用假凭证 fixture，真云日志 AK/SK 经 redact 处理；发现的产品缺陷（D4-26/D4-27/D8-9 脱敏缺口）已如实标 FAIL 并入 FINDINGS

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C1/D3-S2/D4-14） | 是 | 已删 | tctest-openclaw-* 残留 0（ListVpcs 全量核对） |
| 子网（D3-C1） | 是 | 已删 | ListSubnets 残留 0 |
| ECS（D3-C1） | 是 | 已删 | ListServersDetails 残留 0（ACTIVE→删除→归零） |
| OBS 桶（D3-C2/D3-C13） | 是 | 已删 | obsutil ls 残留 0；curl 200 后 rm 删桶 |
| EIP（D3-C7） | 尝试 | 归零 | 建失败(VPC.0301)未计费，ListPublicips 残留 0 |
| FunctionGraph 函数（D3-S6） | 是 | 已删 | ListFunctions 残留 0；DeleteFunction 归零 |
| 沙箱会话（D3-C3/C6/D3-S3） | 是 | 已关闭 | close_session ok |

> 真云只删本次创建资源（tctest-openclaw-*）；既有/他人资源（tctest-diag2/3、devkit-bench、testbot1-hermes-e2e）未触碰。

---

## 八、遗留与建议

- **待裁决 SPEC**：D9-9（cancellation 未声明）、D1-65（DEBUG 严格比较）、D1-68（region 优先级）→ 均由维护者裁决契约方向。
- **历史缺陷延续**：16 项 FAIL/SPEC 全部命中上游已开 issue（#651/#672/#673/#674/#676/#677/#679/#681/#682/#683/#694/#712/#751/#752/#754/#761/#765/#774/#786/#788/#791/#797/#809/#814/#826/#828/#841/#844/#845/#852/#857/#858/#864/#866/#896/#927 等），本次不重复提单，详见 HISTORY_LINKS.md。
- **D3-S6 探针参数修正**：母版 new-fg-rds-probe.mjs 用 `--function_name`/`--code.filename`（错误参数名，KooCLI 7.x 实际为 `--func_name`/`--code_type=inline`+`--func_code.file`），导致误报 FAIL；本轮以修正探针 d3s6-realcloud-v5.mjs 真机建删归零 4/4 得 PASS。建议维护者同步修正母版探针参数。
- **建议**：D4-13「最小权限凭证通过率」探针写操作路径用 CreateVpc（易被 VPC.0114 router 配额掩盖 IAM 拒绝信号），本轮改用 CreatePublicip 得干净的 PolicyNotAuthorized 证据；建议母版探针写路径改用 EIP 避免配额噪声。