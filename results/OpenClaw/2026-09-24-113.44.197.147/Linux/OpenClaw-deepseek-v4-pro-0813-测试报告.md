# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-24 06:05（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-24-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（14 项 FAIL/SPEC，均为历史同源缺陷 + 2 项非产品缺陷 BLOCKED；无新增 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（`6.8.0-106-generic`） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.7-next.1`（npm @next 预发布，gitHead `657ceb7`） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已安装 / doctor 可执行 |
| 真云凭证 | cn-north-4（AK/SK + 只读子账号 test001，均已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 100 / 展开级 39 / 追踪表 211 行 |

> **版本差异核对**：v1.1.7-next.1（`657ceb7`）相对昨日 v1.1.7-next.0（`0790e92`）仅 14 文件 114 增/67 删——`tools.mjs` 沙箱 devbridge 提示文案（`apiKeyHint`）+ `huawei-sandbox` 技能文档/`.codeartsdoer` sidecopy + release manifest 版本号，无任何安全/协议/服务目录/认证功能代码变更。

> **执行方法**：探针脚本（.mjs/.py）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真机 CLI 记录日志；真云 E2E 建删资源归零。证据统一落 `evidence/<case-group>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 100 + 展开级 39 = 139 |
| 已执行 | 139（全部回填） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 设计 84/13/1/1/1；展开 27/11/1/0/0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 设计 84/98 = 85.7%；展开 27/38 = 71.1% |
| P0 / P1 / P2 缺陷（FAIL+SPEC） | P0=4 / P1=7 / P2=3 / SPEC=1（D9-9） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（VPC/Subnet/SG/RDS/OBS/FunctionGraph 均 0） |
| 历史缺陷 | 14 项均为多客户端多轮复现的历史同源缺陷（上游已开单） |

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
| BLOCKED | 1 | EXP-E08 真实 Agent 会话诊断意图（非产品缺陷） |
| **合计** | **39** | |

---

## 四、缺陷清单

> 14 项 FAIL/SPEC 均为历史同源缺陷（上游已开单），`file_issue.py` 自动查重不重复提单，详见 `FINDINGS.md` 与 `HISTORY_LINKS.md`。2 项 BLOCKED 为【非产品缺陷】（不计入提单）。

| # | 级别 | 用例ID | 缺陷描述 | 期望（精确断言） | 实际 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `env \| grep HW_SECRET_KEY` → deny | allow | `safety-policy.mjs:398-405` | 历史 |
| 2 | P0 | D4-16 | sh -c 命令包裹穿透 | `sh -c "env \| grep"` → deny | allow | `safety-policy.mjs:384-401` | 历史 |
| 3 | P0 | D4-21/D4-7 | broad IAM 未检出 | `actions=["*"]` → deny | allow | `cloud-risk-rules.json:179-201` | 历史 |
| 4 | P0 | D4-23 | 全局规则注入失效 | files 含 rules/ | 不含 | `package.json:8-17` | 历史 |
| 5 | P1 | D4-6 | adminPass 空格未脱敏 | `<redacted>` | 明文 Secret123 | `safety-policy.mjs:42-46` | 历史 |
| 6 | P2 | D4-25 | Py hook 写命令误分类 | cli:write | cli:invoke | `huaweicloud-safety.py:46` | 历史 |
| 7 | P1 | D4-27 | 裸 token=/小写 ak= 未脱敏 | 无明文 | 明文 | `safety-policy.mjs:34-46` | 历史 |
| 8 | P1 | D9-2 | tools/list 非法 params 未 -32602 | -32602 | 200 正常返回 | `mcp-protocol.mjs:57-59` | 历史 |
| 9 | P1 | D9-4 | initialize 前 tools/list 未报错 | 先报错 | 正常返回 | `mcp-protocol.mjs:30-59` | 历史 |
| 10 | P2 | D9-7 | protocolVersion 不协商 | 校验降级 | 原样回显 | `mcp-protocol.mjs:46` | 历史 |
| 11 | P1 | D9-9 | capabilities.cancellation 未声明（SPEC） | 声明 | 缺失 | `mcp-protocol.mjs:47-49` | 历史 |
| 12 | P1 | D10-3 | 中文意图路由 21.4% | ≥90% | 21.4% | `tools.mjs:1816-1946` | 历史 |
| 13 | P2 | D3-S5 | 全角逗号不拆分 | 含 RDS+OBS | 仅 Sandbox | `tools.mjs:1923` | 历史 |
| 14 | — | D3-S3 | 沙箱 expose（非产品） | 公网 URL | Connection failed | 镜像 devbridge 0.1.13 | BLOCKED |
| 15 | — | EXP-E08 | 会话诊断意图（非产品） | 路由结论 | N/A | 非 DSH 无 harness | BLOCKED |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（OS 列「专属」：`npm.cmd`/EINVAL 升级检测链），Linux 结构性不适用；Linux 侧检测链已由 `evidence/d1-upgrade/probe-d1-39-linux.stdout.log` 佐证 | — |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱镜像 devbridge 0.1.13-release，网关已迁移失效 + 无 0.2.x API Key，expose 无法出公网 URL | 预置 DevBridge API Key 或沙箱镜像更新 devbridge 0.2.x |
| EXP-E08 | 展开级 | P1 | BLOCKED | 补环境 | 真实 Agent 会话诊断意图需 LLM harness，serviceCatalog 确定性路由层无法代理；本机 OpenClaw 无 dsh/CDP 会话自动化 | 接入可交互真实 Agent 客户端会话自动化 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针全部走 `hcloud --cli-secret-key` 参数与受管 `credentials.json`，证据目录无明文 SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D4-27 红字对象键已 `<redacted>`）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2/S7） | 是 | 已删 | tctest VPC = 0 |
| Subnet（D3-S2/S7） | 是 | 已删 | tctest Subnet = 0 |
| 安全组（D3-C4） | 是 | 已删 | tctest SG = 0 |
| RDS（D3-S7） | 是 | 已删 | tctest RDS = 0 |
| OBS 桶（D3-C13） | 是 | 已删 | tctest OBS = 0 |
| FunctionGraph（D3-S6） | 是 | 已删 | tctest FG = 0 |

> 真云只删本次 `tctest-` 前缀创建资源；删除前全量盘点 + 白名单，未删既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未声明）——契约漂移，维护者裁决。
- 本轮未覆盖：真实 Agent 会话评测（D10-1/2/5/9，需 DSH/dsh 或 CDP 会话自动化）、沙箱 expose 公网 URL（补 DevBridge API Key 后复测）。
- 建议：D10-3 中文意图路由是跨客户端一致的高频缺陷（准确率长期停在 21.4%），建议优先补齐 serviceCatalog 中文关键词映射；D3-S3 沙箱 expose 建议由维护者统一提供 DevBridge API Key 或推动沙箱镜像升级到 devbridge 0.2.x。