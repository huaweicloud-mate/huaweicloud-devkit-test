# OpenCode-glm-5.2 每日测试报告（1.1.4 正式版）

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-15 00:42:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-15-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit@1.1.4（npm latest，gitHead `9b67256`，PR #669）
> **结论**：`PARTIAL`（4 个 FAIL 缺陷，其中 3 个 P0）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows Server 2022 (x86_64)` |
| Node / npm / Python | `Node v22.22.2 / npm 10.9.7 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.4`（npm latest，gitHead `9b67256`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `doctor 确认已配置` |
| 真云凭证 | `已配置（~/.config/huaweicloud/credentials.json）` |
| 测试类型 | 源码级探针 / MCP 工具级 / C4 服务矩阵 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily 设计级） | `81` |
| 已执行 | `81` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `77 / 4 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL） | `95.1%` |
| P0 / P1 / P2 新增缺陷 | `3 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

> **与 @next 版本对比**：1.1.4 正式版与 1.1.4-next.6 基于同一 commit `9b67256`，缺陷完全一致（4 个相同缺陷）。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `77` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `0` | 无未覆盖 |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 无缺陷 |
| BLOCKED | `34` | 非 Windows / 非 OpenCode 客户端矩阵 |
| **合计** | **`71`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | echo 凭证 env 未拦截 | `deny` | `allow` | `safety-policy.mjs:335-336` | P | 待提单 |
| 2 | P0 | `D4-16` | sh -c 命令包裹穿透 | `deny` | `allow` | `safety-policy.mjs:335` | P | 待提单 |
| 3 | P0 | `D2-4` | redactSecrets 不脱敏小写 ak/sk | 不含明文 sk | 含明文 sk | `safety-policy.mjs:45` | P | 待提单 |
| 4 | P1 | `D8-4` | INSTALL.md 未包含在 npm 包 | 存在 | 不存在 | `package.json:files` | I | 待提单 |

### 根因详情

**#1 [P0] D4-2 echo 凭证 env 未拦截**
- 根因：`safety-policy.mjs:335-336` — env-dump 正则未包含 `echo` 命令；凭证前缀 `HUAWEICLOUD|HWC_|HCLOUD|OS_` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY`
- 证据：`evidence/d4-security/stdout.log`

**#2 [P0] D4-16 sh -c 命令包裹穿透**
- 根因：`safety-policy.mjs:335` — 正则 `(^|\s)` 不匹配引号内的 `printenv`
- 证据：`evidence/d4-security/stdout.log`

**#3 [P0] D2-4 redactSecrets 不脱敏小写 ak/sk**
- 根因：`safety-policy.mjs:45` — `redactString()` 正则 `/(AK|SK)\s*[:=]\s*.../g` 无 `i` 标志
- 证据：`evidence/d2-auth/stdout.log`

**#4 [P1] D8-4 INSTALL.md 未包含在 npm 包**
- 根因：`package.json` 的 `files` 字段未列出 `INSTALL.md`
- 证据：`evidence/d2-auth/stdout.log`

---

## 五、阻塞项

无阻塞项。所有 P0 用例均已执行。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证
- [x] PASS 门禁：所有 PASS 用例均有 evidencePath + 证据

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | n/a | n/a |

> 本轮为源码级探针 + MCP 工具级测试，未创建真云资源。

---

## 八、遗留与建议

- **待修复缺陷**：4 个（3 P0 + 1 P1），与 @next 版本完全一致（同一 commit）
- **本轮未覆盖**：真云 E2E 用例；展开级非 Windows/非 OpenCode 客户端矩阵（34 条 BLOCKED）
- **建议**：
  1. 优先修复 D4-2/D4-16 安全策略拦截缺口
  2. 修复 D2-4 redactSecrets 大小写敏感问题
  3. 将 INSTALL.md 加入 package.json files 字段
  4. 1.1.4 正式版与 @next 版本代码一致，缺陷未在正式版发布前修复
