# OpenCode-glm-5.2 每日测试报告（1.1.4 正式版）

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-15 19:46:14（北京时间）
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
| daily 基础用例 | 设计级 81 / 展开级 39（已按 OpenCode+Windows 预筛） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；MCP 工具级通过 `callTool()` 真实调用；C4 服务矩阵通过 `list_operations` 逐服务枚举；证据统一落 `evidence/<probe-dir>/`。

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

> **展开级**：39 条（已按 OpenCode+Windows 预筛），全部 PASS，通过率 100%。

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
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 无缺陷 |
| BLOCKED | `0` | 无环境阻塞（init_day 已预筛） |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `0` | 无未覆盖 |
| **合计** | **`39`** | |

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
- 现象：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`
- 断言：`classifyTextCommand('echo $HW_ACCESS_KEY').decision === 'deny'`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335` — env-dump 检测正则 `(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)` 未包含 `echo` 命令；第 336 行凭证前缀检测 `HUAWEICLOUD|HWC_|HCLOUD|OS_` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀
- 证据：`evidence/d4-security/stdout.log`（D4-2 echo-hw 测试项，actual=allow）

**#2 [P0] D4-16 sh -c 命令包裹穿透**
- 现象：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision='allow'`
- 断言：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision === 'deny'`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335` — env-dump 正则 `(^|\s)(env|printenv|...)` 中 `(^|\s)` 仅匹配行首或空白字符，当 `printenv` 出现在引号内时前导字符为 `"` 不匹配
- 证据：`evidence/d4-security/stdout.log`（D4-16 wrap-sh 测试项，actual=allow）

**#3 [P0] D2-4 redactSecrets 不脱敏小写 ak/sk**
- 现象：`redactSecrets('{"ak": "AKIDTEST", "sk": "SKTEST"}')` 返回原始字符串，`sk` 明文未被替换
- 断言：`String(redactSecrets('{"ak":"...","sk":"..."}')).includes('SK...') === false`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString()` 正则 `/(AK|SK)\s*[:=]\s*.../g` 无 `i` 标志，不匹配小写 `ak`/`sk`
- 证据：`evidence/d2-auth/stdout.log`（D2-4 redact-json 测试项）

**#4 [P1] D8-4 INSTALL.md 未包含在 npm 包**
- 现象：`huaweicloud-devkit@1.1.4` npm 包中不存在 `INSTALL.md` 文件
- 断言：`existsSync('huaweicloud-devkit/INSTALL.md') === true`
- 根因：`package.json` 的 `files` 字段未列出 `INSTALL.md`，npm publish 时排除
- 证据：`evidence/d2-auth/stdout.log`（D8-4 install-doc 测试项，actual=false）

---

## 五、未执行用例与原因

无未执行用例。所有 P0/P1/P2 用例均已执行，无 NOT_RUN/BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志
- [x] PASS 门禁：所有 PASS 用例均有 evidencePath + 证据（verify_no_fake_pass.py 通过）
- [x] 覆盖率门禁：P0 无 NOT_RUN/空，NOT_RUN+空占比 0%（verify_coverage.py 通过）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | n/a | n/a |

> 本轮为源码级探针 + MCP 工具级测试，未创建真云资源。

---

## 八、遗留与建议

- **待修复缺陷**：4 个（3 P0 + 1 P1），与上一轮执行结果一致（同一 commit 9b67256）
- **本轮未覆盖**：真云 E2E 用例（需实时创建/删除资源）；多终端矩阵（仅 OpenCode 单客户端）
- **建议**：
  1. 优先修复 D4-2/D4-16 安全策略拦截缺口（echo 命令 + 引号内 printenv）
  2. 修复 D2-4 redactSecrets 大小写敏感问题（正则加 `i` 标志）
  3. 将 INSTALL.md 加入 package.json files 字段
  4. 探针覆盖：5 个探针脚本（d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix），共 163 个断言点
