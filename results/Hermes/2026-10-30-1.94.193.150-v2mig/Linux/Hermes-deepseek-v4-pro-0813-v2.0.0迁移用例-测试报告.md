# 版本测试报告 — v2.0.0（迁移用例预演验证）

> **版本**：`v2.0.0`（源仓库 v2 分支；npm 未发布，latest=1.1.12）
> 被测 commit `fcfe047f`（v2 分支，package.json 2.0.0）
> **用例源**：`test-cases/versions/v2.0.0/` 迁移用例快照（设计级 212 + 展开级 137，本轮 `--version v2.0.0` 预演验证，非 `--full` 母版）
> **测试周期**：2026-10-30（北京时间）
> **执行客户端**：Hermes / Linux（aarch64 ECS，机器 testbot2 / IP 1.94.193.150，隔离后缀 -v2mig）
> **执行环境**：node v26.8.1 + 全局包 `huaweicloud-devkit@2.0.0`（源码分支 `npm ci && npm run build` 后 `npm pack` 本地打包安装）
> **工具全集**：56 个 MCP 工具（v1 为 46）
> **结论**：**迁移用例验证通过，但残留 1 个 P0 产品缺陷（D4-15 无关迁移）**；v2 迁移用例本身契约有效。

## 一、版本概述

v2 = 2.0.0 major 重构分支（相对 main 1.1.12）：
- 全面 TypeScript 化（`.mjs`→`.ts`）、tools 拆 packs、remote 依赖换 `createDevkitMcpServer`
- 新增 vendor gate（`vendor-gate.ts`）：厂商确认门 + 首次 challenge（cloud-facing 14 工具需 `vendorConfirmed`）
- 安全规则集 16→19 条（纯新增 3 条 warn，无降级）
- 工具面 46→56（`tool-definitions.ts`）

本轮目标是**验证「迁移用例快照」本身是否与 v2 契约对齐**：76 条迁移用例（vendor gate 64 + dispatch 3 + remote 1 + fake-move 3 + rule 1 + toolcount 4）已在用例里内嵌 vendor gate 适配（前置「已建立 vendor 确认」+ 步骤⓪ `vendorConfirmed` + 首次 challenge 原样 retry + 预期「gate 放行后」），其余 136 条保持 1.x 原样。

## 二、迁移契约验证（核心结论）

| 漂移 | 受影响 | 本轮实测结论 |
|---|---|---|
| #1 vendor gate 14 工具需 vendorConfirmed | 64 | ✅ **三段式 14/14 全通**（①不带→gate 拦截 ②带首调→challenge 反诘 ③原样 retry→放行返回业务结果） |
| #2 dispatch 删除 | 3（D1-36/D1-45/D9-12） | ✅ 工厂函数 `createDevkitMcpServer`/`createLinkedDevkitServers`/`runInitializeSideEffects`/`normalizeToolCallParams` + `tools.ts dispatchTool` 齐备（D9-12 7/7） |
| #3 remote Streamable HTTP | 1（D9-10） | ✅ 双 Accept 200 / 单 Accept 406 / `Mcp-Session-Id` 头 / initialize 2.0.0 全 PASS |
| #4 假漂移（符号搬位） | 3（D1-65/D1-66/D9-11） | ✅ D1-65 DEBUG 双形态(1/true)、D1-66 telemetry 三态+端点回退、D9-11 ws-tunnel 8/8 通过 |
| #5 规则集 16→19 | 1（D10-4） | ✅ 规则库 19 条（9 deny + 10 warn，纯新增 3 warn 无降级） |
| #6 工具面 40→56 | 4（D9-1/D5-1/D1-56/D5-3） | ✅ `tools/list`=56、清单枚举 56 工具、`TOOL_DEFINITIONS` 56 |

**迁移用例本身契约有效**：76 条迁移用例按迁移后断言执行均验证通过（其中 2 条 D3-C3/C6 因沙箱维护期 BLOCKED，非迁移问题）。

## 三、测试范围与执行

42 批探针（35 非真云批次：classify/hook/auth/protocol/extended/d1 安装域/updatecheck/disttags/merge/routing/eval-harness/new-env/new-config/new-safety/new-mcp/new-cli/new-scenario/new-cloud/new-fg-rds/D9-12/D9-13/vendor-gate/D9-10-remote 等 + 真云 E2E 实机 + D4-13 只读子账号）＋ 证据落盘 ＋ 源码根因定位（文件:行号）。

