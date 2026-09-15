# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 09:48（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-113.44.197.147/Linux/`
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
| 真云凭证 | `cn-north-4`（AK/SK **有效**，configuredBySession=False）→ 真云只读实测成功 |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/update/uninstall/install-hcloud）/ MCP 协议 stdio / hook 双路径 / 真云只读 |
| daily 基础用例 | 设计级 81 / 展开级 48（预筛后，71→48 剔除 23 条非 Hermes/Linux） |

> **版本变化（next.6 → 1.1.4）**：新增 `Apply*` 写操作分类（#644）、TLS 仅代理跳过校验（#667）、凭证 onboarding 指引（#665）。**昨日 next.6 的 10 项缺陷（#1–#10）在 1.1.4 均未修复。** 与上一机（113.44.143.91）同版本结论一致，本机差异为**真云凭证有效**（D3-B3 由 BLOCKED 转 PASS）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily 设计+展开，预筛后） | `129`（设计 81 + 展开 48） |
| 已执行（PASS+FAIL+SPEC-MISMATCH） | `118` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `96 / 21 / 10 / 1 / 1` |
| 通过率（分母=PASS+FAIL+SPEC-MISMATCH） | `81.4%` |
| P0 / P1 / P2 缺陷 | `4 / 4 / 2`（均复现自 next.6，非新增） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未实际创建真云资源；隔离 HOME 已 trap 删除）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `65` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 缺陷 #1–#10（详见缺陷清单） |
| BLOCKED | `5` | Windows 专属 / 真云建删受限 / 通用 MCP 非交互 |
| SPEC-MISMATCH | `1` | 缺陷 #7（-32603 vs -32601） |
| NOT_RUN | `1` | D10-5 多轮交互未覆盖 |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `31` | 服务矩阵 C4 22 条 + 路由 3 条 + D5 Hermes 2 条 + NR3 Linux 4 条 |
| FAIL | `12` | 中文路由 EXP-E* 12 条（缺陷 #8） |
| BLOCKED | `5` | D1-58 白名单矩阵 5 条（通用 MCP 非交互） |
| SPEC-MISMATCH | `0` | 0 |
| NOT_RUN | `0` | 0 |
| **合计** | **`48`** | |

> 展开级相较上一机（71 条）为 48 条：init_day 已按「Hermes/Linux」预筛剔除 23 条非本客户端/OS（其他客户端 D5 矩阵 18 条 + NR3 Windows/macOS 5 条），不再由 agent 逐条标 BLOCKED。

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望（精确断言） | 实际 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY`/`echo $HW_ACCESS_KEY` → `deny` | 返回 `allow`，`HW_` 前缀未拦截（2/6） | `safety-policy.mjs:336` | 复现未修复 |
| 2 | P0 | `D4-16` | 命令包裹/命令替换穿透写拦截 | `bash -c 'hcloud ECS DeleteServers'` → `deny` | 返回 `allow`，0/4 拦截 | `safety-policy.mjs:345` | 复现未修复 |
| 3 | P0 | `D2-4` | 小写 ak=/sk= 凭证脱敏遗漏 | `redactSecrets('ak=... sk=...')` → `<redacted>` | 返回原文 | `safety-policy.mjs:45` | 复现未修复 |
| 4 | P0 | `D4-23` | 全局规则未注入安装目标 | install 后含 `huawei-agent-rules.md` | 全目录无该文件 | `setup-cli.mjs`（未复制 rules/） | 复现未修复 |
| 5 | P1 | `D4-8` | Python/Node 安全钩子策略不一致 | Py 与 Node 对写操作一致 deny | Node deny、Py 放行 | `huaweicloud-safety.py:46` | 复现未修复 |
| 6 | P1 | `D4-17` | hook 畸形输入 fail-open | 畸形 JSON → deny（fail-closed） | 放行（静默） | `huaweicloud-safety.mjs:45-48` | 复现未修复 |
| 7 | P1 | `D9-2` | JSON-RPC 错误码漂移 | 未知方法 → `-32601` | `-32603` | `mcp-server.mjs:169` | 待裁决 |
| 8 | P1 | `D10-3`+`EXP-E*` | 中文意图路由未命中 | 中文意图命中服务 | 12/15 miss | `tools.mjs:1776` serviceCatalog | 复现未修复 |
| 9 | P2 | `D2-11` | R2 冲突门先于 R3 STS 检查 | STS persist 立即 rejected | 先 needs_confirmation | `tools.mjs:1214-1237` | 复现未修复 |
| 10 | P2 | `D8-1` | 文档宣称 39 工具 vs 实现 40 | 文档工具数与实现一致 | AGENTS.md 仍写 39 | `AGENTS.md:27,45` | 复现未修复 |

### 根因详情（关键 P0）

```markdown
**#1 [P0] D4-2 凭证 env 打印拦截不完整**
- 期望：env/printenv/echo 打印 HW_* 凭证环境变量 → deny
- 实际：仅 HUAWEICLOUD 前缀命中；printenv HW_ACCESS_KEY/echo $HW_ACCESS_KEY/HW_SECRET_KEY 返回 allow
- 根因：safety-policy.mjs:336 /HUAWEICLOUD|HWC_|HCLOUD|OS_/i 未覆盖 HW_ 前缀
- 证据：evidence/D4-2/stdout.txt、evidence/security-stdout.txt、evidence/hook-stdout.txt

