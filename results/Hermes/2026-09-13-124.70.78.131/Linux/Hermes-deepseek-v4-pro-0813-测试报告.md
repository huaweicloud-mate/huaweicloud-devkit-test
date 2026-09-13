# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-13 17:12:00`（北京时间）
> **执行归档**：`results/Hermes/2026-09-13-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（发现 1 个 P0 + 1 个 P1 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic，ECS） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11.16 |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `3b6290bc`，PR `#647`） |
| 工具全集 | `39`（`tools/list` 实测，0 非法 schema） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认已配置，Runtime deps undici 已装） |
| 真云凭证 | cn-north-4（AKSK 已配置；本轮**未创建/删除任何真云资源**，仅只读脱敏查询） |
| 测试类型 | 源码级探针（safety-policy / auth 规则）+ 真机 CLI（install/doctor/status/uninstall）+ MCP 协议 + 凭证脱敏 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本直调安装包 `plugins/huaweicloud-core/src/*` 导出函数 + spawn `mcp-server.mjs` 驱动 JSON-RPC，结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。CLI 安装/卸载在**同时隔离 HOME 与 HERMES_HOME** 的临时目录完成，未污染真实 agent home。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行 | 16 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 14 / 2 / 9 / 0 / 127 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 87.5%（14 / 16） |
| P0 / P1 / P2 新增缺陷 | 1 / 1 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 14 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | 不符预期，根因见缺陷清单 |
| BLOCKED | 9 | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 56 | 本轮未覆盖（单终端回归范围外） |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 0 | — |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 71 | 多终端枚举/真云/评测，单 Linux 终端未覆盖 |
| **合计** | **71** | |

---

## 四、逐用例结果（已执行项）

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 | 备注 |
|---|---|---|---|---|---|
| D1-1 | P1 | 全新环境引导安装 | PASS | `evidence/D1-1/stdout.log` | 隔离 HOME+HERMES_HOME，29 skills+MCP+安全策略全落盘，status 确认已安装 |
| D1-3 | P1 | doctor 健康自检 | PASS | `evidence/D1-3/stdout.log` | 11 pass / 0 warn / 0 fail |
| D1-4 | P2 | status/update 幂等 | PASS | `evidence/D1-4/stdout.log` | 二次 status 结果一致，update 幂等 exit=0 |
| D1-5 | P1 | uninstall 干净度 | PASS | `evidence/D1-5/stdout.log` | 清理 hooks/config/29 skills/MCP，status 回落未安装，残留仅空 config/allowlist |
| D2-4 | P0 | 凭证脱敏正确性 | PASS | `evidence/D2-4/stdout.log` | AK/SK/securityToken 均 `<redacted>`，无泄露 |
| D2-11 | P0 | R3 STS token 拒绝落盘 | PASS | `evidence/D2-11/stdout.log` | `Temporary STS credentials cannot be persisted (R3)`，隔离 S1 未写文件 |
| D2-12 | P1 | R10 runtime 非空禁止落盘 | PASS | `evidence/D2-12/stdout.log` | `Runtime credentials are active; auto-sync suppressed (R10)` |
| D4-1 | P0 | 凭证文件读取拦截 | PASS | `evidence/D4-1/stdout.log` | `cat ~/.hcloud/config.json` 等 → deny |
| D4-2 | P0 | 凭证 env 打印拦截 | FAIL | `evidence/D4-2/stdout.log` | `env \| grep HW_ACCESS_KEY` 返回 allow，根因见缺陷 #1 |
| D4-3 | P0 | 明文 secret API 拦截 | PASS | `evidence/D4-3/stdout.log` | `ShowSecretVersion`/`GetSecretValue` → deny |
| D4-7 | P1 | hook 三工具有效性 | PASS | `evidence/D4-7/stdout.log` | command/artifacts/deploy_plan 三工具均返回结构化风险结论 |
| D5-3 | P1 | 工具全量枚举 | PASS | `evidence/D5-3/stdout.log` | tools/list 返回 39 工具，0 非法 schema |
| D9-1 | P1 | tools/list 合规 | PASS | `evidence/D9-1/stdout.log` | 39 工具 inputSchema 均 type=object |
| D9-2 | P1 | JSON-RPC 错误码 | FAIL | `evidence/D9-2/stdout.log` | 未知 method/tool 均返回 -32603，根因见缺陷 #2 |
| D9-3 | P1 | tools/call 响应格式 | PASS | `evidence/D9-3/stdout.log` | content 数组 + isError:false |
| D9-4 | P1 | 协议生命周期 | PASS | `evidence/D9-4/stdout.log` | initialize(2024-11-05)+capabilities.tools 正常 |

