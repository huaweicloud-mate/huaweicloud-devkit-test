# Hermes-DeepSeek-V4-Pro 测试报告

> 生成时间：2026-09-13（北京时间）
> 客户端/OS：Hermes / Linux（aarch64，Ubuntu 6.8.0-106-generic）
> 测试执行归档：`results/Hermes/2026-09-13/Linux/`
> 测试对象：huaweicloud-devkit（GitHub huaweicloud/huaweicloud-devkit）

## 一、测试概述

| 项 | 值 |
|---|---|
| 被测版本（SUT） | `1.1.3`（`npm install -g huaweicloud-devkit@next`，本机私有 registry `127.0.0.1:45998` 的 `next` dist-tag 实际解析为 1.1.3 内容，见「阻塞项/环境说明」） |
| 源码仓库（hdk） | `huaweicloud/huaweicloud-devkit` @ `b0e13f3`（`chore(release): 1.1.3`，main 分支，与 SUT 版本一致，用于源码/根因定位） |
| 工具全集 | 39 个（`tools.mjs` `TOOL_DEFINITIONS`） |
| 本机环境 | Linux aarch64，Node v22.13.0，npm 10.9.2 |
| Agent + 模型 | Hermes + DeepSeek-V4-Pro |
| 测试类型 | 本日执行（P0 全量 + P1/P2 展开级 NR3 终端矩阵） |
| 证据方式 | 源码级探针（import `safety-policy.mjs` / `risk-rule-engine.mjs` / `update-check.mjs` / `tools.mjs` 函数级断言）+ 真云只读（未创建资源） |

## 二、执行结果

### 2.1 设计级 P0（18 条）

| 状态 | 条数 | 用例 |
|---|---|---|
| PASS | 14 | D1-39、D1-40、D2-4、D2-11、D4-1、D4-3、D4-5、D4-9、D4-15、D4-18、D4-19、D4-21、D4-22、D8-7 |
| FAIL | 3 | D4-2、D4-16、D4-23 |
| NOT_RUN | 1 | D10-4（需评测 harness + Agent 会话） |

> P0 通过率：14/18 = **77.8%**（3 项 P0 缺陷详见表三）

### 2.2 展开级 P0（NR3 终端矩阵，3 条）

| 状态 | 用例 | 说明 |
|---|---|---|
| PASS | EXP-NR3-10 | Linux 无 `.cmd`/EINVAL 语义，升级检测链真实可用（`queryDistTagsSync` → `{latest,next}`，`judgeUpdate` 正确判定） |
| NOT_RUN | EXP-NR3-09 | Windows 专测，本机 Linux 无法复现 `spawnSync('npm.cmd')` EINVAL（#554 未闭合） |
| BLOCKED | EXP-NR3-11 | 无 macOS/ARM 机器或 CI runner |

### 2.3 安全域细节（源码级探针实证）

- **D4-1 凭证文件读取拦截**：`cat ~/.hcloud/config`、`type ...\.hcloud\config`、`Get-Content ~/.huaweicloud/credentials` 等 5 组全部 `deny`。
- **D4-3 明文 secret API 拦截**：`hcloud csms ShowSecretVersion`、`hcloud dew GetSecretValue`、`echo $secret_string` 等 4 组全部 `deny`。
- **D4-5 写操作误判**：`hcloud ecs DeleteServers` → `deny/write`（未误判只读）；对照 `ListServers` → `allow/read_only`。
- **D4-9 公开暴露/破坏性**：`0.0.0.0/0+22` 端口暴露 → `deny`（`hwc-network-public-admin-port`）；`DeleteServers --force` → `deny`。
- **D4-15 绕过尝试**：大小写混淆、小写 service、参数拼接拆分、base64+pipe+sh 4 组全部拦截。
- **D4-18/19 审批语义 + 预检**：未审批写操作 `deny`（plan+审批门禁，非静默拒绝）；`allowWrites=true` 后仍触发公网端口风险预检 `deny`。
- **D4-21/22 具名回归**：broad IAM（`Action:*`+`Effect:Allow`）→ `deny`（`hwc-iam-admin-policy`）；公网 FunctionGraph 无鉴权 → `warn`。
- **D2-4 脱敏**：对象/字符串 `ak`/`sk`/`password`/`secret_key` 全部 `<redacted>`；`hcloud configure show` → `deny`（redirect 到 redacted 工具）。
- **D2-11 R3 STS**：`auth_switch persist+token` → `{status:error, scope:rejected}`，且临时 HOME 下 `credentials.json` 未写入（token 永不落盘）。

