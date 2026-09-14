# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 00:08:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-14-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 P0/P1 缺陷，不得标 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（codearts CLI）+ deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.4（npm latest 正式版，gitHead 9b67256，release-1.1.4） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS；agent 框架 MCP 实际暴露 37） |
| hcloud / 依赖 | hcloud 7.2.12（check_cli installed+authenticated） |
| 真云凭证 | cn-north-4（AKSK，仅 show_profile_redacted/auth_status 脱敏核对；本轮无真实资源创建） |
| 测试类型 | MCP 黑盒直调（hook/auth/plan/skill/check）+ 源码级检查 + CLI（doctor/status）+ node --test 单测 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表（本轮跑 daily 精选） |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：通过 MCP 工具（huaweicloud_*）黑盒直调被测对象，结果落 `stdout.log`；安全 hook/认证/规划类 P0 + 关键 P1/P2 逐一真实执行；源码级检查（hdk@9b67256）用于根因定位与孤儿文件核验；`node --test` 跑 security-policy/upgrade-session 单测作函数级证据。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行（有证据） | 38（设计级 32 + 展开级 6）；其余 114 标 BLOCKED（环境阻塞） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 26 / 10 / 114 / 2 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 68.4%（26/38） |
| P0 / P1 / P2 新增缺陷 | 本轮新增 1（P0 D4-5）/ 1（P1 D4-11）/ 0；复现上一轮 #673 共 6 项 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级（81）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 21 | 有证据且通过 PASS 门禁 |
| FAIL | 9 | D4-2、D4-5、D4-15、D4-23、D8-7、D1-26、D4-6、D4-11、D4-17（根因见缺陷清单） |
| BLOCKED | 49 | 真云/Windows/macOS/harness/install 布局/协议 Inspector（见阻塞项） |
| SPEC-MISMATCH | 2 | D5-3、D9-1（工具枚举漂移，与 D1-26 同源） |
| NOT_RUN | 0 | 无 |
| **合计** | **81** | |

### 3.2 展开级（71）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 5 | EXP-D5-3-1、EXP-NR3-02/04/10/24（源码/单测级，通过门禁） |
| FAIL | 1 | EXP-D5-3-3（tools/list 37 vs 39，与 D5-3/D1-26 同源） |
| BLOCKED | 65 | 非本客户端矩阵（18）、真云（22）、评测集（15）、Windows/macOS（5）、install 白名单（5） |
| SPEC-MISMATCH | 0 | 无 |
| NOT_RUN | 0 | 无 |
| **合计** | **71** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 新增/复现 | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `env \| grep HW_ACCESS_KEY` 应 `deny` | 返回 `allow`，HW_* 前缀未拦截 | `safety/rules/cloud-risk-rules.json:39` | 复现 | 已提单 #673 |
| 2 | P0 | D4-15 | hook 命令替换+ANSI-C 绕过 | `$(echo $'E\x43S DeleteServer')` 应 `deny` | 返回 `allow` | `src/risk-rule-engine.mjs:50-53` | 复现 | 已提单 #673 |
| 3 | P0 | D4-23 | 全局规则未注入（孤儿文件） | 11 目标注入且无孤儿文件 | `.mdc` 存在但零代码引用 | `rules/huawei-agent-rules.mdc` | 复现 | 已提单 #673 |
| 4 | P0 | D4-5 | framework Apply* 写误判（版本漂移） | `EIP ApplyEip` 应 `deny/write` | framework MCP 返回 `unknown_read/allow`（npm 1.1.4 源码已修复） | `safety/policy.json:39`（framework 未上线 #644） | 新增 | 待提单 |
| 5 | P1 | D4-6 | adminPass 明文回显警告缺失 | 含 adminPass 应告警 | `allow` 无警告 | `safety/rules/cloud-risk-rules.json` | 复现 | 已提单 #673 |
| 6 | P1 | D4-17 | hook 畸形输入 fail-open | 异常输入应 fail-closed | `allow` 放行 | `src/risk-rule-engine.mjs:106` | 复现 | 已提单 #673 |
| 7 | P1 | D1-26 | 工具协议暴露漂移 40 vs 37 | check_update/upgrade 应可调 | 3 个工具未暴露 | `src/tools.mjs`（框架未暴露） | 复现 | 已提单 #673 |
| 8 | P1 | D4-11 | 提示注入防护缺失 | 注入 payload 应拦截 | `allow` 未识别 | `src/risk-rule-engine.mjs` | 新增 | 待提单 |

