# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 18:15:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-15-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，npm latest v1.1.4，gitHead 9b67256）
> **结论**：`PARTIAL`（有 P0 缺陷，不得标 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（CodeArts CLI）+ deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 11 / Python 3.12 |
| 被测版本（SUT） | v1.1.4（npm latest 正式版，gitHead 9b67256） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS）；CodeArts 框架 MCP 实际暴露 37 |
| hcloud / 依赖 | hcloud 7.2.12（check_cli installed+authenticated） |
| 真云凭证 | cn-north-4（AKSK，仅 show_profile_redacted/auth_status 脱敏核对；本轮无真实资源创建） |
| 测试类型 | MCP 黑盒直调（huaweicloud_* 工具）+ CLI（doctor/status）+ 源码级检查 + node 函数级探针 |
| 设计真源 | 设计级 77 / 展开级 17（daily 精选，展开级已按客户端+OS 预筛） |

> **执行方法**：通过 MCP 工具（huaweicloud_*）黑盒直调被测对象，决策/结果落 `stdout.log`；源码级检查（hdk@9b67256）与 node 函数级探针用于根因定位（文件:行号）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 94（设计级 77 + 展开级 17） |
| 已执行（非 BLOCKED） | 44（设计级 42 + 展开级 2） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 33 / 9 / 50 / 2 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 75.0%（33/44） |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 0（本轮全部为历史复现 #673/#685） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级（77）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 32 | 有证据且通过 PASS 门禁 |
| FAIL | 8 | D4-2、D4-5、D4-6、D4-15、D4-17、D4-23、D1-26、D8-7（根因见缺陷清单） |
| BLOCKED | 35 | 真云/Windows/审批流/harness/协议 Inspector/install 布局/check_update 未暴露（见阻塞项） |
| SPEC-MISMATCH | 2 | D5-3、D9-1（工具枚举 40 vs 37，与 D1-26 同源） |
| NOT_RUN | 0 | 无 |
| **合计** | **77** | |

