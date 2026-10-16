# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-17 05:20:00（北京时间）
> **执行归档**：`results/AtomCode/2026-10-17-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷：P0 1 项 / P1 6 项 / P2 3 项；SPEC-MISMATCH 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（Ubuntu 24.04.4，aarch64） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.9-next.0`（npm @next，gitHead `6302921`，release PR #914） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS 中 `huaweicloud_*` 工具） |
| hcloud / 依赖 | hcloud `7.2.12`（KooCLI）；doctor/真云凭证已配置 |
| 真云凭证 | `cn-north-4`（AK/SK 统一账号 hw018619646）+ 只读子账号 `test001`（D4-13） |
| 测试类型 | 源码级探针直调 / CLI 真机 / MCP 协议探针 / 评测 harness / 真云 E2E 真机 |
| daily 基础用例 | 设计级 107 / 展开级 39（合计 146）+ 使命 mission-001 9 条 |

> **执行方法**：源码级探针 `.mjs` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结论落 `stdout.log`；CLI 真机（install/doctor/status/hcloud）记录日志；真云 E2E 走 `realcloud_e2e.mjs`（建删资源归零）；证据统一落 `evidence/<case-id>/`（每用例独立 probe.mjs + stdout.log）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146`（另有 mission-001 9 条全部回填） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `133 / 9 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC = 143，不含 BLOCKED/NOT_RUN） | `93.0%` |
| P0 / P1 / P2 新增缺陷 | `1 / 6 / 3`（共 10 条产品缺陷） |
| 红线（I 类）违规 | `2`（D2-4 JSON 凭证脱敏、D4-27 小写 ak/sk 脱敏） |
| 资源释放 | 真云资源全部归零（D3-C2 OBS 建删成功；D3-C3/C6 沙箱已恢复并建删会话成功；D3-C1 VPC 配额未建成=0；D3-C7 EIP total_count=0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `95` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单（D2-4/D3-S1/S2/S3/S5/D4-25/D4-27/D8-9） |
| BLOCKED | `2` | 环境阻塞（D3-C1 VPC 配额 / D3-C7 region 绑定） |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9 取消能力未声明） |
| NOT_RUN | `1` | OS 专属豁免（D1-39 Windows 专属，Linux 走 NR3 展开级） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期（EXP-E01 中文「云主机」未路由） |
| BLOCKED | `0` | 环境阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 本轮未覆盖 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | JSON 键值形态凭证漏脱敏 | JSON 内 `ak/sk/token` 值应 `<redacted>` | 原样返回明文 `AKID123456` | `safety-policy.mjs:34-62` | P | 待提单 |
| 2 | P1 | `D3-S1` | 中文「查云主机」意图未路由 | 应路由 `ECS` | 回落 `Run hcloud --help` | `tools.mjs:1984-2239` | P | 待提单 |
| 3 | P1 | `D3-S2` | 中文「删 VPC」意图未路由 | 应路由 `VPC` 并确认 | MISS 回落 help | `tools.mjs:1984-2239` | P | 待提单 |
| 4 | P1 | `D3-S3` | 中文「沙箱预览」意图未路由 | 应路由 `Sandbox` | MISS 回落 help | `tools.mjs:1984-2239` | P | 待提单 |
| 5 | P2 | `D3-S5` | 复合中文意图未分层路由 | 应分层返回服务集合 | MISS 回落 help | `tools.mjs:1984-2239` | P | 待提单 |
| 6 | P2 | `D4-25` | 空格分隔写命令遥测误分类 | 应分类 `cli:write` | 分类为 `cli:invoke` | `huaweicloud-safety.py:46,111-112` | P | 待提单 |
| 7 | P1 | `D4-27` | 小写 ak=/sk= 输出未脱敏 | 大小写不敏感 `<redacted>` | 小写 `ak=AKID456` 明文残留 | `safety-policy.mjs:45` | P | 待提单 |
| 8 | P2 | `D8-9` | 遥测 sanitizeValue 未过滤敏感值 | `AK=` 值应脱敏 | `AK=ABC123XYZ` 明文残留 | `telemetry.mjs:189-195` | P | 待提单 |
| 9 | P1 | `D9-9` | tools/call 超时取消能力未声明 | 应声明 `notifications.cancellation` | `capabilities: {tools:{}}` 无取消 | `mcp-protocol.mjs:47-49` | P | SPEC |
| 10 | P1 | `EXP-E01` | 中文「云主机」未路由 | 应路由 `ECS` | 回落 help | `tools.mjs:1984-2239` | P | 待提单 |

