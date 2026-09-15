# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 18:11（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（10 项缺陷在 v1.1.4 稳定版复现，与上游已有 issue 全部一致，本轮不重复提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（aarch64，Ubuntu 6.8 内核，ecs-hd-ai-work-00-0007） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11.15 |
| 被测版本（SUT） | `v1.1.4`（npm latest 正式版，gitHead `9b67256`，release-1.1.4） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，含 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | hcloud 7.2.12 / 运行时依赖仅 undici |
| 真云凭证 | session 级已配置；实测 `APIGW.0301 Unauthorized`（无效），真云 E2E 类用例 BLOCKED |
| 测试类型 | 源码级断言库（96+ 断言）/ 真机 CLI（install/doctor/status/update/uninstall/install-hcloud）/ MCP 协议 stdio / hook 双路径（Node+Py）/ 白名单 PTY 真机 / 文档与静态补充探针 |
| daily 基础用例 | 设计级 77 / 展开级 26（按 Hermes+Linux 预筛后，已剔除 23 条非本客户端/OS） |

> **执行方法**：复用源码级断言库 `_lib/hdk-asserts.mjs`（直调 `hdk/plugins/huaweicloud-core/src/*`，证据落 `evidence/<case-id>/stdout.log`）；CLI/hook/协议/白名单/文档探针落 `evidence/*-stdout.txt`；本轮全量重新执行，证据为最新。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily 设计+展开） | `103` |
| 已执行（PASS+FAIL+SPEC） | `98` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `76 / 21 / 5 / 1 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `77.6%` |
| P0 / P1 / P2 复现缺陷 | `4 / 3 / 2`（+1 SPEC） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未实际创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级（77）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `62` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 缺陷 #1–#9（详见缺陷清单） |
| BLOCKED | `5` | 真云凭证无效/Windows 专属/下载 Permission denied |
| SPEC-MISMATCH | `1` | 缺陷 #10（-32603 vs -32601） |
| NOT_RUN | `0` | — |
| **合计** | **`77`** | |

### 3.2 展开级（26）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `14` | D5 客户端矩阵 2 条 + EXP-E 命中 3 条 + NR3 Linux 4 条 + D1-58 白名单 5 条 |
| FAIL | `12` | EXP-E* 中文路由 12 条（缺陷 #7） |
| BLOCKED | `0` | 已按 Hermes+Linux 预筛，其他客户端/OS 不再下发 |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`26`** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY`/`echo $HW_ACCESS_KEY` → `deny` | 返回 `allow`，`HW_` 前缀未拦截（2/6） | `safety-policy.mjs:336` | 已提单(复现) |
| 2 | P0 | `D4-16` | 命令包裹/替换穿透写拦截 | `bash -c 'hcloud ECS DeleteServers'` → `deny` | 返回 `allow`，0/4 拦截 | `safety-policy.mjs:345` | 已提单(复现) |
| 3 | P0 | `D2-4` | 小写 ak=/sk= 脱敏遗漏 | `redact('ak=AK123 sk=SKsecret')` → `<redacted>` | 返回原文 | `safety-policy.mjs:45` | 已提单(复现) |
| 4 | P0 | `D4-23` | 全局规则未注入安装目标 | install 后 11 目标含 `huawei-agent-rules.md` | 全目录无该文件 | `setup-cli.mjs`（未复制 `rules/`） | 已提单(复现) |
| 5 | P1 | `D4-8` | Python/Node 安全钩子策略不一致 | Py 与 Node 对写操作一致 `deny` | Node deny、Py 放行 | `huaweicloud-safety.py` | 已提单(复现) |
| 6 | P1 | `D4-17` | hook 畸形输入 fail-open | 畸形 JSON → 拒绝（fail-closed） | 静默放行 | `huaweicloud-safety.mjs:45-48` | 已提单(复现) |
| 7 | P1 | `D10-3`+`EXP-E*` | 中文意图路由未命中 | 中文意图命中服务 | 12/15 miss | `tools.mjs:1776-1892` | 已提单(复现) |
| 8 | P2 | `D2-11` | R2 冲突门先于 R3 STS 检查 | STS persist 立即 `rejected` | 先 `needs_confirmation` | `tools.mjs:1214` | 已提单(复现) |
| 9 | P2 | `D8-1` | 文档宣称 39 工具 vs 实现 40 | 文档工具数与实现一致 | AGENTS.md 仍写 39 | `AGENTS.md:27,45` | 已提单(复现) |
| 10 | SPEC | `D9-2` | JSON-RPC 错误码漂移 | 未知方法 → `-32601` | `-32603` | `mcp-server.mjs:169` | 已提单(复现) |

### 根因详情（关键 P0/P1）