### 3.2 展开级（17）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 1 | EXP-D5-3-1（插件清单发现加载） |
| FAIL | 1 | EXP-D5-3-3（tools/list 37 vs 40，与 D1-26 同源） |
| BLOCKED | 15 | EXP-E01~15（评测集路由需 harness） |
| SPEC-MISMATCH | 0 | 无 |
| NOT_RUN | 0 | 无 |
| **合计** | **17** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 新增/复现 | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-5 | framework Apply* 写误判（版本漂移） | `EIP ApplyEip` 应 `deny/write` | `allow/unknown_read` | 框架 `~/.codeartsdoer/huaweicloud-plugins/safety/policy.json`（缺 Apply，源码 policy.json:39 已含） | 复现 #685 | 已提单 |
| 2 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` 应 `deny` | `allow`，HW_ 前缀未拦截 | `cloud-risk-rules.json:39`（env-dump 正则缺 HW_） | 复现 #673 | 已提单 |
| 3 | P0 | D4-15 | hook 命令替换+ANSI-C 绕过 | ANSI-C 变体应 `deny` | `allow` | `risk-rule-engine.mjs`（纯文本匹配未解 ANSI-C） | 复现 #673 | 已提单 |
| 4 | P0 | D4-23 | 全局规则未注入（孤儿文件） | 11 目标注入且无孤儿 | `.mdc` 存在但零代码引用 | `rules/huawei-agent-rules.mdc` | 复现 #673 | 已提单 |
| 5 | P0 | D8-7 | 7 meta 技能指引断链 | 指引均可机械执行 | 引用未暴露的 check_update/upgrade | huaweicloud-core SKILL.md 会话启动节 | 复现 #673 | 已提单 |
| 6 | P1 | D1-26 | 工具协议暴露漂移 40 vs 37 | check_update/upgrade 应可调 | 3 工具未暴露 | `tools.mjs`（框架未暴露 3 工具） | 复现 #673 | 已提单 |
| 7 | P1 | D4-6 | adminPass 明文回显警告缺失 | 含 adminPass 应告警 | `allow` 无警告 | `cloud-risk-rules.json`（无明文密码规则） | 复现 #673 | 已提单 |
| 8 | P1 | D4-17 | hook 畸形输入 fail-open | 异常输入应 fail-closed | 空/畸形输入 `allow` | `risk-rule-engine.mjs:106` | 复现 #673 | 已提单 |

> D5-3/D9-1/EXP-D5-3-3（工具枚举 37 vs 40 漂移）与 #6（D1-26）同源，不单列。

### 根因详情（关键 P0）

**#1 [P0] D4-5 framework Apply* 写误判（版本漂移）**
- 黑盒：`plan_cli_command args=["EIP","ApplyEip"]` → `{decision:allow, risk:unknown_read}`
- 交叉验证：源码 `hdk/plugins/huaweicloud-core/safety/policy.json:39` 与 npm 1.1.4 包 `writeOperationPrefixes` 均含 `Apply`（33 项，#644 已落地）
- 实际运行：CodeArts 框架加载的 `~/.codeartsdoer/huaweicloud-plugins/safety/policy.json` 仅 32 项、缺 `Apply`
- 结论：框架运行时安全策略版本滞后于源码，#644 修复未在框架层生效 → 版本漂移

**#2 [P0] D4-2 凭证 env 打印拦截不完整**
- 黑盒：`hook_check_command "printenv HW_ACCESS_KEY"` → `{ok:true, decision:allow}`
- 根因：`~/.codeartsdoer/huaweicloud-plugins/safety/rules/cloud-risk-rules.json:39` env-dump 第二条件正则 `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 缺 `HW_` 前缀（真实凭证 env 为 `HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN`）

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 分类 | 含义 | 维护 agent 动作 |
|---|---|---|
| `改用例` | 用例设计不合理 | 修改 `test-cases/` 母版 |
| `补环境` | 环境/凭证/配额/依赖缺失 | 补环境后复测 |
| `调归属` | 归属列需改 | 调整 agent/OS 列 |

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | BLOCKED | 调归属 | Windows 升级检测链（EINVAL/文件锁），Windows 专属用例，本机 Linux |
| D4-18/19/20 | 设计级 | P0/P1 | BLOCKED | 补环境 | 真云 PTY 审批流实时对话框，本环境无 PTY |
| D2-1/5/13、D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 真云多账号/审批流/runtime 切换，本环境单账号只读 |
| D1-27/28/31/33/41/42/45 | 设计级 | P1/P2 | BLOCKED | 补环境 | check_update 语义/冷却期/dismiss，check_update 框架层未暴露（D1-26 同源） |
| D1-1/2/5/6/58、D4-10/12、D7-4 | 设计级 | P1/P2 | BLOCKED | 补环境 | 需隔离 HOME + 交互 install/uninstall 干净布局，本环境已预装 |
| D9-2~9、D6-1/3/4 | 设计级 | P1/P2 | BLOCKED | 补环境 | 需 MCP Inspector 协议测试客户端/压测 |
| D10-3/4 | 设计级 | P0/P1 | BLOCKED | 补环境 | 需评测 harness（promptfoo），本环境无评测基建 |
| EXP-E01~15 | 展开级 | P1 | BLOCKED | 补环境 | 评测集路由需 harness（promptfoo）底座 |
| D2-5 | 设计级 | P1 | BLOCKED | 补环境 | 凭证缺失报错指引需 auth init 清空凭证验证，本环境已配置凭证 |

> 本轮无 NOT_RUN；BLOCKED 均写 blockedReason（已回填 CSV）。真云类用例因无 AK/SK 真实建删资源而 BLOCKED，未 mock 假跑、未虚标 PASS。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：本轮发现 framework 层 1 处（D4-5 Apply*），已记缺陷
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（show_profile_redacted 返回 accessKeyId/secretAccessKey/securityToken 均 `<redacted>`）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/OBS/沙箱等真云资源 | 否 | — | 本轮未创建，残留 0 |

> 本轮仅只读/黑盒 hook/规范化校验，无真云资源落地；`run_readonly ECS ListServersDetails` 返回 `{"count":0,"servers":[]}` 零资源。

---

## 八、遗留与建议

- 待裁决：D5-3/D9-1/EXP-D5-3-3（工具枚举 37 vs 40，需维护者判定框架层过滤是否为设计意图）；D4-23（规则注入契约 .md vs .mdc）
- 本轮未覆盖：真云 E2E、多终端矩阵（其他 9 客户端）、审批流实时对话框（非 PTY）、MCP 协议 inspector 深测、install/uninstall 干净布局、评测 harness、Windows 升级检测
- 建议：优先升级 CodeArts 框架集成插件版本使 #644 修复生效（D4-5 Apply*）；补 env-dump 正则 `HW_ACCESS_KEY|HW_SECRET_KEY|HW_SECURITY_TOKEN` 前缀（D4-2）
