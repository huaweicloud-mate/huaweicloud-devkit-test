# AtomCode-deepseek-v4-pro 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-测试报告.md`
> **生成时间**：`2026-09-14 07:15:25`（北京时间）
> **执行归档**：`results/AtomCode/2026-09-14-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 3 个 P0 + 1 个 P1 缺陷，不得写 PASS/PARTIAL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `3b6290bc`，PR #647） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已配置（`~/bin/hcloud`）；doctor 自检 11 pass / 0 warn / 0 fail |
| 真云凭证 | 已配置（`~/.config/huaweicloud/credentials.json`）；本轮未发起真云写/创建资源 |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status/version） / MCP 协议 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<domain>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `152`（设计级 81 + 展开级 71） |
| 已执行 | `42`（设计级 42；展开级为多终端/真云枚举，本轮未展开复测） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `37 / 4 / 1 / 0 / 110` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `90.2%`（37/41） |
| P0 / P1 / P2 新增缺陷 | `3 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `未创建真云资源，无残留` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | D4-2 / D4-16 / D4-21 / D9-2（根因见缺陷清单） |
| BLOCKED | `1` | D3-C4 真云服务创建类回归（见阻塞项） |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `39` | 本轮未覆盖（真云 E2E / 多终端 / 审批流实时对话框 / 性能 / 安装生命周期等） |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `0` | |
| FAIL | `0` | |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `71` | 展开级=多终端矩阵(D5 20/服务矩阵 22/评测集 15/NR3 终端 9/白名单 5)枚举，本轮未展开复测 |
| **合计** | **`71`** | |

---

## 四、逐用例结果（已执行项）

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 | 备注 |
|---|---|---|---|---|---|
| `D4-2` | P0 | 凭证 env 打印拦截 | FAIL | `evidence/d4-security/stdout.log` | 缺陷 #1 |
| `D4-16` | P0 | 命令包裹穿透 | FAIL | `evidence/d4-security/stdout.log` | 缺陷 #2 |
| `D4-21` | P0 | hook_check_artifacts 具名回归 | FAIL | `evidence/d4-security-core/stdout.log` | 缺陷 #3 |
| `D9-2` | P1 | JSON-RPC 错误码 | FAIL | `evidence/d9-protocol/stdout-d9-mcp-protocol.log` | 缺陷 #4 |
| `D2-11` | P0 | R3 STS token 拒绝落盘 | PASS | `evidence/d2-auth/stdout-d2-auth.log` | |
| `D4-1` | P0 | 凭证文件读取拦截 | PASS | `evidence/d4-security/stdout.log` | |
| `D4-3` | P0 | 明文 secret API 拦截 | PASS | `evidence/d4-security/stdout.log` | |
| `D4-5` | P0 | 写操作误判检测 | PASS | `evidence/d4-security/stdout.log` | |
| `D4-9` | P0 | 公开暴露/破坏性预检 | PASS | `evidence/d4-security/stdout.log` | |
| `D4-15` | P0 | hook 绕过尝试 | PASS | `evidence/d4-security/stdout.log` | |
| `D4-22` | P0 | hook_check_deploy_plan 具名回归 | PASS | `evidence/d4-security/stdout.log` | |
| `D1-40` | P0 | 镜像 lag 下检测正确性 | PASS | `evidence/d1-upgrade/stdout.log` | |
| `D2-4` | P0 | 凭证脱敏正确性 | PASS | `evidence/d4-security/stdout.log` | |
| `D8-7` | P0 | 7 个 meta/通用技能可机械执行 | PASS | `evidence/d8-skills/stdout.log` | |
| `D10-4` | P0 | 安全干预有效性 | PASS | `evidence/d8-skills/stdout.log` | |
| `D1-3` | P1 | doctor 健康自检 | PASS | `evidence/cli/stdout.log` | 11 pass / 0 fail |
| `D1-26` | P1 | 升级提醒工具注册与协议暴露 | PASS | `evidence/d2-auth/stdout.log` | 11 安装目标枚举 |
| `D1-27` | P1 | 检测语义-已是最新 | PASS | `evidence/d1-upgrade/stdout.log` | |
| `D1-28` | P1 | 检测语义-有新版本 | PASS | `evidence/d1-upgrade/stdout.log` | |
| `D1-31` | P1 | dismiss 冷却期 | PASS | `evidence/d1-upgrade/stdout.log` | |
| `D1-45` | P1 | 兜底提示真实序列与预热竞态 | PASS | `evidence/d1-upgrade/stdout.log` | |
| `D2-1` | P1 | auth init 三端同步 | PASS | `evidence/d2-auth/stdout.log` | |
| `D2-5` | P1 | 凭证缺失报错指引 | PASS | `evidence/d2-auth/stdout.log` | |
| `D2-13` | P1 | R9 configuredBySession 优先 env | PASS | `evidence/d2-auth/stdout.log` | |
| `D3-A1` | P1 | skill 检索完整性 | PASS | `evidence/d5-tools/stdout.log` | |
| `D4-4` | P1 | 写操作审批门 | PASS | `evidence/d4-security/stdout.log` | |
| `D4-20` | P1 | 拒绝后零操作 | PASS | `evidence/d4-security/stdout.log` | |
| `D5-1` | P1 | 清单发现加载 | PASS | `evidence/d5-tools/stdout.log` | |
| `D5-3` | P1 | 工具全量枚举 | PASS | `evidence/d5-tools/stdout.log` | 39 工具 |
| `D9-1` | P1 | tools/list 合规 | PASS | `evidence/d9-protocol/stdout.log` | |
| `D9-3` | P1 | tools/call 响应格式 | PASS | `evidence/d9-protocol/stdout.log` | |
| `D9-4` | P1 | 协议生命周期 | PASS | `evidence/d9-protocol/stdout.log` | |
| `D10-1` | P1 | 工具描述可选择性 | PASS | `evidence/d8-skills/stdout.log` | |
| `D10-2` | P1 | skill 激活率 | PASS | `evidence/d8-skills/stdout.log` | |
| `D1-4` | P2 | status/update 幂等 | PASS | `evidence/cli/stdout.log` | status 读幂等 |
| `D1-30` | P2 | semver 比对正确性 | PASS | `evidence/d1-upgrade/stdout.log` | |
| `D2-2` | P2 | auth status 判定准确性 | PASS | `evidence/d2-auth/stdout-d2-auth.log` | |
| `D3-B1` | P2 | list_operations 规范名 | PASS | `evidence/d5-tools/stdout.log` | |
| `D3-B5` | P2 | detect_framework 识别 | PASS | `evidence/d5-tools/stdout.log` | Next.js 识别 |
| `D8-1` | P2 | 文档与能力一致 | PASS | `evidence/d8-skills/stdout.log` | |
| `D9-7` | P2 | 协议版本协商降级 | PASS | `evidence/d9-protocol/stdout.log` | |
| `D3-C4` | P1 | 服务创建类回归 | BLOCKED | — | 真云 E2E（见阻塞项） |

