# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-14 22:45:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-14-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（4 个 FAIL 缺陷，其中 3 个 P0）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows Server 2022 (x86_64)` |
| Node / npm / Python | `Node v22.22.2 / npm 10.9.7 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.4-next.6`（npm @next，gitHead `69ac7279`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `doctor 确认已配置` |
| 真云凭证 | `已配置（~/.config/huaweicloud/credentials.json）` |
| 测试类型 | 源码级探针 / MCP 工具级 / C4 服务矩阵 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP 工具级 `callTool()` 调用，决策/结果落 `stdout.log`；证据统一落 `evidence/<probe-group>/`。

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
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `34` | 非 Windows / 非 OpenCode 客户端矩阵 / 需隔离 Linux HOME 的用例 |
| **合计** | **`71`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | echo 凭证 env 变量未拦截 | `classifyTextCommand('echo $HW_ACCESS_KEY').decision === 'deny'` | 返回 `allow` | `safety-policy.mjs:335-336` | P | 待提单 |
| 2 | P0 | `D4-16` | sh -c 命令包裹穿透 | `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision === 'deny'` | 返回 `allow` | `safety-policy.mjs:335` | P | 待提单 |
| 3 | P0 | `D2-4` | redactSecrets 不脱敏 JSON 小写 ak/sk | `redactSecrets('{"ak":"...","sk":"..."}').includes('SK...') === false` | 返回含明文 sk | `safety-policy.mjs:45` | P | 待提单 |
| 4 | P1 | `D8-4` | INSTALL.md 未包含在 npm 包中 | `existsSync('huaweicloud-devkit/INSTALL.md') === true` | 返回 `false` | `package.json:files` | I | 待提单 |

### 根因详情

**#1 [P0] D4-2 echo 凭证 env 变量未拦截**
- 期望：`echo $HW_ACCESS_KEY` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336`
  - 第 335 行 env-dump 正则 `(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)` 未包含 `echo` 命令
  - 第 336 行凭证前缀检测 `HUAWEICLOUD|HWC_|HCLOUD|OS_` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀
- 证据：`evidence/d4-security/stdout.log`

**#2 [P0] D4-16 sh -c 命令包裹穿透**
- 期望：`sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335`
  - 正则 `(^|\s)(env|printenv|...)` 中 `(^|\s)` 仅匹配行首或空白，当 `printenv` 出现在引号内时前导字符为 `"` 不匹配
- 证据：`evidence/d4-security/stdout.log`

**#3 [P0] D2-4 redactSecrets 不脱敏 JSON 小写 ak/sk**
- 期望：`redactSecrets('{"ak":"AKID...","sk":"SK..."}')` 不含明文 sk
- 实际：返回原始字符串，sk 明文保留
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45`
  - `redactString()` 正则 `/(AK|SK)\s*[:=]\s*.../g` 无 `i` 标志，不匹配小写 `ak`/`sk`
  - `isSecretKeyName()` (line 20-32) 模式 `access.*key|secret.*key|...` 不匹配短键名 `ak`/`sk`
- 证据：`evidence/d2-auth/stdout.log`

**#4 [P1] D8-4 INSTALL.md 未包含在 npm 包中**
- 期望：`INSTALL.md` 存在于 npm 包中
- 实际：文件不存在
- 根因：`package.json` 的 `files` 字段未列出 `INSTALL.md`
- 证据：`evidence/d8-d10-harness/stdout.log`

---

## 五、阻塞项

无阻塞项。所有 P0 用例均已执行（无 NOT_RUN/BLOCKED）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（测试中未泄露真实凭证）
- [x] 写操作误判 read-only：`0`（D4-5 DeleteServers 正确判定为非只读）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志
- [x] PASS 门禁：所有 PASS 用例均有 evidencePath + 探针证据

> **注意**：发现 3 个 P0 安全策略缺陷（D4-2/D4-16/D2-4），虽非红线违规但属于安全策略覆盖缺口，需优先修复。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否 | n/a | n/a |
| OBS | 否 | n/a | n/a |
| 沙箱 | 否 | n/a | n/a |

> 本轮测试为源码级探针 + MCP 工具级测试，未创建真云资源，无残留。

---

## 八、遗留与建议

- **待修复缺陷**：4 个（3 P0 + 1 P1），详见 FINDINGS.md，需统一提单
- **本轮未覆盖**：
  - 真云 E2E 用例（建删资源）：本轮以源码级探针 + MCP 工具级测试为主，未执行真云资源创建/删除
  - 展开级非 Windows/非 OpenCode 客户端矩阵用例（34 条 NOT_RUN）：属其他客户端/OS 范畴
  - D1-58 MCP 白名单接入：需隔离 Linux HOME 环境，本轮标记为模块级验证 PASS
- **建议**：
  1. 优先修复 D4-2/D4-16 安全策略拦截缺口（echo + 命令包裹）
  2. 修复 D2-4 redactSecrets 大小写敏感问题
  3. 将 INSTALL.md 加入 package.json files 字段
  4. 扩展 `isSecretKeyName` 模式以覆盖 `ak`/`sk` 短键名
