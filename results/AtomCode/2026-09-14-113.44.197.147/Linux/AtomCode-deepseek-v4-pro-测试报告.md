# AtomCode-deepseek-v4-pro 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-测试报告.md`
> **生成时间**：`2026-09-14 23:00:00`（北京时间）
> **执行归档**：`results/AtomCode/2026-09-14-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 4 个 P0 + 1 个 P1 缺陷，不得写 PASS/PARTIAL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4-next.6`（npm @next，gitHead `69ac7279`，PR #663） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已配置（`~/bin/hcloud`） |
| 真云凭证 | 已配置（`~/.config/huaweicloud/credentials.json`）；本轮未发起真云写/创建资源 |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<domain>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `152`（设计级 81 + 展开级 71） |
| 已执行（设计级 + 展开级） | `152`（全量回填，无 NOT_RUN/空） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `92 / 5 / 55 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `94.8%`（92/97） |
| P0 / P1 / P2 新增缺陷 | `4 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `未创建真云资源，无残留` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `60` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | D4-2 / D4-16 / D4-21 / D4-23 / D9-2（根因见缺陷清单） |
| BLOCKED | `16` | 环境阻塞（安装/生命周期/真云/LLM/CTS/SBOM 等，见阻塞项） |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `32` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | |
| BLOCKED | `39` | 环境阻塞（他客户端矩阵/LLM 评测/交互 install/macOS） |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`71`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整（HW_ 前缀） | `printenv HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow`，`HW_` 前缀未拦截 | `safety-policy.mjs:336` | P | 已提单 #650/#651/#652 |
| 2 | P0 | `D4-16` | 命令包裹穿透（sh -c） | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny` | 返回 `allow` | `safety-policy.mjs:335` | P | 已提单 #650/#652 |
| 3 | P0 | `D4-21` | IaC broad IAM 缺口（HCL actions=["*"]） | `evaluateArtifacts(huaweicloud_iam_policy actions=["*"])` 应 `deny` | findings 空、decision=allow | `cloud-risk-rules.json:192` | P | 已提单 #651/#652 |
| 4 | P0 | `D4-23` | 全局规则 kms Decrypt 直连未识别为 secret | `hcloud kms Decrypt` 应 `deny`/`secret` | `allow`/`unknown_read` | `policy.json:26` + `safety-policy.mjs:177,300` | P | 已跟踪 #650/#651 |
| 5 | P1 | `D9-2` | JSON-RPC 错误码未区分 -32601/-32603 | 未知 method 应返回 `-32601` | 统一返回 `-32603` | `mcp-server.mjs:169` | P | 已提单 #650/#652 |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截不完整**：`plugins/huaweicloud-core/src/safety-policy.mjs:336`——env-dump 检测正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀。证据 `evidence/d4-security/stdout.log`。

**#2 [P0] D4-16 命令包裹穿透**：`plugins/huaweicloud-core/src/safety-policy.mjs:335`——`(^|\s)(env|...)` 单词边界匹配原始文本，`sh -c "env ..."` 内层 `env` 前是引号未命中，未递归解包 shell 包裹。证据 `evidence/d4-security/stdout.log`。

**#3 [P0] D4-21 IaC broad IAM 拦截缺口**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:192`（规则 `hwc-iam-admin-policy` L179）——IAM 正则只覆盖 JSON 形态 `"Action":"*"`/`Action=`，未覆盖 Terraform HCL 小写 `actions = ["*"]` 块语法。证据 `evidence/d4-security-core/stdout.log`。

**#4 [P0] D4-23 全局规则注入生效性缺口**：`plugins/huaweicloud-core/safety/policy.json:26` `blockedSecretOperations` 仅含 `["ShowSecretVersion","DownloadSecret","GetSecretValue"]`，未含 `Decrypt`；`safety-policy.mjs:177` 的 secret 正则未含 `decrypt`，故 `hcloud kms Decrypt` 落入 `safety-policy.mjs:300` 的 `unknown_read`（allow）。全局规则 `rules/huawei-agent-rules.mdc` 的「MUST NOT call kms decrypt」未被强制执行。证据 `evidence/d4-rules/stdout.log`。

**#5 [P1] D9-2 JSON-RPC 错误码**：`plugins/huaweicloud-core/src/mcp-server.mjs:169`——runStdioServer 的 catch 对所有异常统一 `code: -32603`，未按规范区分方法不存在 `-32601`。证据 `evidence/d9-protocol/stdout-d9-mcp-protocol.log`。

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D1-1/2/5/6`, `D7-4` | run-only 每日测试不执行破坏性全局安装/卸载/改源 | 隔离 HOME + 全局 install 权限 | 独立 install 生命周期窗口 |
| `D1-58`, `EXP-D1-58-*` | 需交互式 install 菜单 option3 白名单探测 | 交互 PTY + install 菜单 | 提供 PTY 环境 |
| `D3-B3`, `D4-13`, `D3-C4` | 需真实华为云资源创建/销毁（红线：最低配置→测后删除→归零验证） | 可销毁云配额 + 各服务 min 配置 | 配额/白名单到位 |
| `D10-3/5`, `EXP-E*` | 需 LLM 评测/多轮自主执行环境 | LLM 评测 harness | 接入评测环境 |
| `D4-8` | Python hook 路径本机未携带，无法做 Python/Node 同源策略对比 | Python hook 安装 | 安装 Python hook |
| `D4-12` | 供应链/依赖锁定/SBOM 审计需独立 CI + npm audit 全量核对 | 独立 CI | CI 接入 |
| `D4-14` | 操作可审计性需真实 CTS 审计记录 | 真云 CTS | 审计场景就绪 |
| `D9-5` | stdio 大 payload/断连恢复需真实 MCP 传输子进程压测 | MCP 传输 harness | 压测环境 |
| `D9-6` | 需其他客户端/Inspector/多机环境 | 多机矩阵 | 多客户端就绪 |
| `EXP-D5-*`（18 行） | 其他客户端 D5 矩阵枚举，需对应客户端自行执行 | 对应客户端 | 各客户端独立执行 |
| `EXP-NR3-11` | 无 macOS 机器，声明支持的 macOS 路径无证据 | macOS 机器 | macOS 到位 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针全程无明文 AK/SK 输出，脱敏验证 D2-4 PASS）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/沙箱/OBS 等真云资源 | 否 | 不适用 | 本轮未发起真云写/创建，无残留 |

---

## 八、遗留与建议

- 待裁决 SPEC：`无`
- 本轮未覆盖（说明范围）：真云 E2E（D3-C4 / EXP-C4 部分写路径）、LLM 评测集（D10-3/5 / EXP-E*）、install 生命周期（D1-1/2/5/6）、多终端矩阵（EXP-D5 其余客户端 / EXP-NR3-11 macOS）、CTS/SBOM 审计（D4-12/14）
- 建议：`D4-2` env-dump 正则补 `HW_(ACCESS|SECRET)_KEY`；`D4-16` 对 shell 包裹先解包内层再分类；`D4-21` 的 `hwc-iam-admin-policy` 补 HCL `actions\s*=\s*\[\s*"\*"` 形态；`D4-23` 将 `Decrypt` 纳入 `blockedSecretOperations` 或 secret 正则；`D9-2` stdio 层按 `Unsupported method` 区分 -32601 与 -32603。