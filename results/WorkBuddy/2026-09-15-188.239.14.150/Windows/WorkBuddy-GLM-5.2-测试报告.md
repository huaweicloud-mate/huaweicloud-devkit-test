# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-09-15 20:50:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-15-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 3 个 P0 FAIL + 1 个 P1 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + glm-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | `v1.1.4`（npm latest，gitHead `9b67256e`，PR #669） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | 未安装 hcloud（不影响源码级探针测试） |
| 真云凭证 | `cn-north-4（AKSK 已配置）` |
| 测试类型 | 源码级探针（.mjs 直调导出函数）+ CLI 真机（doctor/status）+ MCP 工具验证 |
| 设计真源 | 设计级 77（daily 精选）/ 展开级 17（预筛 WorkBuddy+Windows） |
| daily 基础用例 | 设计级 77 / 展开级 17 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand/redactSecrets/judgeUpdate/semverCompare/evaluateArtifacts 等），决策/结果落 `stdout.log`；CLI 真机执行 `npx huaweicloud-devkit doctor/status`；MCP 工具验证 `check_update`/`auth_status`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 94（设计级 77 + 展开级 17） |
| 已执行 | 82（PASS+FAIL+BLOCKED） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 78 / 4 / 12 / 0 / 0 |
| 通过率（分母 = PASS+FAIL，不含 BLOCKED） | 95.1%（78/82） |
| P0 / P1 / P2 新增缺陷 | 3 / 1 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 65 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | 不符预期，根因见缺陷清单（D1-39/D4-2/D4-16/D4-6） |
| BLOCKED | 8 | 环境阻塞，见 §五 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **77** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 13 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | — |
| BLOCKED | 4 | 环境阻塞，见 §五 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **17** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> **铁律**：缺陷必须真实执行后填写；未执行/推测的不得记为缺陷。字段完整到可让修复方直接定位。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | Windows 升级检测链不可用 | `queryDistTagsSync()` 应返回 `{latest,next}` | 返回 `null`；`spawnSync('npm.cmd')` status=null | `update-check.mjs:238` | P | 待提单 |
| 2 | P0 | `D4-2` | HW_ACCESS_KEY/HW_SECRET_KEY env 打印未拦截 | `classifyTextCommand('printenv HW_ACCESS_KEY')` → `deny` | 返回 `allow` | `safety-policy.mjs:336` | P | 待提单 |
| 3 | P0 | `D4-16` | 命令包裹穿透（sh -c/bash -c 包裹 hcloud 写命令） | `classifyTextCommand('sh -c "hcloud ECS DeleteServer"')` → `deny` | 返回 `allow` | `safety-policy.mjs:345` | P | 待提单 |
| 4 | P1 | `D4-6` | adminPass 空格分隔 CLI 参数未脱敏 | `redactSecrets('--adminPass MyPassword123!')` → `--adminPass <redacted>` | 返回原文未脱敏 | `safety-policy.mjs:42` | P | 待提单 |

### 根因详情（每个 P0/P1 缺陷附代码片段 + 复现证据）

**#1 [P0] D1-39 Windows 升级检测链不可用**

- 期望：`queryDistTagsSync()` → `{latest: "1.1.4", next: "1.1.4-next.6"}`
- 实际：返回 `null`；`spawnSync('npm.cmd', ...)` status=null
- 根因：`plugins/huaweicloud-core/src/update-check.mjs:238`
  ```javascript
  const result = spawnSync(NPM_BIN, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: timeoutMs,
    windowsHide: true,
    cwd,
    // 缺 shell: true — Windows .cmd 文件需要 shell:true
  });
  ```
- 证据：`evidence/D1-39/stdout.log`，`npm.cmd --version` 无 shell:true status=null，加 shell:true status=0

**#2 [P0] D4-2 HW_ACCESS_KEY/HW_SECRET_KEY 环境变量打印未拦截**

