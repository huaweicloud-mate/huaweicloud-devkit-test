# OpenCode-GLM-5.2 每日测试报告

> **报告名**：`OpenCode-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-13
> **执行归档**：`results/OpenCode/2026-09-13-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 3 个 P0 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + GLM-5.2 (zhipu/glm-5.2) |
| OS / 架构 | Windows (win32, x64) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.4-next.3（npm @next，gitHead `3b6290b`） |
| 工具全集 | 17 MCP 工具可用（OpenCode 集成） |
| hcloud / 依赖 | hcloud 7.2.12 / check_cli 确认已配置 |
| 真云凭证 | cn-north-4（AKSK / 已配置，未使用写操作） |
| 测试类型 | MCP 工具直接调用 / 源码级探针 / 安全规则验证 |
| 设计真源 | 设计级 81 / 展开级 71 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：MCP 工具直接调用（hook_check_command/plan_cli_command/run_readonly_command 等）+ Node.js 探针脚本（.mjs）直调源码函数 + 文件系统检查。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 81 + 展开级 71 = 152 |
| 已执行 | 设计级 34 + 展开级 6 = 40 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 37 / 3 / 0 / 0 / 112 |
| 通过率（分母 = PASS+FAIL = 40） | 92.5% |
| P0 / P1 / P2 新增缺陷 | 3 / 0 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（未创建云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 31 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | P0 缺陷：D1-39/D4-3/D4-21 |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 0 | 无契约漂移 |
| NOT_RUN | 47 | 本轮未覆盖（时间限制，P1/P2 用例未全量执行） |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 6 | OpenCode + ECS/VPC/OBS/RDS 服务冒烟 |
| FAIL | 0 | |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 65 | 多客户端矩阵/评测集/服务矩阵未全量执行 |
| **合计** | **71** | |

---

## 四、逐用例结果（已执行项）

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 | 备注 |
|---|---|---|---|---|---|
| D1-39 | P0 | Windows 升级检测链可用性 | FAIL | evidence/D1-39 | spawnSync npm.cmd EINVAL |
| D1-40 | P0 | 镜像 lag 下检测正确性 | PASS | evidence/D1-40 | fetch 方式正常 |
| D2-4 | P0 | 凭证脱敏正确性 | PASS | evidence/D2-4 | AK/SK 均为 <redacted> |
| D2-11 | P0 | R3 STS token拒绝落盘 | PASS | evidence/D2-11 | persistCredentials 拒绝 STS |
| D4-1 | P0 | 凭证文件读取拦截 | PASS | evidence/D4-1 | deny + hwc-command-credential-file |
| D4-2 | P0 | 凭证env打印拦截 | PASS | evidence/D4-2 | deny + hwc-command-env-dump |
| D4-3 | P0 | 明文secret API拦截 | FAIL | evidence/D4-3 | ShowServerPassword 未拦截 |
| D4-5 | P0 | 写操作误判检测 | PASS | evidence/D4-5 | DeleteServers 正确分类为 write |
| D4-9 | P0 | 公开暴露/破坏性预检 | PASS | evidence/D4-9 | 0.0.0.0/0 port 22 被 deny |
| D4-15 | P0 | hook绕过尝试 | PASS | evidence/D4-15 | sh -c/powershell 包装均检测到 |
| D4-16 | P0 | 命令包裹穿透 | PASS | evidence/D4-16 | sh -c 包装检测到 |
| D4-18 | P0 | confirm-not-deny审批语义 | PASS | evidence/D4-18 | 写操作需确认非直接拒绝 |
| D4-19 | P0 | 确认流下预检仍生效 | PASS | evidence/D4-19 | plan 阶段预检生效 |
| D4-21 | P0 | hook_check_artifacts 具名回归 | FAIL | evidence/D4-21 | admin_pass + 0.0.0.0/0 未检测 |
| D4-22 | P0 | hook_check_deploy_plan 具名回归 | PASS | evidence/D4-22 | 公网暴露部署计划被 deny |
| D4-23 | P0 | 全局规则注入生效性 | PASS | evidence/D4-23 | safety/policy.json 已注入 |
| D8-7 | P0 | 技能指引可机械执行验证 | PASS | evidence/D8-7 | retrieve_skill 返回完整内容 |
| D10-4 | P0 | 安全干预有效性 | PASS | evidence/D10-4 | 8/9 安全向量有效 |
| D3-C5 | P1 | 工具冒烟 | PASS | evidence/D3-C5 | 四工具全通 |
| D3-A1 | P1 | skill检索完整性 | PASS | evidence/D3-A1 | 完整内容+引用 |
| D3-B3 | P1 | run_readonly脱敏执行 | PASS | evidence/D3-B3 | 执行成功+脱敏 |
| D3-B1 | P1 | list_operations规范名 | PASS | evidence/D3-B1 | ECS/VPC/OBS/RDS 规范名 |
| D5-1 | P1 | 清单发现加载 | PASS | evidence/D5-1 | 插件已安装加载 |
| D5-3 | P1 | 工具全量枚举 | PASS | evidence/D5-3 | 17 MCP 工具可用 |
| D3-C4 | P1 | 服务创建类回归 | PASS | evidence/D3-C4 | ECS/VPC/OBS/RDS 路由可执行 |
| D4-7 | P1 | hook三工具有效性 | PASS | evidence/D4-7 | 三工具均有效 |
| D4-4 | P1 | 写操作审批门 | PASS | evidence/D4-4 | 写动词强制审批 |
| D2-1 | P1 | auth init三端同步 | PASS | evidence/D2-1 | KooCLI/OBS/凭证文件就绪 |
| D2-5 | P1 | 凭证缺失报错指引 | PASS | evidence/D2-5 | explain_error 返回指引 |
| D4-20 | P1 | 拒绝后零操作 | PASS | evidence/D4-20 | 拒绝后无执行痕迹 |
| D4-13 | P1 | 最小权限凭证通过率 | PASS | evidence/D4-13 | 只读命令通过 |
| D9-1 | P1 | tools/list合规 | PASS | evidence/D9-1 | 17 工具注册合规 |
| D9-2 | P1 | JSON-RPC错误码 | PASS | evidence/D9-2 | 错误处理正确 |
| D9-3 | P1 | tools/call响应格式 | PASS | evidence/D9-3 | 响应格式一致 |
| EXP-D5-1-1 | P1 | OpenCode 清单发现 | PASS | evidence/EXP-D5-1-1 | 插件发现加载 |
| EXP-D5-1-3 | P1 | OpenCode 工具枚举 | PASS | evidence/EXP-D5-1-3 | 17 工具可达 |
| EXP-C4-01 | P1 | ECS 只读规划冒烟 | PASS | evidence/EXP-C4-01 | 100+ 操作 |
| EXP-C4-02 | P1 | VPC 只读规划冒烟 | PASS | evidence/EXP-C4-02 | 150+ 操作 |
| EXP-C4-03 | P1 | OBS 只读规划冒烟 | PASS | evidence/EXP-C4-03 | obsutil 命令 |
| EXP-C4-04 | P1 | RDS 只读规划冒烟 | PASS | evidence/EXP-C4-04 | 200+ 操作 |

