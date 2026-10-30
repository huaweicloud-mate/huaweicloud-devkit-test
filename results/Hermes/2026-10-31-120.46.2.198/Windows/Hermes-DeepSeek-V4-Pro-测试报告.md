# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-31 05:55:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-31-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，npm `1.1.13-next.0`，gitHead `47170d1f`；官方 latest 仍为 `1.1.12`）
> **结论**：`PARTIAL`（9 条 FAIL + 3 条 SPEC-MISMATCH + 3 条 BLOCKED；通过率 91.8%）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro（testbot5-win-hermes） |
| OS / 架构 | Windows 10（x64，IP 120.46.2.198） |
| Node / npm / Python | Node v26.7.0 / npm 11.19.0 / Python 3.14.7 |
| 被测版本（SUT） | `1.1.13-next.0`（npm `next`，gitHead `47170d1f`，`chore(release): 1.1.13-next.0`） |
| 工具全集 | 46（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud（KooCLI） |
| 真云凭证 | cn-north-4（AK/SK 管理员 hw018619646 + 只读子账号 test001，均就绪） |
| 测试类型 | 源码级探针 / MCP 协议 / 评测路由 / 真云 E2E（建删归零 + 只读子账号最小权限） |
| 设计真源 | daily 精选：设计级 107 / 展开级 43 / 追踪表 216 / 使命 mission-001（9） |

> **执行方法**：`git fetch` hdk 源码 checkout 到 next 对应 commit `47170d1f`（1.1.13-next.0）+ `npm i -g huaweicloud-devkit@next`；`init_day.py Hermes Windows` 建包；探针脚本（.mjs）以 `file://` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结论落 `evidence/<case-id>/stdout.log`；D10 评测走 `probe-eval.mjs` 直连 MCP server；真云 E2E（D3-C1/C2/C3/C6）经 `scripts/realcloud_e2e.mjs` 真机建删，D4-13 经只读子账号（`--cli-access-key/--cli-secret-key` 直连 hcloud）实测最小权限；`backfill_daily.py --write` 回填三份 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 150（设计级 107 + 展开级 43） |
| 已执行 | 150 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 135 / 9 / 3 / 3 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 147） | 91.8% |
| P0 / P1 / P2 新增缺陷 | 2 / 4 / 3（另 SPEC-MISMATCH 3，均历史语义缺陷延续） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本次创建全部归零（ECS=0、VPC=0、子网=0、OBS=0、EIP=0） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 93 | 有证据且通过 PASS 门禁 |
| FAIL | 8 | D2-4 / D9-12 / D4-4 / D3-S1 / D3-C2 / D3-S5 / D4-25 / D4-26 |
| BLOCKED | 3 | D3-C1（VPC 配额）/ D3-C3 / D3-C6（沙箱维护） |
| SPEC-MISMATCH | 3 | D1-65 / D1-68 / D8-9（契约漂移） |
| NOT_RUN | 0 | |
| **合计** | **107** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 42 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（「云主机」意图 MISS） |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **43** | |

### 3.3 使命 mission-001（9）

| 状态 | 数量 |
|---|---|
| PASS | 7 |
| FAIL | 2 |
| **合计** | **9** |

### 3.4 门禁结果

- `verify_no_fake_pass.py Hermes Windows`：**通过**（所有 PASS 用例均有 evidencePath 且证据存在）。
- `verify_coverage.py Hermes Windows`：**通过**（设计级 NOT_RUN=0、空=0、BLOCKED=3 均有原因、NOT_RUN+空占比 0.0%；展开级 0.0%）。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 类型 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（小写 ak=/sk= 与 JSON 带引号 key 失效） | `safety-policy.mjs:45`（`(AK\|SK)` 无 `/i`）+ `:20`（`isSecretKeyName` 未含裸 ak/sk） | 产品 |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线（非法时序未拒） | `mcp-protocol.mjs:61`（`tools/list` 无初始化状态机） | 产品 |
| 3 | P1 | `D4-4` | D4安全 | 写操作审批门（Change* 变更类动词漏拦截） | `safety/policy.json:27`（`writeOperationPrefixes` 缺 `Change`） | 产品 |
| 4 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS（「云主机」路由 MISS） | `tools.mjs:2197-2208`（ECS keywords 缺「云主机」） | 产品 |
| 5 | P1 | `EXP-E01` | D10评测 | 评测集「云主机」意图 MISS | `tools.mjs:2197-2208`（同上根因） | 产品 |
| 6 | P1 | `D3-C2` | D3功能 | OBS 静态网站托管配置签名错误 | `tools.mjs:3040-3041`+`:3078`（`x-amz-security-token` 未纳入 `signedHeaders`） | 产品 |
| 7 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由（仅命中单一服务） | `tools.mjs`（无多意图分解/合并） | 产品 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类（空格前置写动词误分类） | `hooks/huaweicloud-safety.py:46`（`(^\|[A-Za-z0-9])`）+ `:24`（目录错位） | 产品 |
| 9 | P2 | `D4-26` | D4安全 | findings 证据脱敏（`--password 值` 明文残留） | `risk-rule-engine.mjs:19-22`（分隔符仅 `[:=]`） | 产品 |
| 10 | SPEC | `D1-65` | D1安装 | 调试模式环境变量（`DEBUG=1` 不生效） | `telemetry.mjs:82`（仅接受字面量 `'true'`） | 契约漂移 |
| 11 | SPEC | `D1-68` | D1安装 | 区域环境变量优先级相反 | `setup-cli.mjs:4969`（`HW_REGION \|\| HUAWEICLOUD_REGION`） | 契约漂移 |
| 12 | SPEC | `D8-9` | D8遥测 | `sanitizeValue` 未脱敏 AK/SK/token | `telemetry.mjs:190-196`（仅 trim/截断/去控制字符） | 契约漂移 |

