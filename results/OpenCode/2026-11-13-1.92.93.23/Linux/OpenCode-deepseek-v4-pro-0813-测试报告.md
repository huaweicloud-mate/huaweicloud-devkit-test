# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-11-13 05:40:00`（北京时间）
> **执行归档**：`results/OpenCode/2026-11-13-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷：P0 3 项 / P1 4 项 / P2 2 项，其中 SPEC-MISMATCH 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux x86_64`（非 TTY，bash） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v2.0.0-next.3`（npm @next，hdk checkout `4b718720`，TS 化重构产 `dist/**/*.js`） |
| 工具全集 | `56`（`TOOL_DEFINITIONS` 注册源数量 + `tool-schemas.js` `getToolSchema`） |
| hcloud / 依赖 | `KooCLI 7.2.12`（cn-north-4 已认证；包要求 `kooCliVersion=7.3.12`，存在版本滞后） |
| 真云凭证 | `cn-north-4`（AKSK 管理账号 + test001 只读子账号，均就绪） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议（stdio）/ 真云 E2E（建删资源归零）/ 沙箱 E2E / D10 评测路由 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：v2 为 TypeScript 化重构——探针核心 `_probe/core.mjs` 直调 npm 全局包 `dist/**/*.js`（含 `tools.js`/`risk-rule-engine.js`/`safety-policy.js`/`update-check.js`/`auth/*` 等），并为 v1 夹具生成 `.mjs→dist/*.js` 桥接 shim（`~/devkit-test/scratch/v2shim`）；云侧工具经 `vendorConfirmed` 证词 + `HUAWEICLOUD_VENDOR_CHALLENGE=off`（确定性测试 tier 约定）调用；真云 E2E 用 `hcloud` CLI 真机建删资源并归零验证；MCP 协议用例 spawn 真实 `dist/mcp-server.js`（esbuild bundle）。证据统一按 `evidence/<case-id>/`（probe.mjs + stdout.log）组织，146 条用例全部落盘。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（1 条 Windows 专属用例在 Linux 标 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `134 / 7 / 2 / 2 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC = 143，不含 BLOCKED/NOT_RUN） | `93.7%` |
| P0 / P1 / P2 新增缺陷 | `3 / 4 / 2`（含 SPEC-MISMATCH 2：D1-68、D9-9） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/子网/安全组与 OBS 桶均已删并归零验证；沙箱会话已 close） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `96` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见缺陷清单（D4-16/17/21、D8-9、D9-12、D3-S3） |
| BLOCKED | `2` | 环境阻塞（D3-C1 billing、D3-C7 跨 region），见 §五 |
| SPEC-MISMATCH | `2` | 契约漂移（D1-68 region 优先级、D9-9 取消能力未声明） |
| NOT_RUN | `1` | D1-39 Windows 专属用例，本机 Linux 不适用 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01「云主机」路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | 命令包裹穿透（sh -c 内层 env dump） | `sh -c "env \| grep ..."` 返回 `deny` | 返回 `allow` | `safety/rules/cloud-risk-rules.json:26` | 待提单 |
| 2 | P0 | `D4-21` | HCL IAM 制品未拦截（仅 warn） | HCL `actions = ["*"]` 返回 `deny` | 返回 `warn`（JSON 正常 deny） | `safety/rules/cloud-risk-rules.json:289,314` | 待提单 |
| 3 | P0 | `D9-12` | initialize 握手未 enforce 时序 | 未 init 先 tools/list 返回 `-32600` | 返回工具列表 | `mcp-protocol.js:248` | 待提单 |
| 4 | P1 | `D4-17` | 模糊输入 fail-closed 失效 | `$(curl ...)` 返回 `deny`/`warn` | 返回 `allow`（fail-open） | `risk-rule-engine.js:149` | 待提单 |
| 5 | P1 | `EXP-E01` | 「云主机」意图未路由 ECS | 命中 `ECS` | fallback `Run hcloud --help` | `capability-catalog.js:22-32` | 待提单 |
| 6 | P1 | `D3-S3` | 沙箱预览 URL 未完成（端口漂移 + 403） | `complete=true`/`tunnel_url_accessible=true` | `complete=false`（nginx 403） | `sandbox/deploy-check.js:30` | 待提单 |
| 7 | P2 | `D8-9` | 遥测 sanitizeValue 未脱敏 | 凭证值 `<redacted>` | 明文残留 | `telemetry/telemetry-values.ts:21` | 待提单 |
| 8 | P2 | `D1-68` | region 优先级契约漂移（SPEC-MISMATCH） | `HUAWEICLOUD_REGION` 优先 | `HW_REGION` 优先 | `auth/credential-resolver.ts:32` / `init-cli.ts:44` | 待裁决 |
| 9 | P1 | `D9-9` | 取消能力未声明（SPEC-MISMATCH） | capabilities.cancellation 声明 | `capabilities: {}` | `mcp-protocol.js:248` | 待裁决 |

> 完整根因 + 代码定位见 `FINDINGS.md`（统一提单脚本解析输入）。
> **v2 相对 v1.1.14-next.2 的变化**：① D2-4（小写 ak=/sk= 脱敏）、D4-3（KMS DecryptData 拦截）、D4-2（env 打印拦截）等 P0 已修复转 PASS；② D4-21 由 v1 的 `allow` 改善为 `warn`（仍未达 deny）；③ 其余 7 项语义缺陷随 v2 重构沿用未修复。全部 9 项由 `file_issue.py` 按用例号历史查重后统一合单。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注「Windows」（升级检测链 EINVAL 专属；Linux/macOS 由 NR3 终端矩阵按负面/环境验证），本机为 Linux，非对应 OS，按 OS 专属 P0 豁免标 NOT_RUN | 无（Linux 侧由展开级 EXP-NR3 代表覆盖，归属正确） |

### BLOCKED

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | ECS CreateServers 订单提交被 billing 拒绝：`Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已真机实测 VPC/子网/安全组 创建→删除→归零 全部成功，ECS 到达订单提交层 | 账号开通 ECS 购买产品/开启按需计费后复测 |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013、无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3、plan_cli_command 含 --cli-region | 账号开通 ap-southeast-3 项目/region 权限后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 写操作判定 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云 AK/SK 仅从 `~/.config/huaweicloud/credentials.json` 注入，未写入 evidence）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC/子网/安全组（D3-S2） | 是 | 已删 | 云端复核无 `testbot2-opencode-*` 残留 |
| OBS 桶（D3-C2、D3-C13） | 是 | 已删 | `hcloud OBS ls` 无 `testbot2-opencode-*` 桶（curl200 后 rm 归零） |
| ECS（D3-C1） | 否（订单被 billing 拒绝） | — | 无创建即无残留 |
| 沙箱会话（D3-C3/C6/S3） | 是 | 已 close_session | session 关闭（沙箱服务未维护，未产生计费资源） |

> 真云只删本次创建资源；未动其他客户端/历史创建的任何资源。

---

## 八、遗留与建议

- **待裁决 SPEC**：`D1-68`（HUAWEICLOUD_REGION vs HW_REGION 优先级，修契约 or 修实现）；`D9-9`（MCP tools/call 取消能力未声明，建议补 `capabilities.notifications.cancellation`）。
- **v2 已修复**：`D2-4` 小写 ak/sk 脱敏、`D4-3` KMS DecryptData、`D4-2` env 打印拦截均转 PASS。
- **v2 仍需修复（自 v1.1.14 沿用）**：D4-16 命令包裹、D4-17 fail-open、D4-21 HCL IAM（由 allow→warn 部分改善）、D9-12 握手时序、D8-9 遥测脱敏、EXP-E01「云主机」路由、D3-S3 沙箱端口漂移自动完成。
- **环境观察（非产品缺陷）**：① 本机 KooCLI 7.2.12 落后包要求 7.3.12，`check_cli` 返回 `version_mismatch`；② `huaweicloud-devkit@2.0.0-next.3` 声明 `engines.node >=22.19`，本机 Node 22.13.0 低于要求（EBADENGINE 警告，功能未受影响）。
- **v2 架构变化提醒**：工具注册源 `TOOL_DEFINITIONS`（56 个）不再内联 `inputSchema`，schema 移至 `tool-schemas.js`（`getToolSchema`），`tools/list` 由 `mcp-protocol.js` 合并返回；此属协议维持（D5-3/D9-1 已按新结构回填 PASS）。
- 本轮未覆盖：真实 Agent 会话评测执行器（D10-1/2/5/9）非 DSH 客户端不适用；Windows 专属 D1-39。