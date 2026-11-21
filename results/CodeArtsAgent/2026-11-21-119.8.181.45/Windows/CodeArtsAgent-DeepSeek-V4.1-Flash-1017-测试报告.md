# CodeArtsAgent-DeepSeek-V4.1-Flash-1017 测试报告

- **执行客户端**：CodeArtsAgent（客户端目录 testbot4-codearts1）
- **模型**：DeepSeek-V4.1-Flash-1017
- **OS**：Windows（Windows 10/Server，Node v22.22.2，npm 12.1.0）
- **被测包**：huaweicloud-devkit 1.1.15（npm latest 正式版）
- **执行机器 IP**：119.8.181.45
- **执行日期**：2026-11-21
- **执行包**：`results/CodeArtsAgent/2026-11-21-119.8.181.45/Windows/`
- **执行时间**：2026-11-21 05:00 – 05:40（北京时间）

## 一、测试概述

按 AGENTS.md「每日测试执行指南」完整执行：`prepare_env.py --update` 拉取测试仓库 main 最新并安装 1.1.15，`init_day.py CodeArtsAgent Windows` 建包（设计级 107 + 展开级 39，预筛剔除 27 条非本客户端/OS），按 P0→P1→P2 逐条执行。每条用例真实运行探针/夹具/MCP 工具，证据落 `evidence/<case-id>/`（probe.mjs + 非空 stdout.log），执行结论机器可读落盘后由 `backfill_daily.py --write` 一次性回填三份 CSV。

缺陷清单见 `FINDINGS.md`（20 项：17 FAIL + 3 SPEC-MISMATCH）。

## 二、执行摘要

| 指标 | 数值 |
|---|---|
| 用例总数（设计级+展开级） | 146 |
| PASS | 115 |
| FAIL | 17 |
| SPEC-MISMATCH | 3 |
| BLOCKED | 11 |
| NOT_RUN | 0 |
| 证据目录数 | 149（含 3 个夹具变体） |

门禁结果：
- `verify_no_fake_pass.py CodeArtsAgent Windows`：**通过**（所有 PASS 均有 evidencePath 且证据存在）。
- `verify_coverage.py CodeArtsAgent Windows`：**通过**（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%，11 个 BLOCKED 均有原因）。

## 三、状态汇总

| 维度 | 用例数 | PASS | FAIL | SPEC | BLOCKED |
|---|---|---|---|---|---|
| D1 安装 | 19 | 16 | 2 | 0 | 0 |
| D2 认证 | 11 | 8 | 1 | 0 | 0 |
| D3 功能 | 22 | 6 | 1 | 0 | 9 |
| D4 安全 | 29 | 17 | 10 | 2 | 2 |
| D5 客户端 | 2 | 2 | 0 | 0 | 0 |
| D6 性能 | 4 | 4 | 0 | 0 | 0 |
| D8 质量 | 6 | 5 | 1 | 0 | 0 |
| D9 协议 | 13 | 10 | 3 | 0 | 0 |
| D10 评测 | 2 | 1 | 0 | 1 | 0 |
| 展开级 EXP-C4/E/D5 | 39 | 37 | 1 | 0 | 0 |

> 注：D1-39 为 FAIL，D10-4 为 SPEC-MISMATCH；上表按维度粗分，与 FINDINGS 逐条一致。

## 四、缺陷清单（摘要，详见 FINDINGS.md）

- **P0（10）**：D4-2 凭证 env 打印未拦截、D4-3 KMS 明文 secret 未拦、D4-9 公网安全组未拦、D4-15 引号变体绕过、D4-16 命令包裹穿透、D4-17 模糊输入未 fail-closed、D4-19 无效 approval token 未拦、D1-39 npm 12 dist-tags 解析静默失败、D9-12 非法时序未拒。
- **P1（7）**：D4-26 findings.evidence 未脱敏、D9-4 生命周期、D2-1 auth init 未落盘、D2-12 runtime 凭证未被 auth_sync 识别、D3-S4 领券凭证不匹配、D4-13 只读子账号越权、EXP-E01 路由 MISS。
- **P2（1）**：D8-9 sanitizeValue 未脱敏。
- **SPEC-MISMATCH（3）**：D10-4 规则库 19 条 vs 设计 16；D4-24 CONFIRM_TOKEN_NOT_FOUND vs EXPIRED；D4-25 capability=cli vs cli:read/write/invoke。

## 五、未执行用例与原因（BLOCKED 逐条）