---

## 五、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D1-39 | Windows spawnSync npm.cmd EINVAL 静默失败 | spawnSync 不抛 EINVAL，检测链可用 | EINVAL 被静默捕获返回 null | update-check.mjs:234,255 | 待提单 |
| 2 | P0 | D4-3 | ShowServerPassword 明文 secret API 未拦截 | decision=deny | decision=allow | cloud-risk-rules.json (缺规则) | 待提单 |
| 3 | P0 | D4-21 | hook_check_artifacts 未检测 IaC 硬编码密码和公网暴露 | deny + findings | allow + findings=[] | cloud-risk-rules.json (内容扫描缺失) | 待提单 |

### 根因详情

**#1 [P0] D1-39 Windows 升级检测链 spawnSync npm.cmd EINVAL 静默失败**

- 期望：`spawnSync('npm.cmd', ...)` 在 Windows 上不抛 EINVAL
- 实际：EINVAL (errno -4071) 被静默捕获，返回 null
- 根因：`plugins/huaweicloud-core/src/update-check.mjs:234`
  ```javascript
  const result = spawnSync(NPM_BIN, ['view', ...], {
    encoding: 'utf8', timeout, windowsHide: true, cwd,
  });  // ← 缺 shell: true
  ```
- 证据：`evidence/D1-39/probe.mjs` + `evidence/D1-39/stdout.log`

**#2 [P0] D4-3 ShowServerPassword 明文 secret API 未拦截**

- 期望：`hook_check_command("hcloud ECS ShowServerPassword ...")` → `decision: deny`
- 实际：`decision: allow, findings: []`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` + `policy.json:26`
  `blockedSecretOperations` 仅含 `["ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，缺 `ShowServerPassword`
- 证据：`evidence/D4-3/stdout.log`

**#3 [P0] D4-21 hook_check_artifacts 未检测 IaC 硬编码密码和公网暴露**

- 期望：Terraform 文件含 `admin_pass` 和 `0.0.0.0/0` → `decision: deny`
- 实际：`decision: allow, findings: []`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`
  artifact 检查规则不扫描 IaC 内容中的安全风险模式
- 证据：`evidence/D4-21/stdout.log`

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| 无 | 无环境阻塞 | - | - |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 验证 DeleteServers 正确分类为 write）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D2-4 验证 AK/SK 均为 <redacted>）

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无 | 否 | N/A | N/A |

> 本轮测试未创建任何真云资源（纯 MCP 工具调用 + 源码探针 + 文件检查）。

---

## 九、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖（说明范围）：
  - P1 用例 30 条未执行（D1-1/D1-3/D1-5/D1-26/D1-27/D1-28/D1-31/D1-41/D1-42/D1-45/D1-58/D2-10/D2-12/D2-13/D2-16/D4-6/D4-8/D4-11/D4-17/D4-24/D6-4/D8-4/D9-4/D9-5/D9-6/D9-9/D10-1/D10-2/D10-3/D10-5）
  - P2 用例 17 条未执行
  - 展开级 65 条未执行（多客户端矩阵/评测集/服务矩阵）
  - 原因：单次会话时间限制，优先执行全部 P0 + 关键 P1
- 建议：
  1. D1-39 修复：在 `spawnSync/spawn` 调用 `npm.cmd` 时添加 `shell: true`，或将 `queryDistTagsFetch` 作为 `getCachedUpdateInfo` 的默认 `doQuery`
  2. D4-3 修复：在 `policy.json` 的 `blockedSecretOperations` 中添加 `ShowServerPassword` 等返回明文密码的 API
  3. D4-21 修复：扩展 `hook_check_artifacts` 的规则库，扫描 IaC 内容中的硬编码密码和公网暴露模式
