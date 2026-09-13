# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-14 07:45:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-14-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 1 个 P0 FAIL，P0 通过率 17/18）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + glm-5.2 |
| OS / 架构 | Windows Server 2019 (x86_64) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.4-next.3（npm @next，gitHead `3b6290bc`） |
| 工具全集 | 39（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；MCP 工具真机执行记录 JSON 输出；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 81 + 展开级 71 = 152 |
| 已执行 | 81 + 71 = 152（全覆盖） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 141 / 2 / 9 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 98.6% (141/143) |
| P0 / P1 / P2 新增缺陷 | 1 / 0 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 73 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | D1-39 Windows 升级检测链 EINVAL 静默失败 |
| BLOCKED | 7 | D1-2/D1-5/D3-B5/D3-C4/D4-24/D9-9/D10-5（环境/权限阻塞） |
| SPEC-MISMATCH | 0 | 无契约漂移 |
| NOT_RUN | 0 | 全覆盖 |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 68 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-NR3-09（D1-39 Windows 展开） |
| BLOCKED | 2 | EXP-NR3-10（Linux 无该机器）、EXP-NR3-11（macOS 无测试机） |
| SPEC-MISMATCH | 0 | 无契约漂移 |
| NOT_RUN | 0 | 全覆盖 |
| **合计** | **71** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | Windows 升级检测链 EINVAL 静默失败 | `spawnSync('npm.cmd', ...)` 应返回 status=0 且 stdout 含有效 JSON，不得 EINVAL | `spawnSync npm.cmd EINVAL`，返回 null，检测链静默失败 | `update-check.mjs:234` | P | 已提单 #653 |

### 根因详情（每个 P0/P1 缺陷附代码片段 + 复现证据）

```markdown
**#1 [P0] D1-39 Windows 升级检测链 EINVAL 静默失败**

- 期望：`spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { windowsHide: true })` → status=0, stdout 含 JSON
- 实际：返回 `error.code === 'EINVAL'`，status=null，stdout 为空
- 根因：`plugins/huaweicloud-core/src/update-check.mjs:234`
  `spawnSync(NPM_BIN, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { encoding: 'utf8', timeout, windowsHide: true, cwd })`
  缺少 `shell: true`。Node.js v18+ 因 CVE-2024-27980 安全修复，禁止无 `shell: true` 直接 spawn `.cmd`/`.bat` 文件。
  同样问题存在于 `queryDistTags` 的 `spawn` 调用（line 255）。
  `getCachedUpdateInfo` 默认 `doQuery = queryDistTags`（spawn 版本），未自动 fallback 到 `queryDistTagsFetch`。

```javascript
// update-check.mjs:232-249
export function queryDistTagsSync({ timeoutMs = 15000, cwd } = {}) {
  try {
    const result = spawnSync(NPM_BIN, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
      encoding: 'utf8',
      timeout: timeoutMs,
      windowsHide: true,
      cwd,
      // ← 缺少 shell: true (Windows .cmd 需要)
    });
```

- 证据：`evidence/D1-39/stdout.log`，`npm.cmd error: spawnSync npm.cmd EINVAL`
```

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D1-2` | 多Agent探测需多客户端共存 | 多客户端环境 | 安装多个客户端后复测 |
| `D1-5` | uninstall会破坏测试环境 | 无法卸载当前插件 | 独立环境执行uninstall测试 |
| `D3-B5` | detect_framework需13框架样本项目 | 本地框架工程样本 | 准备框架样本项目 |
| `D3-C4` | 服务创建类回归需真云资源创建 | 真云写操作+用户审批 | 获得写操作审批后复测 |
| `D4-24` | 确认令牌过期需真云写+时钟注入 | 真云ECS创建+可注入时钟 | 提供时钟注入测试环境 |
| `D9-9` | tools/call超时需延迟注入MCP客户端 | MCP inspector夹具 | 提供支持延迟注入的MCP客户端 |
| `D10-5` | 多轮任务完成率需Agent harness | 完整Agent harness | 提供多轮对话测试框架 |
| `EXP-NR3-10` | Linux机器验证D1-39无EINVAL | Linux环境 | 提供Linux测试机 |
| `EXP-NR3-11` | macOS/ARM验证D1-39 | macOS/ARM环境 | 提供macOS测试机或CI |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无 | 否 | N/A | N/A |

> 本轮测试未创建真云资源，仅使用 MCP 工具进行黑盒测试和源码级探针分析。所有 plan_cli_command 测试均为 dry-run（safeToRun=false，未实际执行）。run_readonly_command 仅执行只读查询（ListCloudServers 返回空列表）。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖（BLOCKED 7 项）：
  - D1-2：多Agent探测（需多客户端共存环境）
  - D1-5：uninstall干净度（会破坏测试环境）
  - D3-B5：detect_framework（需框架样本项目）
  - D3-C4：服务创建类回归（需真云写操作审批）
  - D4-24：确认令牌过期（需真云写+时钟注入）
  - D9-9：tools/call超时（需延迟注入MCP客户端）
  - D10-5：多轮任务完成率（需Agent harness）
- 建议：
  1. 修复 D1-39（已提单 #653）：在 `queryDistTagsSync` 和 `queryDistTags` 的 spawn 选项中添加 `shell: IS_WINDOWS` 或在 Windows 下使用 `process.execPath` + `npm` 替代 `npm.cmd`
  2. 考虑在 `getCachedUpdateInfo` 中添加 `queryDistTagsFetch` 作为 spawn 失败时的自动 fallback
  3. 补充 BLOCKED 项所需环境（Linux/macOS 测试机、框架样本项目、MCP inspector夹具）
