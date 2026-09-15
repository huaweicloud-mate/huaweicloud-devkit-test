# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 09:16:00（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（4 项 P0 缺陷复现，1.1.4 正式版相较 next.6 未修复既有安全缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（x86_64，Ubuntu 6.8 内核） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（npm latest，gitHead `9b67256`，PR #669） |
| 工具全集 | `40`（TOOL_DEFINITIONS，含 `huaweicloud_obs_set_website_config` #347） |
| hcloud / 依赖 | hcloud 7.2.12 / 运行时依赖仅 undici ^8.10.0 |
| 真云凭证 | `configuredBySession=True`（无 securityToken）→ 实测 `APIGW.0301 Unauthorized`，真云未使用 |
| 测试类型 | 源码级探针（96 用例断言库）/ 真机 CLI（install/doctor/status/update/uninstall/install-hcloud）/ MCP 协议 stdio / hook 双路径 / 补充探针 |
| daily 基础用例 | 设计级 81 / 展开级 71（追踪表 183 行） |

> **版本变化（next.6 → 1.1.4）**：新增 `Apply*` 写操作分类（#644，`writeOperationPrefixes` 33 项含 `Apply`）、TLS 仅代理跳过校验（#667）、凭证 onboarding 指引（#665）。**昨日 next.6 的 10 项缺陷（#1–#10）在 1.1.4 均未修复。**

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily 设计+展开） | `152` |
| 已执行（PASS+FAIL+SPEC-MISMATCH） | `117` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `95 / 21 / 34 / 1 / 1` |
| 通过率（分母=PASS+FAIL+SPEC-MISMATCH） | `81.2%` |
| P0 / P1 / P2 新增缺陷 | `4 / 4 / 2`（均复现自 next.6，非新增） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未实际创建真云资源；隔离 HOME 已 trap 删除）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `64` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 缺陷 #1–#10（详见缺陷清单） |
| BLOCKED | `6` | Windows 专属 / 真云凭证无效 / 通用 MCP 非交互 |
| SPEC-MISMATCH | `1` | 缺陷 #7（-32603 vs -32601） |
| NOT_RUN | `1` | D10-5 多轮交互未覆盖 |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `31` | 服务矩阵 C4 22 条 + 路由 3 条 + D5 Hermes 2 条 + NR3 Linux 4 条 |
| FAIL | `12` | 中文路由 EXP-E* 12 条（缺陷 #8） |
| BLOCKED | `28` | 其他客户端 D5 矩阵 18 条 + NR3 Windows/macOS 5 条 + D1-58 5 条 |
| SPEC-MISMATCH | `0` | 0 |
| NOT_RUN | `0` | 0 |
| **合计** | **`71`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望（精确断言） | 实际 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY`/`echo $HW_ACCESS_KEY` → `deny` | 返回 `allow`，`HW_` 前缀未拦截 | `safety-policy.mjs:336` | 复现未修复 |
| 2 | P0 | `D4-16` | 命令包裹/命令替换穿透写拦截 | `bash -c 'hcloud ECS DeleteServers'` → `deny` | 返回 `allow`，4/4 绕过 | `safety-policy.mjs:345` | 复现未修复 |
| 3 | P0 | `D2-4` | 小写 ak=/sk= 凭证脱敏遗漏 | `redactSecrets('ak=AK123 sk=SKsecret')` → `<redacted>` | 返回原文 | `safety-policy.mjs:45` | 复现未修复 |
| 4 | P0 | `D4-23` | 全局规则未注入安装目标 | install 后含 `huawei-agent-rules.md` | 全目录无该文件 | `setup-cli.mjs`（未复制 `rules/`） | 复现未修复 |
| 5 | P1 | `D4-8` | Python/Node 安全钩子策略不一致 | Py 与 Node 对写操作一致 `deny` | Node deny、Py 放行 | `huaweicloud-safety.py:46` | 复现未修复 |
| 6 | P1 | `D4-17` | hook 畸形输入 fail-open | 畸形 JSON → 拒绝（fail-closed） | 放行（静默） | `huaweicloud-safety.mjs:45-48` | 复现未修复 |
| 7 | P1 | `D9-2` | JSON-RPC 错误码漂移 | 未知方法 → `-32601` | `-32603` | `mcp-server.mjs:169` | 待裁决 |
| 8 | P1 | `D10-3`+`EXP-E*` | 中文意图路由未命中 | 中文意图命中服务 | 12/15 miss | `tools.mjs` serviceCatalog | 复现未修复 |
| 9 | P2 | `D2-11` | R2 冲突门先于 R3 STS 检查 | STS persist 立即 `rejected` | 先 `needs_confirmation` | `tools.mjs:1214/1237` | 复现未修复 |
| 10 | P2 | `D8-1` | 文档宣称 39 工具 vs 实现 40 | 文档工具数与实现一致 | AGENTS.md 仍写 39 | `AGENTS.md:27,45` | 复现未修复 |

### 根因详情（关键 P0）

```markdown
**#1 [P0] D4-2 凭证 env 打印拦截不完整**
- 期望：env/printenv/echo 打印 HW_* 凭证环境变量 → deny
- 实际：2/6 仅 HUAWEICLOUD 前缀命中；`printenv HW_ACCESS_KEY`/`echo $HW_ACCESS_KEY` 返回 allow
- 根因：safety-policy.mjs:336 /HUAWEICLOUD|HWC_|HCLOUD|OS_/i 未覆盖 HW_ACCESS_KEY/HW_SECRET_KEY 的 HW_ 前缀
- 证据：evidence/D4-2/stdout.txt、evidence/hook-stdout.txt、evidence/security-stdout.txt