> D8-7（7 meta 技能断链）与 D5-3/D9-1/EXP-D5-3-3（工具枚举漂移）均与 #7（D1-26 工具未暴露）同源，不再单列。

### 根因详情（关键 P0）

**#4 [P0] D4-5 framework Apply* 写误判（版本漂移，本轮新增）**
- 黑盒：`huaweicloud_plan_cli_command args=["EIP","ApplyEip"]` → `{decision:allow, risk:unknown_read}`
- 交叉验证 npm 1.1.4 源码：`classifyHcloudArgs(['EIP','ApplyEip'])` → `{decision:deny, risk:write}`（#644 修复已落地，`safety-policy.test.mjs` 27/27 通过）
- 根因：`plugins/huaweicloud-core/safety/policy.json:39` 已加 `Apply` 到 `writeOperationPrefixes`，但 agent 框架所集成 MCP 运行时版本滞后，未携带修复 → 版本漂移

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-39 / EXP-NR3-09 / EXP-NR3-01/03/23 | Windows 升级检测链（EINVAL/文件锁） | Windows 环境 | Windows 机器复测 |
| D1-40 之后升级链 D1-27/28/31/41/42/45 | check_update 未框架层暴露 | 框架暴露升级工具 | 框架暴露后复测 |
| D4-18/19/20/24、D2-10/12/13/16、D4-13 | 真云审批流/多账号/凭证切换 | 真云 AK/SK + PTY | 真云审批流环境 |
| D3-C4 / EXP-C4-01~22 | 真云服务创建矩阵 | 真云最小配置创建+销毁 | 真云 E2E 环境 |
| D10-1~5 / EXP-E01~15 | 评测 harness（promptfoo） | 评测基建 | harness 就绪 |
| EXP-D5-*（非 CodeArtsAgent） | 覆盖其它 9 客户端矩阵 | 多客户端 | 各客户端机器 |
| D1-1/5/58、EXP-D1-58-* | install 菜单/隔离 HOME/白名单 merge | 干净安装布局 | 隔离 HOME 环境 |
| D9-2~9、D6-4 | 协议/并发注入 | MCP Inspector | 协议测试客户端 |
| D1-4/6、D4-12、D7-4 | update/install-hcloud/供应链/mirror | 涉系统变更安装 | 干净安装环境 |
| EXP-NR3-11 | macOS/ARM | macOS 机器 | macOS 机器或 CI |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：本轮发现 framework 层 1 处（D4-5 Apply*），已记缺陷
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D2-11 用假 AK/SK/token，R3 返回 scope:rejected 且 S1 指纹未变；show_profile_redacted/auth_status 均经 redaction 管道脱敏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/OBS/沙箱等真云资源 | 否 | — | 本轮未创建，残留 0 |

> 本轮仅只读/黑盒 hook/规范化校验，无真云资源落地；`run_readonly ECS ListServersDetails` 返回 `{"count":0,"servers":[]}` 零资源。

---

## 八、遗留与建议

- 待裁决：D5-3/D9-1（工具枚举 37 vs 39/40，需维护者判定是否为框架层过滤设计意图）；D4-23（规则注入契约 .md vs .mdc）
- 本轮未覆盖：真云 E2E、多终端矩阵（其他 9 客户端）、审批流实时对话框（非 PTY）、MCP 协议 inspector 深测、install/uninstall 干净布局、评测 harness
- 建议：优先升框架集成版本使 #644 修复生效（D4-5）；补 env-dump 正则 `HW_ACCESS_KEY|HW_SECRET_KEY|HW_SECURITY_TOKEN` 前缀（D4-2）
