# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-14 22:48:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-14-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 P0/P1 缺陷，不得标 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（codearts CLI）+ deepseek-v4-pro-0813 |
| OS / 架构 | Linux x86_64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.4-next.6（npm @next，gitHead 69ac727） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS；agent 框架 MCP 实际暴露 37） |
| hcloud / 依赖 | hcloud 7.2.12（check_cli installed+authenticated） |
| 真云凭证 | cn-north-4（AKSK，仅 show_profile_redacted/run_readonly 脱敏核对；本轮无真实资源创建） |
| 测试类型 | MCP 黑盒直调（hook/auth/plan/skill）+ 源码级检查 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列（本轮跑 daily 精选） |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：通过 MCP 工具（huaweicloud_*）黑盒直调被测对象，结果落 `stdout.log`；安全 hook/认证/规划类 P0 + 关键 P1/P2 逐一真实执行；源码级检查用于根因定位与孤儿文件核验。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行 | 35（设计级 33 + 展开级 2）；其余 117 标 BLOCKED（阻塞） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 26 / 4 / 117 / 5 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 74.3%（26/35） |
| P0 / P1 / P2 新增缺陷 | 3 / 3 / 0（P0 #1-3，P1 #4-6） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级（81）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 24 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | D4-2、D4-15、D4-6、D4-17（根因见缺陷清单） |
| BLOCKED | 48 | 环境阻塞（Windows/真云/TTY/harness/install 布局），见阻塞项 |
| SPEC-MISMATCH | 5 | D4-23、D1-26、D1-41、D5-3、D9-1（契约漂移） |
| NOT_RUN | 0 | 无 |
| **合计** | **81** | |

### 3.2 展开级（71）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 2 | EXP-D5-3-1、EXP-D5-3-3（CodeArtsAgent 专属，复用 D5-1/D5-3） |
| FAIL | 0 | |
| BLOCKED | 69 | 非本客户端矩阵（18）、真云服务创建（22）、评测集（15）、终端矩阵（8）、install 白名单（5）、Linux 升级检测（1） |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | 无 |
| **合计** | **71** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `env \| grep HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow`，`HW_*` 前缀未拦截 | `safety/rules/cloud-risk-rules.json` env-dump 正则 | 待提单 |
| 2 | P0 | D4-15 | hook 命令替换绕过 | `hcloud $(echo $'E\x43S DeleteServer')` 应 `deny` | 返回 `allow`，`$()`+ANSI-C 绕过 | `src/risk-rule-engine.mjs:50-54` | 待提单 |
| 3 | P0 | D4-23 | 全局规则未注入（孤儿文件） | 11 安装目标注入 `huawei-agent-rules.md` | 文件 `.mdc` 存在但零引用 | `rules/huawei-agent-rules.mdc` 零引用 | 待提单 |
| 4 | P1 | D4-6 | 缺失 adminPass 明文回显警告 | 含 `adminPass` 明文命令应告警 | `allow` 无警告 | `safety/rules/cloud-risk-rules.json` 无 adminPass | 待提单 |
| 5 | P1 | D4-17 | 畸形输入 fail-open | 异常输入应 fail-closed 拒绝 | `allow` 放行 | `src/risk-rule-engine.mjs:106` | 待提单 |
| 6 | P1 | D1-26 | 工具协议暴露漂移 | 升级工具应 MCP 可调用 | 40 定义 vs 37 暴露，check_update 不可调 | `src/tools.mjs` 定义未框架层暴露 | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截不完整**
- 期望：`env | grep HW_ACCESS_KEY` → `deny`
- 实际：`decision=allow`，`findings=[]`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` env-dump 规则第二条件正则 `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀
- 证据：`evidence/D4-2/stdout.log`

**#2 [P0] D4-15 hook 命令替换绕过**
- 期望：`hcloud $(echo $'ECS DeleteServer') --id x` → `deny`/`warn`
- 实际：`decision=allow`
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:50-54` conditionMatches 纯正则不做 shell 解析
- 证据：`evidence/D4-15/stdout.log`

**#3 [P0] D4-23 全局规则孤儿文件**
- 期望：11 安装目标注入全局规则且无孤儿文件
- 实际：`rules/huawei-agent-rules.mdc` 零引用，文件名 `.mdc` 与契约 `.md` 不符
- 证据：`evidence/D4-23/stdout.log`

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-39 | Windows 升级检测链（EINVAL/文件锁） | Windows 环境 | Windows 机器复测 |
| D1-40 | 镜像 lag 检测依赖 check_update | check_update 未框架层暴露 | 框架暴露升级工具 |
| D10-1~5 / EXP-E01~15 | 评测 harness（promptfoo）未就绪 | 评测基建 | harness 就绪后复测 |
| D3-C4 / EXP-C4-01~22 | 真云服务创建矩阵 | 真云 AK/SK + 最小配置创建 | 真云 E2E 环境 |
| D2-10/12/13/16、D2-1/5、D4-13 | 真云多账号/凭证切换 | 真云多账号 | 真云认证环境 |
| D4-20 之后审批流 / D4-24 | 非 TTY 审批流交互 | TTY/PTY | PTY 环境 |
| EXP-D5-*（非本客户端） | 覆盖其它 9 客户端矩阵 | 多客户端 | 各客户端机器 |
| EXP-D1-58-*、D1-58、D1-1/5 | install 菜单/隔离 HOME | 干净安装布局 | 隔离 HOME 环境 |
| D9-2~8、D6-4 | 协议客户端/并发注入 | MCP inspector | 协议测试客户端 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D2-11 使用假 AK/SK/token，R3 返回 scope:rejected 未落盘；show_profile_redacted/run_readonly 均经 redaction 管道脱敏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/OBS/沙箱等真云资源 | 否 | — | 本轮未创建，残留 0 |

> 本轮仅做只读/黑盒 hook/规划检查，无真云资源落地；run_readonly ECS ListServersDetails 返回 `{"count":0,"servers":[]}` 零资源；D2-11 冲突仲裁 R3 拒绝（scope:rejected），无凭证写入。

---

## 八、遗留与建议

- 待裁决 SPEC：D4-23（规则注入契约）、D1-26/41/D5-3/D9-1（工具协议暴露 40 vs 37，需维护者判定是否为框架层过滤设计意图）
- 本轮未覆盖：真云 E2E、多终端矩阵（其他 9 客户端）、审批流实时对话框、MCP 协议 inspector 深测、CLI 安装/卸载、源码直调类（semverCompare/judgeUpdate/dismiss 冷却）、文档一致性、性能延迟采样、升级提醒链黑盒（check_update 未暴露）
- 建议：优先修复 P0 #1（env-dump 正则补 `HW_ACCESS_KEY|HW_SECRET_KEY|HW_SECURITY_TOKEN` 前缀）、#2（hook 引入 shell 解析或覆盖 `$()`/ANSI-C quoting）、#3（规则文件接入 install 注入或删除孤儿文件）
