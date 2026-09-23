# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-23 17:26（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-23-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（14 项 FAIL/SPEC，均为历史同源缺陷 + 2 项非产品缺陷 BLOCKED；无新增 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（`6.8.0-106-generic`） |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.7-next.0`（npm @next 预发布，gitHead `0790e92`） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已安装 / doctor 可执行 |
| 真云凭证 | cn-north-4（AK/SK + 只读子账号 test001，均已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 100 / 展开级 39 / 追踪表 211 行 |

> **执行方法**：探针脚本（.mjs/.py）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真机 CLI 记录日志；真云 E2E 建删资源归零。证据统一落 `evidence/<case-group>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 100 + 展开级 39 = 139 |
| 已执行 | 139（全部回填） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 设计 84/13/1/1/1；展开 27/11/1/0/0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 设计 84/98 = 85.7%；展开 27/38 = 71.1% |
| P0 / P1 / P2 缺陷（FAIL+SPEC） | P0=4 / P1=6 / P2=3 / SPEC=1（`#12~#13` 同源 D10-3 合并） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（VPC/SG/RDS/OBS/FunctionGraph 均已 0） |
| v1.1.6 版本修复 | D4-17 修复；D9-2 tools/call 子项修复 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 84 | 有证据且通过 PASS 门禁 |
| FAIL | 13 | 历史同源缺陷，根因见 FINDINGS |
| BLOCKED | 1 | D3-S3 沙箱 expose（非产品缺陷） |
| SPEC-MISMATCH | 1 | D9-9 capabilities.cancellation 契约漂移 |
| NOT_RUN | 1 | D1-39 Windows 专属（OS 列「专属」） |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E14 中文意图路由 MISS（D10-3 同源） |
| BLOCKED | 1 | EXP-E08 真实 Agent 会话诊断（非产品缺陷） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望（精确断言） | 实际 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `env \| grep HW_SECRET_KEY` → `deny` | `allow` | `safety-policy.mjs:398-405` `HW_` 前缀未入 env-dump 门 | 历史同源 |
| 2 | P0 | D4-16 | 命令包裹穿透 | `sh -c "env\|grep"` → `deny` | `allow` | `safety-policy.mjs:384-401` 文本路径不解包 | 历史同源 |
| 3 | P0 | D4-21/D4-7 | broad IAM 未检出 | `actions=["*"]` → `deny` | `allow` | `cloud-risk-rules.json:179-201` 正则大小写敏感 | 历史同源 |
| 4 | P0 | D4-23 | 全局规则注入失效 | `files` 含 `rules/` | 不含 | `package.json:8-17` | 历史同源 |
| 5 | P1 | D4-6 | adminPass 空格形式未脱敏 | 空格形式 → `<redacted>` | 明文 | `safety-policy.mjs:42-46` 仅匹配 `[:=]` | 历史同源 |
| 6 | P2 | D4-25 | Python hook 写遥测误分类 | Create → `cli:write` | `cli:invoke` | `huaweicloud-safety.py:46` WRITE_OPERATION_RE 无边界 | 历史同源 |
| 7 | P1 | D4-27 | 双路径脱敏不完整 | 裸 `token=`/小写 `ak=` → 无明文 | 明文 | `safety-policy.mjs:34-46` | 历史同源 |
| 8 | P1 | D9-2 | tools/list string params 无 -32602 | 非法 params → `-32602` | 无 error | `mcp-protocol.mjs:57-59` | 历史同源（tools/call 已修复） |
| 9 | P1 | D9-4 | initialize 前 tools/list 未报错 | 先报错 | 正常返回 | `mcp-protocol.mjs:30-59` 无门控 | 历史同源 |
| 10 | P2 | D9-7 | protocolVersion 不校验 | 协商降级 | 原样回显 | `mcp-protocol.mjs:46` | 历史同源 |
| 11 | P1 | D9-9 | capabilities.cancellation 未暴露 | 声明 cancellation | 缺失 | `mcp-protocol.mjs:47-49` | 历史同源(SPEC) |
| 12 | P1 | D10-3 | 中文意图路由准确率低 | ≥90% | 21.4% | `tools.mjs:1816-1946` 无中文关键词 | 历史同源 |
| 13 | P2 | D3-S5 | 全角逗号不拆分 | 同时命中 RDS+OBS | 仅 sandbox | `tools.mjs:1923` tokenizer | 历史同源 |

> **FAIL/SPEC 根因均已源码级定位到文件:行号**（详见 FINDINGS.md），15 项中 13 项为历史同源缺陷（`file_issue.py` 自动查重）、2 项为「版本修复」不计入提单。无新增缺陷需开新单。

### 版本修复对照（v1.1.6 → v1.1.7-next.0，发布线推进无功能 diff，修复结果延续）

| 用例 | v1.1.5 状态 | v1.1.6 状态 | 说明 |
|---|---|---|---|
| D4-17 | FAIL（fail-open） | **PASS** | #564 新增 `invalidRiskResult` fail-closed（`risk-rule-engine.mjs:125-136`）；v1.1.7-next.0 保持 PASS |
| D9-2（tools/call） | FAIL | **部分 PASS** | #704 新增 unknown-tool/缺参 -32602（`mcp-protocol.mjs:62-79`）；tools/list 子项残余 |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」：Windows 升级检测链 EINVAL/npm.cmd 专属）；Linux 无 npm.cmd/EINVAL 语义 | Linux 侧已由 EXP-NR3-10 源码级 queryDistTagsSync 探针佐证（evidence/d1-upgrade/probe-d1-39-linux） |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱镜像仍 0.1.13 devbridge，硬编码网关已迁移；无 0.2.x API Key | 预置 DevBridge API Key 或沙箱镜像更新 0.2.x |
| EXP-E08 | 展开级 | P1 | BLOCKED | 补环境 | 真实 Agent 会话诊断意图需 LLM harness（仅 DSH） | 接入可交互真实 Agent 会话自动化或改判 N/A 断言 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（AK/SK 仅经 `getCredentials`/`hcloud --cli-access-key` 使用，未回显）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2/S7） | 是 | 已删 | `tctest-` VPC 残留 0（含 D3-S7 竞态残留手动归零） |
| 安全组（D3-C4 真机） | 是 | 已删 | `tctest-` SG 残留 0 |
| OBS 桶（D3-C13） | 是 | 已删 | 删桶成功 |
| RDS（D3-S7） | 是 | 已删 | `tctest-` RDS 残留 0 |
| FunctionGraph（D3-S6） | 是 | 已删 | `tctest-` 函数残留 0 |

> 真云只删本次 `tctest-` 前缀创建资源，未碰既有资源。

---

## 八、遗留与建议

- **待裁决 SPEC**：D9-9 capabilities.cancellation（`mcp-protocol.mjs:47-49`），需产品确认是否声明 `notifications.cancellation`。
- **本轮未覆盖**：真实 Agent 会话级评测（D10-1/2/5/9，需 DSH/CDP）；Windows 专属用例（D1-39）；沙箱公网 URL expose（D3-S3，缺 API Key）。
- **建议**：v1.1.6 已修复 D4-17 与 D9-2 tools/call 子项，宜在下一轮验证其关闭状态；D10-3 中文路由与 D3-S5 全角逗号为「中文意图」同族根因，宜合并修复（routeMap 补中文关键词 + tokenizer 支持全角分隔）。