```markdown
**#1 [P0] D4-2 凭证 env 打印拦截不完整**
- 期望：printenv HW_ACCESS_KEY / echo $HW_ACCESS_KEY → deny
- 实际：返回 allow（仅 HUAWEICLOUD/HWC_/HCLOUD/OS_ 前缀命中 deny，2/6 拦截）
- 根因：safety-policy.mjs:336  /HUAWEICLOUD|HWC_|HCLOUD|OS_/i 未覆盖 HW_ACCESS_KEY/HW_SECRET_KEY 的 HW_ 前缀

**#2 [P0] D4-16 命令包裹穿透**
- 根因：safety-policy.mjs:345  /(^|\s)hcloud(\.exe)?\s+/i 仅匹配行首/空白后 hcloud
- 绕过向量：bash -c / sh -c / eval / $(...) 全部 allow（0/4 拦截）

**#3 [P0] D2-4 小写 ak/sk 脱敏遗漏**
- 根因：safety-policy.mjs:45  .replace(/(AK|SK)\s*[:=]\s*(...)/g) 大小写敏感无 /i，obsutilconfig 小写 ak=/sk= 漏网

**#4 [P0] D4-23 全局规则孤岛**
- rules/ 存在但零引用；setup-cli.mjs 安装复制清单未含 rules/，install --target hermes 后全目录无 huawei-agent-rules.md

**#7 [P1] D10-3 中文意图路由**
- 根因：tools.mjs serviceCatalog 关键词表仅英文，15 条中文评测意图 12 条 miss
```

---

## 五、阻塞项与未执行用例（供维护 agent 修改用例）

> 本轮无 NOT_RUN。BLOCKED 5 条逐条列出（含分类与是否需改用例/补环境/调归属）。

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-B3` | 设计级 | P1 | BLOCKED | 补环境 | 真云凭证无效（`APIGW.0301 Incorrect IAM authentication information: Unauthorized`，实测 tools-stdout.txt），run_readonly 无法执行 | — |
| `D4-13` | 设计级 | P1 | BLOCKED | 补环境 | 需只读 IAM AK/SK 验证最小权限通过率，当前凭证无效 | 补有效凭证后复测 |
| `D4-14` | 设计级 | P2 | BLOCKED | 补环境 | 需真云查 CTS 审计日志（可追溯+区分 agent/人工），当前凭证无效 | 补有效凭证后复测 |
| `D1-6` | 设计级 | P2 | BLOCKED | 补环境 | `/tmp/huaweicloud-cli-linux-arm64.tar.gz` 预置 root 文件 Permission denied，下载被拒；hcloud 7.2.12 已装，属重装更新路径受阻 | 清理预置 root 文件或改用装目录 |
| `D1-39` | 设计级 | P0 | BLOCKED | 调归属 | Windows 专属（`.cmd`/EINVAL 语义），本机 Linux；Linux 段由 EXP-NR3-10 代表已 PASS | 无需改（归属列已标 Windows） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始 AK/SK，脱敏复核通过）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（真云未实际创建资源）
- [x] 脱敏复核：`credentials.json` 未落入证据

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/沙箱/OBS 等真云资源 | 否（凭证无效未创建） | N/A | 残留 0 |
| 隔离 HOME（/tmp/hdk-cli.*、/tmp/hdk-d158*） | 是（测试用） | 已 trap 自动删除 | 残留 0 |

> 真云只删本次创建资源；本轮凭证无效，未创建任何真云资源，无残留风险。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-2`（错误码 -32603 vs -32601，建议统一为 -32601 Method not found）。
- 本轮处理：缺陷 #1–#10 在 v1.1.4 稳定版**全部复现**，与上游 `huaweicloud/huaweicloud-devkit` 已有 open issue（#674/#675/#677/#679/#681/#682/#689）一致；按「不自行处理已有 issue」约定本轮不重复提单（详见 HISTORY_LINKS.md）。
- D1-58 通用 MCP 白名单：隔离 PTY 探针 `probe-d158-fix.py` 5 断言全 PASS（merge/.bak/skip/坏 JSON 零写入/snippet 均符合），功能正确。
- 本轮未覆盖：真云 E2E（D3-B3 建删、D4-13 最小权限、D4-14 审计，凭证无效）；Windows/其他客户端矩阵（已由预筛剔除）。
- 建议：① serviceCatalog 增加中文关键词→服务映射，覆盖 D10-3/EXP-E 的 12 条 miss；② safety-policy 补 HW_ 前缀 + 包裹命令递归解析；③ AGENTS.md 工具数 39→40 同步；④ setup-cli 纳入 rules/ 复制；⑤ Python hook 补齐与 Node 对等的拦截逻辑。