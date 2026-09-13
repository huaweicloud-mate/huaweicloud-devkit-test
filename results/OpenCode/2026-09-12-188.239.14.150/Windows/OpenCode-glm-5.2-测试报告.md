# OpenCode-glm-5.2 测试报告

> 生成时间：2026-09-12 13:00~14:05（北京时间）
> 测试执行归档：`results/OpenCode/2026-09-12/`
> 测试对象：huaweicloud-devkit（GitHub huaweicloud/huaweicloud-devkit，dev 分支）

## 一、测试概述

| 项 | 值 |
|---|---|
| 被测版本（SUT） | `v1.1.4-next.2`（dev 分支最新） |
| 工具全集 | 39 个（`tools.mjs` TOOL_DEFINITIONS 注册数组） |
| 本机环境 | Windows Server，Node v22.22.2，npm 10.9.7 |
| 真云 | cn-north-4（KooCLI 7.2.12 authenticated，AKSK 模式） |
| Agent + 模型 | OpenCode + glm-5.2（zhipu/glm-5.2） |
| 测试类型 | 全量测试（P0 基线 + P1 协议/函数/安全/认证 + 真云只读 + 源码级补充） |
| 真实升级 | v1.1.2 → v1.1.4-next.2（`npx huaweicloud-devkit@1.1.4-next.2 upgrade --target opencode`） |

**设计真源**：设计级 163 条 / 展开级 137 条 / 追踪表 169 条。

## 二、执行结果

### 2.1 已执行并通过（有真实证据）

| 用例组 | 结果 |
|---|---|
| P0 安全核心（D4-1/3/5/9/15/16/18/19/21/22） | 10/10 ✓ |
| P0 升级检测链（D1-39/40） | 2/2 ✓ |
| P0 凭证脱敏（D2-4） | 1/1 ✓ |
| P0 STS 拒绝落盘（D2-11，源码级） | 1/1 ✓ |
| P0 meta 技能可机械执行（D8-7） | 1/1 ✓ |
| P0 安全干预（D10-4） | 1/1 ✓ |
| P1 MCP 协议（D9-1/3/4/5） | 4/4 ✓ |
| P1 升级检测链源码级（D1-26~D1-36/D1-44/D1-49/D1-52） | 12/13 ✓（D1-49 PARTIAL） |
| P1 认证域源码级（D2-1/5/6/12/13/14/16/19） | 8/8 ✓ |
| P1 功能域（D3-A1/A2/A5/A6/B1~B3/B6/B7/C5/C7） | 11/12 ✓（D3-A3 PARTIAL） |
| P1 安全域（D4-4/8/11/13/17/20） | 6/6 ✓ |
| P1 性能（D6-3/4） | 2/2 ✓ |
| P1 兼容（D7-5） | 1/1 ✓ |
| P1 质量（D8-3/8） | 2/2 ✓ |
| P1 评测（D10-1） | 1/1 ✓ |
| P2 协议错误码（D9-2） | SPEC-MISMATCH |
| P2 资源状态（D3-C9） | SPEC-MISMATCH |

**D2 认证域细分**（源码级验证，credentials.mjs + service.mjs + reconcile.mjs）：
- R3 STS 拒绝落盘：`persistCredentials()` line 985 检查 securityToken → 返回 "cannot be persisted (R3)"
- R9 configuredBySession 优先 env：`credentials.mjs` line 125-130，标记时 S1 胜出
- R10 runtime 禁止落盘：`service.mjs` `syncAuth()` line 48 检查 `hasRuntimeCredentials()` → ok:false
- R2 confirmToken 仲裁：`tools.mjs` `auth_confirm` (line 1217) 处理冲突
- import 文件擦除：temporary/persist 成功后 `clearImportFile()` (line 1176/1213)
- R5 命名档隔离：`resolveManagedProfile` 只操作 current 档

### 2.2 执行状态汇总

| 状态 | P0 | P1 | 合计 |
|---|---|---|---|
| PASS | 16 | 33 | 49 |
| PARTIAL | 0 | 4 | 4 |
| FAIL | 2 | 0 | 2 |
| SPEC-MISMATCH | 0 | 2 | 2 |
| SKIP | 0 | 3 | 3 |
| NOT_RUN | 0 | 54 | 54 |
| **合计** | **18** | **96** | **163** |

> P0 通过率：16/18 = **88.9%**
> P1 通过率（排除 SKIP+NOT_RUN）：33/39 = **84.6%**

## 三、缺陷清单（8 个）

| # | 级别 | 用例ID | 标题 | 根因 |
|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `hwc-command-env-dump` 规则未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀，`echo` 命令未在命令清单 |
| 2 | P0 | D4-23 | agent-rules.md 未注入 | `rules/huawei-agent-rules.mdc` 存在于产品仓库但 `setup-cli.mjs` 无复制逻辑，OpenCode 配置目录无该文件 |
| 3 | P1 | D3-B4 | explain_error 缺少具体修复步骤 | 对 Ecs.0005 返回通用收集信息，未引用 troubleshooting skill 中的具体修复步骤 |
| 4 | P1 | D4-7 | hook_check_artifacts 未检测 IaC 中 secret 字段 | 对含 `admin_pass` 的 Terraform 代码返回 allow |
| 5 | P2 | D1-49 | determineTarget up_to_date 时返回版本串非 null | `determineTarget('1.1.3',{latest:'1.1.3'})` 返回 `'1.1.3'` 导致仍 spawn |
| 6 | P2 | D9-2 | JSON-RPC 错误码 -32603 而非 -32601 | `mcp-server.mjs` 硬编码 -32603 |
| 7 | SPEC | D3-C9 | 资源不存在返回 Ecs.0114 而非 APIGW.0101 | 测试矩阵断言与实际服务错误码不一致（非产品缺陷） |
| 8 | SPEC | D9-2 | 同 #6 | JSON-RPC 错误码规范不符 |

## 四、阻塞项

| 项 | 原因 |
|---|---|
| D2-21 AK/SK 轮换 | 需一次性 IAM 用户凭证（可轮换，不影响生产） |
| D3-C1~C4 真云 E2E | 不执行真实资源创建/删除（成本/时间约束） |
| D5 多客户端矩阵 | 单终端测试约束，不执行多终端 |
| D10-2/5 评测 | 需评测 harness + 预算 |

## 五、剩余待执行项

1. **D1 剩 14 条 NOT_RUN**：安装中断恢复、坏包回滚、通用 MCP 白名单（需隔离 HOME + Linux）
2. **D4 剩 14 条 NOT_RUN**：审批令牌生命周期、D4-6 adminPass 回显、D4-10 规则回归、D4-12 供应链安全
3. **D3 剩 5 条 NOT_RUN**：沙箱 11 工具、22 服务只读规划、detect_framework
4. **D5/D6/D7/D8/D9/D10 共 47 条 NOT_RUN**：多终端/性能采样/OS 矩阵/文档质量/Agent E2E

## 六、真云资源清理声明

本轮未创建任何真云资源（仅执行只读查询），无资源残留。

## 七、后续计划

继续分域补测（D4 安全域 → D1 安装域 → D3 剩余 → D5-D10），每完成一批即回填执行状态并更新本报告。