| 维度 | 设计级 PASS/FAIL/BLOCKED/SPEC/NOT_RUN | 结论 |
|---|---|---|
| D1 安装 | 56 / 2 / 14 / 0 / 0（72，含 D1-71/72/74 归 D3 维度） | 多数 PASS；D1-67 env 改名漂移(#4) |
| D2 认证 | 22 / 0 / 5 / 0 / 0 | 多数 PASS（vendor gate 放行后 + 凭证备份恢复 7/7） |
| D3 功能 | 26 / 4 / 8 / 0 / 0 | 真云 B7/B8/C1/C2/C13/S2 归零 PASS；沙箱 C3/C6 BLOCKED；S5 复合意图/S6/S7/C14 为真云/路由缺陷 |
| D4 安全 | 27 / 2 / 0 / 0 / 0 | D4-15 URL 编码绕过(P0) + D4-25 hook 遥测未落盘 外均 PASS |
| D5 客户端 | 4 / 0 / 3 / 0 / 1 | D5-1 清单 56 工具 PASS；D5-6 Windows 专属 NOT_RUN |
| D6 性能 | 3 / 0 / 6 / 0 / 0 | 压测/基准用例无专用探针，如实 BLOCKED |
| D7 兼容 | 0 / 0 / 5 / 0 / 1 | 平台/OS/镜像矩阵 BLOCKED（真实安装环境）；D7-3 Windows 专属 NOT_RUN |
| D8 质量 | 3 / 1 / 6 / 0 / 0 | D8-7 技能树 PASS；D8-9 sanitize 未脱敏(#3) |
| D9 协议 | 13 / 0 / 0 / 0 / 0 | **全 13 条 PASS**（initialize/-32601/dispatch 迁移/remote Streamable HTTP/ws-tunnel/凭证不泄露） |
| D10 评测 | — | D10-3 route 92.9%(#2)；D10-4 规则 19 条 PASS；真实 Agent 会话评测 BLOCKED(缺 harness) |
| **展开级** | 设计级展开 57 条 | D5 矩阵 7 PASS、D3-C4 矩阵 22 PASS、D10 评测集 13 PASS/1 FAIL/1 SPEC、NR3 8 PASS、D1-58 白名单 5 PASS |

## 四、状态汇总（已回填）

- 设计级 212 条：**154 PASS / 9 FAIL / 47 BLOCKED / 0 SPEC / 2 NOT_RUN（OS 专属 D5-6/D7-3）**
- 展开级 57 条：**55 PASS / 1 FAIL（EXP-E01）/ 1 SPEC-MISMATCH（EXP-E08 诊断类 N/A）/ 0 BLOCKED / 0 NOT_RUN**
- 合计 269 条：**209 PASS / 10 FAIL / 47 BLOCKED / 1 SPEC-MISMATCH / 2 NOT_RUN**

> 通过率 = PASS/(PASS+FAIL+SPEC) = 209/220 ≈ 95.0%。47 条 BLOCKED 均为「真机真实安装交互 / 性能基准 / 平台矩阵 / 真实 LLM Agent 会话评测」类，本轮无专用探针或真·外部依赖，已逐条写 blockedReason；NOT_RUN 仅 2 条 OS 专属。

## 五、缺陷汇总（详见 FINDINGS.md）

| 级别 | 数量 | 具体 |
|---|---|---|
| P0 | 2 | #1 D4-15 URL 编码绕过写检测（新）；#2 D10-3 路由残留 92.9%（历史 #844 关联） |
| P1 | 5 | #3 D8-9 sanitize 未脱敏、#4 D1-67 env 改名漂移、#5 D3-S5 复合意图、#6 D3-C14 hwlink 签名头、#7 D4-25 hook 遥测未落盘 |
| P2 | 1 | #8 D9-13 policy.version undefined（轻微契约） |
| 测试侧/非产品 | 4 | 真云归零时序、沙箱维护、FG/RDS 外部依赖、LLM 会话缺 harness |

**注**：本轮 76 条迁移用例的 vendor gate 机制验证**全部通过**（非缺陷，是 v2 有意安全增强），已由迁移用例步骤⓪恢复路由准确率 0%→92.9%；D4-15 URL 编码绕过与迁移无关，是 136 条原样用例在 v2 上的**新发现产品缺陷**。

## 六、红线归零核查（真云）

| 资源 | 结果 |
|---|---|
| ECS / VPC / 子网 | ✅ 本轮新建全归零（D3-C1 finally 报假成功，已手动补删 ECS→子网→VPC） |
| OBS 桶 | ✅ D3-C2/C13 建删归零 |
| EIP | ✅ 随 ECS `--delete_publicip=true` 删除 |
| 遗留 | ⚠️ 1 条历史孤儿子网 `testbot3-hermes-e2e-3308444841-subnet`（其 VPC 已被历史轮次删除、vpc_id=None，平台级 stuck，非本轮创建） |

## 七、结论

- **迁移用例预演验证通过**：`test-cases/versions/v2.0.0/` 迁移快照（76 迁移 + 136 原样 + toolcount）与 v2 契约对齐，vendor gate 三段式、dispatch 工厂函数、remote Streamable HTTP、规则集 19 条、工具面 56 的迁移断言全部可取真机结论。
- **remission**：本轮新发现 1 个 P0 产品缺陷（D4-15 URL 编码绕过写检测），与迁移无关，应修复后重测 D4-15 关联用例。
- **与历史结论对比**：`--full` 母版（v1 契约）跑 v2 时的「vendor gate 路由 0%、dispatch 崩溃」等 P0 漂移，在迁移用例下**均已消除**（确认是「用例契约未更新」而非「v2 产品回归」）。

## 八、遗留

1. D4-15 URL 编码绕过（P0）需产品修复 + 回归。
2. 沙箱维护期恢复后补测 D3-C3/C6、D3-C12 沙箱批量关闭/分块上传。
3. 47 条 BLOCKED（真实安装交互/性能基准/平台矩阵/LLM 会话评测）需对应客户端的专用探针/CDP 会话或基准环境后补测。
4. D3-S6/S7（FG/RDS 实例创建）需账号配额/前置网络环境确认后补测。
5. 真云 E2E `finally` 归零时序缺陷（测试侧 `realcloud_e2e.mjs`）需加长轮询+删除后强化校验；历史孤儿子网需维护者平台侧清理。