**#2 [P0] D4-16 命令包裹穿透**
- 根因：safety-policy.mjs:345 /(^|\s)hcloud(\.exe)?\s+/i 仅匹配行首/空白后 hcloud
- 实测：bash -c / sh -c / eval / $(...) 全部 allow（0/4 拦截）
- 证据：evidence/D4-16/stdout.txt

**#3 [P0] D2-4 小写 ak/sk 脱敏遗漏**
- 根因：safety-policy.mjs:45 .replace(/(AK|SK).../g) 大小写敏感无 /i
- 实测：redactSecrets('ak=AK123456 sk=SKsecret') 返回原文；AK=/SK= 大写正常脱敏
- 证据：evidence/D2-4/stdout.txt

**#4 [P0] D4-23 全局规则孤岛**
- install --target hermes 后 find 无 huawei-agent-rules.md；rules/ 未进入安装复制清单
- 证据：evidence/cli-stdout.txt（[缺] 未找到 huawei-agent-rules.md）
```

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D3-C4` | 服务创建类回归需真云建删资源（20+服务），仅做只读规划冒烟（EXP-C4-01~22 全 PASS）+ 真云只读实证 | 共享账号 + 建删配额 | 低权限隔离账号后复测 |
| `D4-13` | 最小权限凭证通过率需多套只读/写 IAM 凭证矩阵 | 多套 IAM 凭证 | 配置只读最小权限 AKSK |
| `D4-14` | 操作可审计性需真云 CTS 审计（建删+审计日志） | CTS 服务 + 建删 | 真云建删 + CTS 查询 |
| `D1-39` | Windows 专属升级检测链（`.cmd`/EINVAL 语义） | Windows 机器 | 补 Windows 终端 |
| `D1-58`+`EXP-D1-58-*` | 通用 MCP(Claude/Cursor) merge 需交互 option3 | 交互式 Claude/Cursor 环境 | 交互终端复测 |

> 本机与上一机关键差异：**真云凭证有效**，`D3-B3`（run_readonly 真云只读）已由 BLOCKED 转 **PASS**（`hcloud ecs ListServersDetails` exitCode=0、count=0、servers=[]）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始 AK/SK，脱敏复核通过）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（真云未实际创建资源；仅只读）
- [x] 脱敏复核：`credentials.json` 未落入证据

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/沙箱/OBS 等真云资源 | 否（仅真云只读，未建删） | N/A | 残留 0 |
| 隔离 HOME（/tmp/hdk-cli.*、/tmp/hdk-d158.*、/tmp/hdk-probe-*） | 是（测试用） | 已 trap/脚本删除 | 残留 0 |

---

## 八、遗留与建议

- **回归结论**：1.1.4 正式版相较 next.6 未修复这 10 项缺陷（4 P0 / 4 P1 / 2 P2），全部复现；#644 `Apply*` 写操作分类已落地（D4-5 无误判）。均已并入上游 #650/#651，本轮不重复提单。
- 待裁决 SPEC：`D9-2`（错误码 -32603 vs -32601，建议统一为 -32601 Method not found）。
- 本轮未覆盖：真云跨服务建删（D3-C4/D4-14，凭证有效但共享账号风险控制）；多套凭证矩阵（D4-13）；多轮交互（D10-5）；通用 MCP 交互接入（D1-58）；Windows 变体（D1-39）。
- 建议：① safety-policy 补 `HW_` 前缀 + 包裹命令递归解析 + 小写 ak/sk 脱敏；② setup-cli 纳入 rules/ 复制；③ AGENTS.md 工具数 39→40 同步；④ Python 钩子与 Node 钩子策略对齐，畸形输入 fail-closed。