> 逐用例结果与副本 CSV「执行状态」+「evidencePath」列一致（同源）。

---

## 五、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整（HW_ 前缀） | `printenv HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow` | `safety-policy.mjs:335-336` | P | 待提单 |
| 2 | P0 | `D4-16` | 命令包裹穿透（sh -c） | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny` | 返回 `allow` | `safety-policy.mjs:335` | P | 待提单 |
| 3 | P0 | `D4-21` | IaC broad IAM 缺口（HCL actions=["*"]） | `evaluateArtifacts(huaweicloud_iam_policy actions=["*"])` 应 `deny` | findings 空、decision=allow | `cloud-risk-rules.json:179` | P | 待提单 |
| 4 | P1 | `D9-2` | JSON-RPC 错误码未区分 -32601/-32603 | 未知 method 应返回 `-32601` | 统一返回 `-32603` | `mcp-server.mjs:169` | P | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截不完整**：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336`——env-dump 检测正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀。证据 `evidence/d4-security/stdout.log`。

**#2 [P0] D4-16 命令包裹穿透**：`plugins/huaweicloud-core/src/safety-policy.mjs:335`——`(^|\s)(env|...)` 单词边界匹配原始文本，`sh -c "env ..."` 内层 `env` 前是引号未命中，未递归解包 shell 包裹。证据 `evidence/d4-security/stdout.log`。

**#3 [P0] D4-21 IaC broad IAM 拦截缺口**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179`（规则 `hwc-iam-admin-policy`）——IAM 正则只覆盖 JSON 形态 `"Action":"*"`/`Action=`，未覆盖 Terraform HCL 小写 `actions = ["*"]` 块语法。证据 `evidence/d4-security-core/stdout.log`。

**#4 [P1] D9-2 JSON-RPC 错误码**：`plugins/huaweicloud-core/src/mcp-server.mjs:169`——stdio 层 catch 对所有异常统一 `code: -32603`，未按规范区分方法不存在 `-32601`。证据 `evidence/d9-protocol/stdout-d9-mcp-protocol.log`。

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D3-C4` | 真云服务创建类回归需按红线「最低配置创建→测后删除→归零验证」 | 需可销毁真实云配额 + 逐个服务 min 配置 | 配额/白名单到位后复测 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针全程无明文 AK/SK 输出，脱敏验证 D2-4 PASS）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/沙箱/OBS 等真云资源 | 否 | 不适用 | 本轮未发起真云写/创建，无残留 |

---

## 九、遗留与建议

- 待裁决 SPEC：`无`
- 本轮未覆盖（说明范围）：真云 E2E（D3-C4 / 展开级 EXP-C4-01~22 / EXP-E01~15）、多终端矩阵（EXP-D5 客户端矩阵 / EXP-NR3 OS 矩阵）、审批流实时对话框（D4-18/19/23/24）、install/uninstall 生命周期（D1-1/2/5/6）、性能与时延（D6 全系）、跨客户端互通（D9-6）、多轮任务完成率（D10-5）
- 建议：`D4-2` env-dump 正则补 `HW_ACCESS_KEY|HW_SECRET_KEY|HW_(ACCESS|SECRET)_KEY`；`D4-16` 对 shell 包裹先解包内层再分类；`D4-21` 的 `hwc-iam-admin-policy` 补 HCL `actions\s*=\s*\[\s*"\*"` 形态；`D9-2` stdio 层按 `Unsupported method` 区分 -32601 与 -32603。