### 根因详情

> 每个 FAIL/SPEC 的「现象 / 断言 / 根因（文件:行号）/ 影响 / 证据」见同目录 `FINDINGS.md`（`file_issue.py` 的解析输入）。

> **历史查重**：上述 12 项均与既有语义缺陷同源，`file_issue.py` 内置上游 open issues 按用例号+语义匹配；命中即不重复开单，生成 `HISTORY_LINKS.md` 关联清单。
>
> **较上一执行日（10-30）变化**：SUT 由 1.1.12 → 1.1.13-next.0（`47170d1f`）滚动。10-30 记 2 条缺陷（D3-C2 OBS 签名、EXP-E01 云主机）本次均复现；1.1.13-next.0 引入/暴露的缺陷（D2-4 小写脱敏、D9-12 握手时序、D4-4 Change*、D3-S1 云主机、D3-S5 复合意图、D4-25/D4-26 遥测脱敏、D1-65/D1-68/D8-9 契约漂移）经源码级直调 + 评测 routing 实测确认。
>
> **环境说明**：本机 hdk 源码已 fetch-by-SHA checkout 到 `47170d1f`（1.1.13-next.0）；`npm i -g huaweicloud-devkit@next` 已装；报告口径以实际安装/检出版本为准。

---

## 五、未执行用例与原因（BLOCKED）

本轮无 NOT_RUN；BLOCKED 3 条如下：

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | 补环境 | 真机执行 CreateVpc 返回 `VPC.0114 Quota exceeded`；账号现有 5 个 VPC（其他客户端/historical 遗留，非本机 testbot3-hermes-*，按红线只删本次创建故不可删），配额已满，ECS 生命周期无法建资源；finally 归零确认「无资源需清理」 | 其他客户端清理 VPC 释放配额 |
| `D3-C3` | 设计级 | P1 | 补环境 | 沙箱 DevStation 维护中（HDKIT_SANDBOX_MAINTENANCE）；sandbox_connect 未返回 connected、workspace_id 为空，upload/deploy/check/close 全依赖 connect 失败 | 沙箱维护结束、connect 返回 connected |
| `D3-C6` | 设计级 | P1 | 补环境 | 沙箱 DevStation 维护中（trace 1eb6d8633c4b47609694094a7022a60b）；check_user 返回「沙箱功能正在升级优化」，connect/credentials/exec/close 全失败 | 沙箱维护结束、check_user/connect 恢复 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D4-13 只读 AK/SK 未落盘、未打印；D2-4 明文为构造测试串 AK1234567890ABC 等占位值，非真实凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（testbot3-hermes-ecs-3396207375） | 是（第一轮 1.1.12 探测建） | 已删（+二次手动删除） | ECS=0 |
| VPC（testbot3-hermes-e2e-3396207375） | 是 | 已手动删 | VPC=0 |
| 子网（…3396207375-subnet） | 是 | 已手动删 | subnet(本次)=0 |
| OBS 桶（testbot3-hermes-obs-3396190229 / 3397092977） | 是 | 已删 | OBS=0 |
| EIP / EVS 系统盘 | 是 | 已删 | EIP=0 |

> 真云只删本次创建资源（唯一时间戳名 `testbot3-hermes-*`）。D3-C1 第一轮（1.1.12 源）ECS 异步删除超 150s 轮询窗口「仍未确认」，已二次手动删除 ECS + 子网 + VPC 并逐项 ListServersDetails/ListVpcs/ListSubnets 归零验证（ECS=0/VPC=0/subnet=0/EIP=0/OBS=0）。
> **遗留排查**：账号另存 1 个历史遗留孤儿子网 `testbot3-hermes-e2e-3308444841-subnet`（status=UNKNOWN，其 VPC 已不在，非本次创建、无法标准 DeleteSubnet 清理），属历史运行残留，建议维护者核销。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-65 / D1-68 / D8-9`（3 条契约漂移，源码与用例契约不一致，需维护者裁定用例 or 实现）
- 本轮未覆盖（说明范围）：`D3-C1`（VPC 配额）/ `D3-C3` / `D3-C6`（沙箱维护，待环境恢复后复测）；真实 Agent 会话行为评测（需 dsh/CDP harness，非 DSH 客户端）
- 建议：`D2-4 小写脱敏、D9-12 握手时序、D4-4 Change* 为 1.1.13-next.0 新暴露的 P0/P1 安全缺陷，建议优先修复；EXP-E01/D3-S1 云主机同义词与 D3-C2 OBS 签名已历史提单（#896/#1025 仍 OPEN）；D3-C1 因 VPC 配额阻塞为环境问题，需其他客户端释放配额`