- 期望：`printenv HW_ACCESS_KEY` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:336`
  ```javascript
  /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)  // ← 缺 HW_ 前缀
  ```
  `HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN` 不匹配上述正则。
- 证据：`evidence/D4-2/stdout.log`，6 个 HW_* 命令中 5 个未被拦截

**#3 [P0] D4-16 命令包裹穿透**

- 期望：`sh -c "hcloud ECS DeleteServer"` → `deny`
- 实际：返回 `allow`（0/6 拦截）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:345`
  ```javascript
  if (/(^|\s)hcloud(\.exe)?\s+/i.test(text))  // ← 仅匹配 hcloud 开头的命令
  ```
  不检测 `sh -c`/`bash -c`/`eval`/`$()`/`powershell -c`/`cmd /c` 包裹内层的 hcloud 命令。
- 证据：`evidence/D4-16/stdout.log`

**#4 [P1] D4-6 adminPass 空格分隔 CLI 参数未脱敏**

- 期望：`redactSecrets('--adminPass MyPassword123!')` → `--adminPass <redacted>`
- 实际：返回原文 `--adminPass MyPassword123!`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:42`
  ```javascript
  /((?:...|adminPass|...)\s*[:=]\s*)(value)/gi  // ← 要求 [:=] 不匹配空格分隔
  ```
- 证据：`evidence/D4-6/stdout.log`

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-1` | 设计级 | P1 | BLOCKED | 补环境 | 需要独立环境重置安装（当前会话不能卸载重装） | — |
| `D1-2` | 设计级 | P2 | BLOCKED | 补环境 | 需要多 Agent 共存环境进行 auto-detect 测试 | — |
| `D1-5` | 设计级 | P1 | BLOCKED | 补环境 | 卸载测试需独立环境（会破坏当前会话） | — |
| `D1-6` | 设计级 | P2 | BLOCKED | 补环境 | 需要独立 KooCLI 安装环境 | — |
| `D1-42` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP 服务端生命周期测试（dismiss + 重启进程） | — |
| `D1-45` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP 服务端会话级提示注入测试 | — |
| `D1-58` | 设计级 | P1 | BLOCKED | 补环境 | 需要干净 HOME 目录 + install 菜单交互 | — |
| `D2-10` | 设计级 | P1 | BLOCKED | 补环境 | 需要 KooCLI 多档配置环境（current=deploy） | — |
| `D4-13` | 设计级 | P1 | BLOCKED | 补环境 | 需要只读子账号凭证 credentials.readonly.json（未配置） | — |
| `D4-24` | 设计级 | P1 | BLOCKED | 补环境 | 需要真实审批流 + 时钟推进测试 | — |
| `D6-4` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP 并发负载测试 harness | — |
| `D9-9` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP Inspector 超时注入 + 时钟操作 | — |

> 所有 BLOCKED 均为环境/凭证/harness 缺失，非用例设计问题。解除条件：配置相应环境/凭证后可复测。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（测试中未发生凭证泄漏）
- [x] 写操作误判 read-only：`0`（D4-5 验证写操作均不被误判为 allow）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D2-4 验证 redactSecrets 正确工作）
- [ ] **安全缺陷 3 个 P0**：D4-2（env 变量漏拦截）、D4-16（shell 包裹穿透）、D1-39（升级检测链失效）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | — | 未创建任何真云资源（源码级探针测试） |
| 临时文件 | 是 | 已清理 | skip 文件/creds-import.json 测试后已删除 |

> 本轮测试全部为源码级探针 + CLI 验证，未创建真云资源，无需归零。

---

## 八、遗留与建议

- **待提单缺陷 4 个**（3 P0 + 1 P1），详见 FINDINGS.md，建议合并为 1 个 issue 提交至 `huaweicloud/huaweicloud-devkit`
- **BLOCKED 12 个**：全部为环境/凭证/harness 缺失，非产品缺陷，解除条件已逐条标注
- **建议优先修复**：
  1. D4-2 + D4-16：安全策略正则补齐（`HW_` 前缀 + shell 包裹检测）— 安全风险最高
  2. D1-39：`spawnSync` 加 `shell: true`（Windows .cmd 必需）— 影响所有 Windows 用户
  3. D4-6：`redactString` 正则支持空格分隔 CLI 参数格式
- **未覆盖范围**：真云 E2E（需真云资源创建销毁）、多终端矩阵（需多客户端环境）、MCP Inspector 协议测试（需 Inspector harness）