---

## 五、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖 `HW_` 前缀 | `env \| grep HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow, risk=not_huaweicloud` | `safety-policy.mjs:334-337` | G | 待提单 |
| 2 | P1 | `D9-2` | JSON-RPC 错误码未区分 | 未知 method → `-32601`；未知 tool → `-32602` | 两者均 `-32603` | `mcp-server.mjs:169` | P | 待提单 |

### 根因详情

```markdown
**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`env | grep HW_ACCESS_KEY` → `deny`；`printenv HW_SECRET_KEY` → `deny`
- 实际：均返回 `allow, risk=not_huaweicloud`（正对照 `env | grep HUAWEICLOUD` 正确 deny）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:334-337` `classifyTextCommand` 的 env-dump 正则
  `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀；而 `credentials.mjs:102-104` 正是从
  `process.env.HW_ACCESS_KEY` / `HW_SECRET_KEY` 读取真实凭证 → 可打印明文 AK/SK，违反凭证红线。

**#2 [P1] D9-2 JSON-RPC 错误码未区分**

- 期望：未知 method → `-32601`（Method not found）；未知 tool → `-32602`（Invalid params）
- 实际：`handleMessage` catch 对所有 dispatch 异常硬编码 `code:-32603`
- 根因：`mcp-server.mjs:169` catch 未按错误类型区分；`mcp-protocol.mjs:95`（Unsupported method）与
  `tools.mjs:1455`（Unknown tool）抛出的异常未携带可区分错误码，被统一吞成 -32603。
```

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-39 | Windows 升级检测链专项，Linux 终端无法复现 | Windows 真机 | Windows agent 补测 |
| D3-C4 | 服务创建类回归需真云配额（ECS/DevStation） | 付费配额 + 沙箱 | 配额到位后复测 |
| D7-4 | 国内镜像源安装需 GitCode/国内镜像网络环境 | GitCode 镜像 + GITCODE_TOKEN | 镜像环境就绪后复测 |
| D9-6 | 跨客户端互通需多客户端并存环境 | 多客户端 | 多客户端矩阵环境 |
| D10-1~D10-5 | 评测需 harness + 预算门禁 | 评测集 + 预算 | 评测环境就绪 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 show_profile_redacted / auth_status 均无 AK/SK 泄露）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（本轮未创建/删除任何真云资源）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云凭证仅以 `caae65f2` 指纹出现）

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/沙箱/OBS 等） | 否 | — | 未创建，无残留 |
| 隔离 HERMES_HOME（install 测试） | 是 | 已删 | 残留仅空 config.yaml + shell-hooks-allowlist.json |

> 真云只删本次创建资源；本轮未创建任何真云资源。

---

## 九、遗留与建议

- 待裁决 SPEC：无。
- 本轮未覆盖（说明范围）：真云 E2E（D3-C4）、多终端枚举（展开级 71）、评测（D10-*）、性能（D6-*）、Windows 专项（D1-39）、跨客户端互通（D9-6）。
- 建议：
  1. **P0（D4-2）优先修复**：`safety-policy.mjs` env-dump 正则补 `HW_` 前缀（`HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN`），与 `credentials.mjs` 读取的 env 名对齐。
  2. **P1（D9-2）**：`mcp-server.mjs` catch 按异常类型映射错误码（未知 method→-32601，未知 tool→-32602），或在 `mcp-protocol.mjs`/`tools.mjs` 抛出时附 error code。
  3. 升级检测域（D1-40 镜像 lag、D1-41/42 dismiss 闭环）、安全审批门（D4-18/19/24）在真实交互会话续测。