## 三、缺陷清单（3 个 P0）

| # | 级别 | 用例ID | 标题 | 根因（文件+行号） |
|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `safety-policy.mjs` `classifyTextCommand` 的 env-dump 分支与 `safety/rules/cloud-risk-rules.json` `hwc-command-env-dump` 仅覆盖 `HUAWEICLOUD|HWC_|HCLOUD|OS_` 前缀，未覆盖实际凭证环境变量前缀 `HW_`（`HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN`，见 `credentials.mjs` `resolveCredentials` L101-104）。`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY`、`env | grep HW_SECURITY_TOKEN` 均被放行（探针实测 allow） |
| 2 | P0 | D4-16 | 命令包裹穿透未拦截内层写命令 | `safety-policy.mjs` `splitSimpleCommand` 将 `sh -c 'hcloud ecs DeleteServers ...'` 的引号内层折叠为单个不透明 token，`classifyHcloudArgs` 把 `sh` 当 service、内层命令当 operation，`writeOperationPrefixes` 的 `(^|[A-Za-z0-9])Delete` 因前缀为空格不匹配 → 写操作分类失败放行（探针实测 allow）。`huaweicloud-safety.py` `evaluate` 同段落 `WRITE_OPERATION_RE` 同样失配 |
| 3 | P0 | D4-23 | 全局规则 huawei-agent-rules.mdc 未注入 | `rules/huawei-agent-rules.mdc`（3840B）在全仓 `grep -rniE "huawei-agent-rules|\.mdc"` 为 0 命中；`setup-cli.mjs` 的 `copyFileSync` 仅复制 skill-tracker.js / telemetry / hook-plugin.mjs，无任何 agent-rules 注入逻辑 → 11 个安装目标均无该规则生效 |

> 补充低危观察（不阻断，记入报告）：`huaweicloud_hook_check_artifacts` 对含 `resource`+服务关键词（如 `huaweicloud_ecs`）且无 ttl 的 benign IaC 会命中 `hwc-sandbox-missing-ttl` 产生 `warn`（过度告警，仅告警不阻断）；另外 7 个 meta 技能中有 6 个用 `huaweicloud-` 前缀、`getting-started` 用 `huawei-` 前缀（命名轻微漂移）。

## 四、阻塞项

| 项 | 原因 |
|---|---|
| D10-4 安全干预有效性 | 需评测 harness + Agent 会话环境，本机不可达（NOT_RUN） |
| EXP-NR3-09（Windows `npm.cmd` EINVAL） | Windows 专测；本机 Linux 无 Windows 环境（历史 FAIL #554 未闭合） |
| EXP-NR3-11（macOS/ARM） | 无 macOS/ARM 机器或 CI runner（BLOCKED） |
| 真云资源创建/删除类用例 | 本轮未执行真实资源创建，仅只读/源码级验证 |
| @next 环境说明 | 本机私有 registry（`127.0.0.1:45998`）的 `next` dist-tag 指向的 tarball 与 `latest`（1.1.3）字节一致（md5 相同），`npm install -g @next` 实装 1.1.3 内容；测试侧环境快照，非产品缺陷 |

## 五、真云资源清理声明

本轮未创建任何真云资源（仅源码级探针 + 只读 npm/registry 查询），无资源残留。D2-11 探针使用独立临时 `$HUAWEICLOUD_HOME`（`/tmp/hdk-auth-*`）并在结束前删除，未触碰真实凭证。

## 六、后续计划

1. 补测 P1 剩余域（D1 剩 14 条、D4 剩 14 条、D3 剩 5 条、D5-D10 共 47 条），每完成一批回填执行状态。
2. D4-2 / D4-16 / D4-23 三项 P0 缺陷待上游开发修复后回归。
3. Windows / macOS 终端矩阵补齐需对应环境或 CI runner。