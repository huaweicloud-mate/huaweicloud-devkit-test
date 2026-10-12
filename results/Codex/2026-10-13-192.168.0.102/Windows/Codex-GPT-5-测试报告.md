# Codex-GPT-5 每日测试报告
> **报告名**：`Codex-GPT-5-测试报告.md`
> **生成时间**：2026-10-13 05:09:43（北京时间）
> **执行归档**：`results/Codex/2026-10-13-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Codex` + `GPT-5` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.8`，源码 `74f519dc` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：五组 grouped 探针在 Windows 本机 fresh 执行；D9-12/D9-13 使用隔离源码探针；结果写入 `evidence/<case-id>/` 后批量回填。源码级核对仅用于可直接判定的函数/工具注册用例。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `117 / 17 / 11 / 1 / 0` |
| 通过率（分母 = PASS+FAIL = 134） | `87.3%` |
| P0 / P1 / P2 新增缺陷 | `3 / 14 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | 未创建真云资源；D9-13 临时凭证目录已清理 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见缺陷清单 |
| BLOCKED | `11` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:15-31` 未将裸 `ak`/`sk` 识别为敏感字段 | 待提单 |
| 2 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `tools.mjs:944` 对 hook 命令先拆词取前两段，`sh -c` 内层 env 命令未完整传入判定链 | 待提单 |
| 3 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:15-31` 同样遗漏裸 `ak`/`sk`，影响 `redactSecrets` 与 `redactOutput` | 待提单 |
| 4 | P1 | `D8-4` | D8质量 | 引导步骤可机械执行 | `package.json:8-20` 发布文件集合不包含预期安装文档 | 待提单 |
| 5 | P1 | `D9-2` | D9协议 | JSON-RPC错误码 | `mcp-protocol.mjs:65-78` 参数错误路径与用例断言不一致 | 待提单 |
| 6 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs:32-61` 未跟踪初始化状态，且 initialize 分支未直接调用 `runVersionCheck` | 待提单 |
| 7 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |
| 8 | P1 | `EXP-E02` |  |  | TODO: 待补根因 | 待提单 |
| 9 | P1 | `EXP-E03` |  |  | TODO: 待补根因 | 待提单 |
| 10 | P1 | `EXP-E04` |  |  | TODO: 待补根因 | 待提单 |
| 11 | P1 | `EXP-E05` |  |  | TODO: 待补根因 | 待提单 |
| 12 | P1 | `EXP-E07` |  |  | TODO: 待补根因 | 待提单 |
| 13 | P1 | `EXP-E10` |  |  | TODO: 待补根因 | 待提单 |
| 14 | P1 | `EXP-E11` |  |  | TODO: 待补根因 | 待提单 |
| 15 | P1 | `EXP-E12` |  |  | TODO: 待补根因 | 待提单 |
| 16 | P1 | `EXP-E13` |  |  | TODO: 待补根因 | 待提单 |
| 17 | P1 | `EXP-E14` | D10评测集 | 服务路由未命中 | `tools.mjs:1983-2080` 的 serviceCatalog 关键词路由未覆盖该中文意图 | 待提单 |

### 根因详情

### 根因详情

- `D2-4` / `D4-27`：fixture 中 `{"ak": "...", "sk": "..."}` 经 `redactSecrets` 后仍保留明文；唯一断言是敏感字段必须替换为 `<redacted>`。证据：`evidence/D2-4/stdout.log`、`evidence/D4-27/stdout.log`。
- `D4-16`：MCP `hook_check_command` 对 `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 返回 `allow`，而直接分类返回 `deny`。证据：`evidence/D4-16/stdout.log`。
- `D8-4`、`D9-2`：daily grouped 探针复现失败，分别见 `evidence/D8-4/stdout.log`、`evidence/D9-2/stdout.log`。
- `D9-12`：协议探针 4/6 通过，未初始化先 `tools/list` 未返回 `-32600`，initialize 也未直接调用 `runVersionCheck`。证据：`evidence/D9-12/run.txt`、`evidence/D9-12/stdout.log`。
- `EXP-E01`~`EXP-E15`：确定性 serviceCatalog harness 命中 4/15，其余 MISS 按各用例证据回填；根因集中在 `tools.mjs:1983-2080` 路由关键词覆盖不足。证据：对应 `evidence/EXP-E*/stdout.log`。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-66` | 设计级 | P2 | BLOCKED | 补环境 | 仅完成源码级核对，未启动真实遥测端点；解除条件：提供隔离遥测端点并跑端到端开关验证 | — |
| `D1-69` | 设计级 | P2 | BLOCKED | 补环境 | CLI help 真实安装交互未在本轮 run-only 环境执行；解除条件：提供可控 PTY 并重跑 | — |
| `D1-70` | 设计级 | P1 | BLOCKED | 补环境 | 代理/WebSocket 需要真实代理端点；解除条件：提供隔离代理服务并重跑 | — |
| `D3-S4` | 设计级 | P1 | BLOCKED | 补环境 | 领券闭环依赖真实账户激励状态，未执行假流程；解除条件：维护者提供可用激励测试状态 | — |
| `D4-28` | D4安全 | Node 版安全 hook 链路 | 实测 2026-10-13；Codex 运行环境未安装/注册 PreToolUse hook，无法验证 Node hook 链路；解除条件：在 hook-capable 客户端（Hermes 或等效环境）执行 hooks.json 注册、commandText 提取和 permissionDecision=deny 全链路探针。 |
| `D8-9` | 设计级 | P2 | BLOCKED | 补环境 | 仅源码核对，未启用遥测运行时；解除条件：隔离遥测端点 | — |
| `D8-10` | 设计级 | P2 | BLOCKED | 补环境 | 仅源码核对，未执行隔离 HOME 的安装合并流程；解除条件：可控 agent 配置目录 | — |
| `D9-4` | 设计级 | P1 | BLOCKED | 补环境 | 未启动独立 MCP stdio 会话；解除条件：可控 Inspector 会话 | — |
| `D9-5` | 设计级 | P1 | BLOCKED | 补环境 | 未做长连接/异常传输测试；解除条件：可控 Inspector 会话 | — |
| `D9-10` | 设计级 | P1 | BLOCKED | 补环境 | remote transport 需要可用 HTTP/WS 端口；解除条件：隔离监听端口 | — |
| `D9-11` | 设计级 | P1 | BLOCKED | 补环境 | WebSocket 隧道需要 hwlink mux；解除条件：配置隔离 hwlink 环境 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`；D9-13 使用 fake credentials 且未泄漏
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [ ] 脱敏复核：发现 D2-4/D4-27 缺陷，已记录未将真实凭证写入证据

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 未创建 | 不适用 | 不适用 |

> TODO: 真云用例的资源创建/销毁/归零情况由 agent 依据执行过程补充。

---

## 八、遗留与建议

- 待裁决 SPEC：无新增 SPEC-MISMATCH；`D8-9` 仅源码核对并保留 BLOCKED。
- 未覆盖：真实遥测端点、领券状态、MCP remote/WS 长连接和 hook-capable 客户端链路，均已逐条标记 BLOCKED。
- 建议：补齐裸 `ak`/`sk` 字段脱敏和 MCP hook 包裹命令传递后，优先复测 P0；随后补做 D9-12 非法时序状态机。