**#2 [P0] D4-16 命令包裹穿透**
- 根因：safety-policy.mjs:345 /(^|\s)hcloud(\.exe)?\s+/i 仅匹配行首/空白后 hcloud
- 绕过向量：bash -c / sh -c / eval / $(...) / 反引号 全部 allow（0/4 拦截）
- 证据：evidence/D4-16/stdout.txt

**#3 [P0] D2-4 小写 ak/sk 脱敏遗漏**
- 根因：safety-policy.mjs:45 .replace(/(AK|SK)\s*[:=]\s*(...)/g) 大小写敏感无 /i
- 实测：redactSecrets('ak=AK123456 sk=SKsecret') 返回原文
- 证据：evidence/D2-4/stdout.txt

**#4 [P0] D4-23 全局规则孤岛**
- install --target hermes 后 find 无 huawei-agent-rules.md；rules/ 未进入安装复制清单
- 证据：evidence/cli-stdout.txt（[缺] 未找到 huawei-agent-rules.md）
```

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D3-B3`/`D3-C4`/`D4-13`/`D4-14` | 真云凭证无效（`APIGW.0301 Unauthorized`，session 级无有效 SK） | 有效 AKSK + 项目配额 | 配置真云凭证后复测 |
| `D1-39` | Windows 专属升级检测链（`.cmd`/EINVAL 语义） | Windows 机器 | 补 Windows 终端 |
| `D1-58`+`EXP-D1-58-*` | 通用 MCP(Claude/Cursor) merge 需交互 option3，本机非交互多 agent 环境 auto-detect 走 hermes | 交互式 Claude/Cursor 环境 | 交互终端复测 |
| `EXP-NR3-01/03/09/23` | Windows 专属（Windows-stdio/CROSS_PROCESS 语义） | Windows 机器 | 补 Windows 终端 |
| `EXP-NR3-11` | macOS/ARM 专属 | macOS/ARM 机器 | 补 macOS 终端 |
| `EXP-D5-*`（18 条） | 其他客户端矩阵（OpenCode/Codex/... 非本机 Hermes） | 各客户端运行环境 | 各客户端各自补测 |

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
| 隔离 HOME（/tmp/hdk-cli.*、/tmp/hdk-d158.*） | 是（测试用） | 已 trap 自动删除 | 残留 0 |

---

## 八、遗留与建议

- **回归结论**：1.1.4 正式版相较 next.6 未修复这 10 项缺陷（4 P0 / 4 P1 / 2 P2），全部复现；唯 #644 `Apply*` 写操作分类已落地并实测生效（`ApplyImage` → deny）。
- 待裁决 SPEC：`D9-2`（错误码 -32603 vs -32601，建议统一为 -32601 Method not found）。
- 本轮未覆盖：真云 E2E（D3-C4 建删、D4-13/D4-14 凭证/审计，凭证无效）；多轮交互（D10-5）；通用 MCP 交互接入（D1-58）；Windows/macOS/其他客户端矩阵。
- 建议：① safety-policy 补 HW_ 前缀 + 包裹命令递归解析 + 小写 ak/sk 脱敏；② setup-cli 纳入 rules/ 复制；③ AGENTS.md 工具数 39→40 同步；④ Python 钩子与 Node 钩子策略对齐（或统一到 Node），畸形输入 fail-closed。