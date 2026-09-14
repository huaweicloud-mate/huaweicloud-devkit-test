# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-14 23:50:00（北京时间）
> **执行归档**：`results/CodeArtsWork/2026-09-14-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（设计级 2 个 FAIL + 展开级 14 个 FAIL，P0 有 1 个 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsWork` + `GLM-5.2` |
| OS / 架构 | `Windows Server 2022 / x64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.4-next.6`（npm @next） |
| 工具全集 | `37`（MCP tool_search 枚举） |
| hcloud / 依赖 | `hcloud 7.2.12 / authenticated=true` |
| 真云凭证 | `cn-north-4（AKSK / 未使用真云操作）` |
| 测试类型 | MCP 协议工具调用 + hook 安全策略验证 |
| 设计真源 | 设计级 81 / 展开级 71 / 追踪表 183 行 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：MCP 工具（huaweicloud-devkit）直接调用，验证 hook 安全策略、认证状态、技能加载、命令分类等；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `81`（设计级）+ `71`（展开级）= `152` |
| 已执行 | `81`（设计级）+ `43`（展开级实际执行，排除 NOT_RUN） |
| 设计级 PASS / FAIL / BLOCKED / NOT_RUN | `65 / 2 / 14 / 0` |
| 展开级 PASS / FAIL / BLOCKED / NOT_RUN | `27 / 14 / 2 / 28` |
| 通过率（设计级分母 = 67） | `97.0%` |
| 通过率（展开级分母 = 41） | `65.9%` |
| P0 / P1 / P2 新增缺陷 | `1 / 2 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `65` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `14` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `0` | 无未覆盖 |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | 逐条实际执行通过（C4 服务矩阵 21 + D5 本客户端 2 + NR3 Windows 2 + E 评测集 2） |
| FAIL | `14` | C4 DEW USE_ERROR 1 + E 评测集路由失败 13 |
| BLOCKED | `2` | NR3 Windows 需特定安装布局（EXP-NR3-03/23） |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `28` | 非本客户端（D5 18）+ 非 Windows OS（NR3 5）+ Linux only（D1-58 5） |
| **合计** | **`71`** | |

---

## 四、逐用例结果（已执行项，含 PASS/FAIL/BLOCKED）

> 逐用例结果已回填副本 CSV 的「执行状态」+「evidencePath」列，此处不重复全部 81 条。仅列 FAIL 和关键 P0。

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 | 备注 |
|---|---|---|---|---|---|
| `D4-3` | P0 | 明文 secret API 拦截 | FAIL | `evidence/D4-3/stdout.log` | 根因见缺陷清单 #1 |
| `D4-6` | P1 | adminPass 回显警告 | FAIL | `evidence/D4-6/stdout.log` | 根因见缺陷清单 #2 |
| `D4-1` | P0 | 凭证文件读取拦截 | PASS | `evidence/D4-1/stdout.log` | hook deny hwc-command-credential-file |
| `D4-2` | P0 | 凭证 env 打印拦截 | PASS | `evidence/D4-2/stdout.log` | hook deny hwc-command-env-dump |
| `D4-18` | P0 | confirm-not-deny 审批语义 | PASS | `evidence/D4-18/stdout.log` | allowWrites=false→deny, true→allow+warn |
| `D4-21` | P0 | hook_check_artifacts 具名回归 | PASS | `evidence/D4-21/stdout.log` | 宽泛 IAM policy 被 deny |
| `D4-22` | P0 | hook_check_deploy_plan 具名回归 | PASS | `evidence/D4-22/stdout.log` | 公网暴露+missing TTL 被 warn |

---

## 五、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | 明文 secret API 未被 hook 拦截 | `hcloud DEW CSMS ShowSecret --plaintext=true` 应返回 `deny` 或 `warn` | 返回 `allow`，findings 为空 | `safety-policy.mjs` classifyTextCommand 未覆盖 DEW CSMS ShowSecret --plaintext 模式 | P | 待提单 |
| 2 | P1 | `D4-6` | adminPass 明文密码未触发回显警告 | `hcloud ECS CreateServers --adminPass=xxx` 应返回 `warn`（plaintext in shell history） | 返回 `allow`，findings 为空 | `safety-policy.mjs` classifyTextCommand 未检测 --adminPass= 参数模式 | P | 待提单 |
| 3 | P1 | `EXP-E01~E15` | search_docs 路由准确率仅 13.3%（2/15） | 15 个中文自然语言查询应路由到正确服务 skill | 仅 2 个正确（E06 Redis→DCS, E09 K8s→CCE），13 个返回 0 结果或 top-1 错误 | `search_docs` 对中文语义匹配能力不足 | P | 待提单 |

### 根因详情

**#1 [P0] D4-3 明文 secret API 未被 hook 拦截**

- 期望：`hcloud DEW CSMS ShowSecret --plaintext=true` → `deny` 或 `warn`（secret 类操作）
- 实际：返回 `{"ok":true,"decision":"allow","findings":[]}`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` 的 `classifyTextCommand()` 未覆盖 `DEW CSMS ShowSecret --plaintext=true` 模式，未识别为 secret 类操作
- 证据：`evidence/D4-3/stdout.log`，复现命令 `hcloud DEW CSMS ShowSecret --plaintext=true` 实测 `allow`