| ID | 优先级 | 状态 | 分类 | 详细原因与解除条件 |
|---|---|---|---|---|
| D3-C1 | P1 | BLOCKED | 补环境 | ECS 生命周期 E2E 需创建最小 ECS 并删除；本次执行窗口内写资源命令被运行环境拒绝，未创建。解除：允许 ECS 创建并预留 10 分钟建删窗口 |
| D3-C2 | P1 | BLOCKED | 补环境 | OBS 静态站 E2E：创建桶命令被拒绝，未创建桶。解除：允许 OBS CreateBucket/上传/删桶 |
| D3-C3 | P1 | BLOCKED | 补环境 | 本机无 DevStation 沙箱配额/连接，sandbox 工具链未执行。解除：提供沙箱配额 |
| D3-C6 | P1 | BLOCKED | 补环境 | 沙箱 7 隐式工具同上，无沙箱会话。解除：提供沙箱配额 |
| D3-C7 | P1 | BLOCKED | 补环境 | plan 含 --cli-region、区域可用性、只读查询均通过；EIP 创建/释放未执行（写资源被拒）。解除：允许 EIP 创建 |
| D3-C13 | P1 | BLOCKED | 补环境 | OBS 网站托管需真实 bucket，创建桶被拒。解除：允许 OBS 桶创建 |
| D3-S3 | P1 | BLOCKED | 补环境 | 沙箱预览 URL 需 DevStation 配额。解除：提供沙箱 |
| D3-S6 | P2 | BLOCKED | 补环境 | FunctionGraph 定时任务需创建函数，写资源被拒。解除：允许 FunctionGraph 创建 |
| D3-S7 | P1 | BLOCKED | 补环境 | Web+RDS 跨服务需 RDS 创建与长时窗口。解除：RDS 创建授权 |
| D4-11 | P1 | BLOCKED | 补环境 | 提示注入防护需真实 Agent（LLM）行为判定，本客户端无 dsh headless/LLM harness。解除：提供 Agent 会话自动化环境 |
| D4-14 | P2 | BLOCKED | 补环境 | 操作可审计性需 CTS 轨迹与 agent/人工身份区分视图。解除：提供 CTS 审计权限与身份标注 |

## 六、安全与红线合规

- **凭证泄漏事件**：无。D4-1/D4-26 发现脱敏层缺口（D4-26 findings.evidence 保留明文，已列 P1），未向仓库/日志提交真实 AK/SK。
- **写操作误判 read-only**：无。D4-5（DeleteServers=write/deny、List=read_only/allow）、D4-4（四类写操作 deny+safeToRun=false+token）通过。
- **只读隔离（重点风险）**：D4-13 FAIL——只读子账号下 `hcloud VPC CreateVpc` 实际创建成功，说明 `run-as-readonly.py` env 注入未覆盖 hcloud 配置，存在越权风险；已立即删除该 VPC 并归零。
- **脱敏复核**：D2-4 AK/SK/token 均 `<redacted>`；D4-27 双路径脱敏通过；D4-6 adminPass= 脱敏通过。
- **mock 说明**：D3-C14、D9-6、D9-11 使用仓库自带 mock/桩夹具（沙箱凭证 mock、跨客户端桩、WS 隧道 mock），标注为夹具层证据；真云用例未使用 mock。
- **红线违规**：无故意 mock 真云、无零证据 PASS、无越权提交其他客户端/Summary。

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC `tctest-daily-20261121052921`（id 3f98f1a6…） | 2026-11-21 05:29 | 已删除 | `VPC ListVpcs` 无该名称 → DELETED_OK |
| VPC `tctest-ro-deny`（id 70b05649…，D4-13 越权误建） | 2026-11-21 05:28 | 已删除 | `VPC ListVpcs` 无该名称 |
| ECS | 未创建 | - | `ECS ListServersDetails` count=0 |
| EIP / OBS / RDS / CCE / FunctionGraph | 未创建（写资源被拒） | - | 未产生 |
| 历史遗留（非本次） | `tctest-s7-20261120171214/161210-vpc` 两条昨日 VPC | 未删除 | 非本次创建，保留并在遗留项记录 |

## 八、遗留与建议

1. **优先修复 P0 安全规则缺口**：D4-2/3/9/15/16/17/19 表明 1.1.15 安全规则对 Windows 语法、KMS 解密、公网安全组、引号/包裹变体与 fail-closed 覆盖不足，建议补充 `cloud-risk-rules.json` 并加强 `classifyTextCommand` 标准化与递归解析。
2. **协议握手门禁**：`mcp-protocol.mjs:70` 应在 tools/list 前强制校验 initialize，返回 -32600（D9-12/D9-4）。
3. **脱敏链路**：`risk-rule-engine.mjs:97` 应调用 `redactEvidence`；`telemetry.mjs:190` 增加凭证脱敏（D4-26/D8-9）。
4. **升级检测兼容 npm 12**：`update-check.mjs:81` 兼容 dist-tags 数组输出（D1-39）。
5. **只读隔离**：修复 `run-as-readonly.py` 对 hcloud 配置的覆盖（D4-13），并复核 IAM 子账号实际权限。
6. **认证/领券链路**：auth init 落盘、runtime 凭证透传 auth_sync、voucher 凭证解析统一（D2-1/D2-12/D3-S4）。
7. **历史遗留资源**：建议维护者清理昨日两条 `tctest-s7-*` VPC。
8. **BLOCKED 补测**：11 项需沙箱配额/写资源授权/LLM harness，建议在专用长时窗口补测。