### 根因详情（P0/P1 关键缺陷附复现证据）

**#1 [P0] D2-4 凭证脱敏正确性**

- 期望：`redactSecrets('{"ak":"AKID123456",...}')` → `<redacted>`
- 实际：原样返回含明文 `AKID123456`
- 根因：`safety-policy.mjs` 第 45 行正则 `/(AK|SK)\s*[:=]\s*(...)/g` 不匹配带引号 JSON 键 `"ak":"..."`，且 `redactString()` 不做 `JSON.parse`
- 证据：`evidence/D2-4/stdout.log`（`status: FAIL`，`actual: {"ak":"AKID123456",...}`）

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注「Windows（升级检测链 EINVAL 专属；Linux/macOS 由 NR3 终端矩阵按负面/环境验证）」，本机 Linux 结构性不适用，由 NR3 展开级代表覆盖 | 无需改，OS 专属豁免合规 |
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | 真云实机执行 CreateVpc 命中 `VPC.0114 Quota exceeded`（账户 cn-north-4 VPC 配额耗尽），VPC/子网/ECS 无法创建；finally 归零 0 资源无泄漏 | 维护者扩容 VPC 配额后复测 |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 只读规划/引导 4/5 通过；最小 EIP 创建命中 `VPC.0501`（token 项目 cn-north-4 与 region ap-southeast-3 不匹配），为账户级 region/project 绑定 | 授予跨区域 EIP 权限或改用匹配 project 后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [ ] 红线（I 类）违规：`2`（D2-4 JSON 键值形态凭证脱敏、D4-27 小写 ak/sk 脱敏——均已在缺陷清单）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云 E2E 均用 hcloud 凭证文件，未落盘明文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2） | 是 | 已删 | `Delete bucket ... successfully` |
| 沙箱会话（D3-C3） | 是 | 已关闭 | connect→upload→deploy→deploy_check PASS→close_session ok |
| 沙箱会话（D3-C6） | 是 | 已关闭 | check_user→connect→credentials→exec→close_session 全 PASS |
| VPC/子网/ECS（D3-C1） | 否（配额） | — | finally 归零，0 资源无泄漏 |
| EIP（D3-C7） | 否（region 绑定） | — | `total_count=0` |

> 真云只删本次创建资源（唯一时间戳命名），删除前全量盘点 + 白名单，禁删既有/他人资源。残留即 FAIL：本轮无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（tools/call 超时取消能力未声明，`mcp-protocol.mjs:47-49`）
- 本轮新变化：沙箱上游 HDKit 服务已恢复（昨日 D3-C3/C6 因 HTTP 502 标 BLOCKED，今日实机全链路 5/5 PASS）。
- 本轮未覆盖（说明范围）：真实 Agent 会话行为评测（D10 真实端侧会话需 CDP 自动化，非 DSH 客户端）；UI/终端矩阵多客户端联动（单机仅能量证本客户端）
- 建议：`serviceCatalog()` 增加 CJK 同义词表（云主机→ECS、删VPC→VPC 等）可一次性收敛 D3-S1/S2/S3/S5 与 EXP-E01 五处 MISS；凭证脱敏建议做 JSON.parse 后递归脱敏，统一收敛 D2-4/D4-27 两处 I 类红线。