**#2 [P1] D4-6 adminPass 明文密码未触发回显警告**

- 期望：`hcloud ECS CreateServers --adminPass=MyPassword123!` → `warn`（plaintext password in shell history）
- 实际：返回 `{"ok":true,"decision":"allow","findings":[]}`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` 的 `classifyTextCommand()` 未检测 `--adminPass=` 参数模式，未发出 shell history 警告
- 证据：`evidence/D4-6/stdout.log`，复现命令 `hcloud ECS CreateServers --adminPass=MyPassword123!` 实测 `allow`

**#3 [P1] EXP-E01~E15 search_docs 路由准确率仅 13.3%**

- 期望：15 个中文自然语言查询通过 `search_docs` 检索，应返回正确服务 skill 作为 top-1
- 实际：仅 2 个正确（EXP-E06 Redis→huawei-dds-dcs, EXP-E09 K8s→huawei-cce），13 个返回 0 结果或 top-1 路由错误
- 根因：`search_docs` 对中文自然语言查询的语义匹配能力不足，大量含中文服务描述的查询返回 0 结果
- 证据：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log`

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D1-5` | uninstall 会破坏当前测试环境 | 运行中环境 | 独立环境执行 |
| `D1-31` | dismiss 冷却期需跨调用持久化 | 多次会话 | 跨会话测试环境 |
| `D1-40` | 需设置 npm_config_registry=镜像 | 镜像 registry | 配置镜像后复测 |
| `D1-42` | dismiss 跨调用持久化 | 多次会话 | 跨会话测试环境 |
| `D1-45` | 兜底提示预热竞态 | 并发测试 | 并发环境 |
| `D2-16` | import 文件读取后擦除 | creds-import.json | 准备 import 文件 |
| `D4-23` | 多目标安装验证 | 多目标环境 | 多目标安装环境 |
| `D6-4` | 并发调度正确性 | 并发测试 | 并发环境 |
| `D9-9` | tools/call 超时协议语义 | 超时测试 | 超时测试环境 |
| `D10-5` | 多轮任务完成率 | 多轮对话 | 多轮对话测试 |
| `D1-33` | skip 文件持久化 | 跨调用测试 | 跨调用环境 |
| `D6-1` | 检索响应延迟 | 性能测试 | 性能测试环境 |
| `D6-3` | MCP 冷启时间 | 重启测试 | 重启环境 |
| `D9-7` | 协议版本协商降级 | 多版本测试 | 多版本环境 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`（show_profile_redacted 全部返回 `<redacted>`）
- [x] 写操作误判 read-only：`0`（DeleteServers/CreateServers 均正确判定 write）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | N/A | N/A（本轮未创建真云资源） |

> 本轮测试全部为 MCP 工具调用和 hook 策略验证，未创建任何真云资源。

---

## 九、遗留与建议

- 待提单缺陷：`D4-3`（P0，明文 secret API 未拦截）、`D4-6`（P1，adminPass 未警告）、`EXP-E01~E15`（P1，search_docs 路由准确率 13.3%）
- 本轮未覆盖：真云 E2E、多终端矩阵（Linux/macOS）、审批流实时对话框、并发调度、超时协议
- 建议：在 `safety-policy.mjs` 中增加对 `DEW CSMS ShowSecret --plaintext=true` 和 `--adminPass=` 参数的 hook 规则；改进 `search_docs` 中文语义匹配能力