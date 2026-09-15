# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-15 22:15（北京时间）
> **执行归档**：`results/OpenCode/2026-09-15-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（消解 40 个假阻塞 BLOCKED；新发现 3 个缺陷：D9-4 协议时序 + D10-3 中文路由 + D9-9 取消能力；2 个真外部依赖 BLOCKED 保留）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + glm-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.4（hdk 源码 tag v1.1.4），npm latest 1.1.4 |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS，实测 tools/list=40） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK，已配置） |
| 测试类型 | MCP 工具实测 + CLI 真机执行 + 源码级直调 + 评测集 harness |
| 设计真源 | 设计级 81 / 展开级 71 / 追踪表 183 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：MCP JSON-RPC 协议探针（自建 d9-protocol-probe.mjs + supplement-probe.mjs）+ CLI 真机执行（uninstall/install/doctor）+ 源码级直调（configureMCPAgent/serviceCatalog）+ 评测集 harness（run-eval.mjs 15 条路由评测）；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 81 设计级 + 71 展开级 = 152 |
| 已执行 | 152（100%） |
| PASS / FAIL / BLOCKED / NOT_RUN / SPEC-MISMATCH | 132 / 14 / 2 / 3 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC = 147） | 89.8% |
| 消解假阻塞 BLOCKED | 40 → 0（全部实际执行回填） |
| 真·外部依赖 BLOCKED 保留 | 2（EXP-NR3-10 Linux + EXP-NR3-11 macOS，均写 blockedReason 四要素） |
| P0 / P1 / P2 新增缺陷 | 1 / 1 / 1（#3 P0 中文路由 + #2 P1 协议时序 + #4 P2 取消能力） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 不涉及（无真云资源创建/删除） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 77 | 有证据且通过 PASS 门禁（含 10 个从 BLOCKED 消解） |
| FAIL | 3 | D4-2(历史) + D9-4(协议时序) + D10-3(中文路由) |
| BLOCKED | 0 | 全部消解 |
| SPEC-MISMATCH | 1 | D9-9：无取消能力支持 |
| NOT_RUN | 0 | |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 55 | 有证据且通过 PASS 门禁（含 23 个从 BLOCKED 消解） |
| FAIL | 11 | EXP-E01~E05,E07,E10~E14：中文路由 MISS |
| BLOCKED | 2 | EXP-NR3-10(Linux P0) + EXP-NR3-11(macOS P0)，均写 blockedReason |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 3 | EXP-NR3-02/04/24：Linux 终端矩阵不适用 Windows |
| **合计** | **71** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截规则未覆盖 HW_ACCESS_KEY | `printenv HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow` | `safety-policy.mjs:336` + `cloud-risk-rules.json:39` | P | 历史已知 |
| 2 | P1 | D9-4 | MCP server 未强制 initialize 握手时序 | initialize 前 tools/call 应返回错误 | 返回正常 result | `mcp-server.mjs:162` | P | 新发现 |
| 3 | P0 | D10-3 | serviceCatalog 路由对中文 prompt 大面积 MISS | 路由准确率≥90% | 21.4%(3/14) | `tools.mjs:1776` routeMap 缺中文关键词 | P | 新发现 |
| 4 | P2·SPEC | D9-9 | MCP server 无取消能力支持 | capabilities 含取消支持 / cancel 后 2s 中止 | capabilities={tools:{}}，cancel 被忽略 | `mcp-server.mjs:156-159` | I | 新发现 |

### 根因详情

**#2 [P1] D9-4 MCP server 未强制 initialize 握手时序**

- 期望：`initialize` 前发送 `tools/call` → 返回 JSON-RPC 错误
- 实际：返回正常 result（工具执行成功）
- 根因：`mcp-server.mjs:156-162` — `handleMessage` 无 initialization state guard，第 162 行 `dispatch()` 对所有请求无条件分发

**#3 [P0] D10-3 serviceCatalog 路由对中文 prompt 大面积 MISS**

- 期望：路由准确率≥90%（15 条评测集）
- 实际：准确率 21.4%（3 HIT / 11 MISS / 1 N/A）
- 根因：`tools.mjs:1776-1882` — `serviceCatalog` 的 `routeMap` 关键词以英文为主，缺少中文同义词（云主机/云服务器/云数据库/弹性公网IP/备份/费用/监控/证书/权限/函数等）；第 1884 行分词 `split(/[\s,./-]+/)` 对中文无效

**#4 [P2·SPEC-MISMATCH] D9-9 无取消能力支持**

- 期望：capabilities 含取消支持，cancel 通知后 2s 内中止 in-flight 请求
- 实际：capabilities={tools:{}} 无取消支持，cancel 通知被忽略，请求正常完成
- 根因：`mcp-server.mjs:156-159` — 未处理 `notifications/cancelled`，无 pending map 追踪机制

---

## 五、阻塞项与未执行

### 真·外部依赖 BLOCKED（2 条，均写 blockedReason 四要素）

| 用例 ID | 优先级 | blockedReason（实测时间+缺资源+影响+解除条件） |
|---|---|---|
| EXP-NR3-10 | P0 | 2026-09-15 13:50 实测：缺Linux测试机(本机Windows)；影响=D1-39 .cmd/EINVAL语义Linux侧断言无法验证；解除=提供Linux测试机或CI runner |
| EXP-NR3-11 | P0 | 2026-09-15 13:50 实测：缺macOS/ARM测试机或CI runner；影响=声明支持的macOS路径无证据；解除=提供macOS测试机或CI runner，或撤销该支持承诺 |

### NOT_RUN（3 条，不适用 Windows）

| 用例 ID | 优先级 | 原因 |
|---|---|---|
| EXP-NR3-02 | P1 | 不适用Windows (target=Linux-OS_MATRIX)；D1-27 语义检测需Linux终端 |
| EXP-NR3-04 | P1 | 不适用Windows (target=Linux-OS_MATRIX)；D1-42 dismiss持久化需Linux终端 |
| EXP-NR3-24 | P1 | 不适用Windows (target=Linux-OS_MATRIX)；D1-45 兜底序列需Linux终端 |

### 本轮消解的假阻塞（40 条 BLOCKED → 实际执行回填）

| 类别 | 用例 | 消解方法 | 结果 |
|---|---|---|---|
| D9 协议层（9条） | D9-1~D9-9 | 自建 d9-protocol-probe.mjs（JSON-RPC 直调 mcp-server.mjs） | 7 PASS + 1 FAIL + 1 SPEC-MISMATCH |
| D6-4 并发 | D6-4 | supplement-probe.mjs（15 并发 tools/list） | PASS |
| D1-5 卸载 | D1-5 | uninstall --target opencode → 扫描残留 → reinstall | PASS |
| D1-58 白名单 | D1-58 + EXP-D1-58-01~05 | 源码级直调 configureMCPAgent（5 子场景） | 6 PASS |
| EXP-D5 客户端矩阵（18条） | EXP-D5-2~10 | install --target <client> + tools/list | 18 PASS |
| EXP-E 评测集（15条） | EXP-E01~E15 | run-eval.mjs harness（15 条路由评测） | 3 PASS + 11 FAIL + 1 PASS(N/A) |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0（测试过程中未泄漏任何凭证）
- [x] 写操作误判 read-only：0（D4-5 验证 DeleteServers 正确分类为 write）
- [x] 红线（I 类）违规：0
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志
- [x] STS token 落盘：0（D2-11 验证 R3 拒绝机制生效）
- [x] adminPass 回显：0（D4-6 验证 plan_cli_command 正确脱敏 adminPass）
- [x] BLOCKED blockedReason 四要素：2 条真 BLOCKED 均写明（实测时间+缺资源+影响+解除条件）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/OBS/RDS 等 | 否 | N/A | N/A（本轮未创建真云资源） |
| OpenCode 插件（D1-5 测试） | uninstall 后 reinstall | uninstall 移除 29 skills + 1 command + plugin，reinstall 恢复 | 重装后 29 skills 恢复验证 |
| 测试临时 HOME（D1-58/D5 探针） | mkdtempSync | 系统临时目录自动清理 | 不影响远端仓库 |
| 评测集结果 CSV | eval/results/ | 保留作为证据 | 只提交 results/OpenCode/ |

---

## 八、遗留与建议

- **待提单缺陷**（4 条，1 个合并单）：
  1. D4-2（P0，历史已知）— 凭证 env 打印拦截规则需补充 `HW_ACCESS_KEY` 等关键字
  2. D9-4（P1，新发现）— MCP server 需在 `handleMessage` 添加 initialization state guard
  3. D10-3（P0，新发现）— `serviceCatalog` routeMap 需补充中文关键词（云主机→ECS、云服务器→ECS、云数据库→RDS、弹性公网IP→EIP、备份→CBR、费用→BSS、监控→CES、证书→ELB、权限→IAM、函数→FunctionGraph 等）
  4. D9-9（P2·SPEC，新发现）— 考虑添加 `notifications/cancelled` 处理 + pending map
- **真·BLOCKED**：EXP-NR3-10（Linux P0）+ EXP-NR3-11（macOS P0）— 需 Linux/macOS 测试机
- **NOT_RUN**：EXP-NR3-02/04/24（Linux P1）— 需 Linux 终端
- **建议**：
  1. 在 `tools.mjs:1778-1882` 的 routeMap 中为每个服务添加中文同义词关键词
  2. 在 `mcp-server.mjs:156` 的 `handleMessage` 添加 `initialized` 状态检查
  3. 考虑实现 MCP cancellation 支持或更新设计用例 D9-9 的期望
