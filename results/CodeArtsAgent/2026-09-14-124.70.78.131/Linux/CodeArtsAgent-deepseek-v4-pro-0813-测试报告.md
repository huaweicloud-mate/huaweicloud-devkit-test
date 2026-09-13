# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-14 07:21:12（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-14-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 P0 缺陷 + P0 缺口，不标 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（codearts CLI）+ deepseek-v4-pro-0813 |
| OS / 架构 | Linux x86_64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） |
| 工具全集 | 39（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（check_cli installed+authenticated） |
| 真云凭证 | cn-north-4（AKSK，仅 show_profile_redacted 脱敏核对；本轮无真云资源创建） |
| 测试类型 | MCP 黑盒直调（hook/auth/plan）+ 源码级检查 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列（本轮跑 daily 精选） |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：通过 MCP 工具（huaweicloud_*）黑盒直调被测对象，结果落 `stdout.log`；安全 hook/认证/规划类高危用例 + 关键 P0 逐一真实执行；源码级检查用于根因定位与孤儿文件核验。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行 | 26（设计级 25 + 展开级 1） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 26 / 3 / 67 / 2 / 54 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 83.9%（26/31） |
| P0 / P1 新增缺陷 | 3 / 2（P0 新发现 1 + 复测 2；P1 复测 2） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级（81）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 25 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | D4-2（HW_* 前缀 env 未拦截）、D4-15（命令替换绕过）、D4-6（adminPass 无警告） |
| BLOCKED | 20 | 环境阻塞（Windows/真云/TTY/harness/inspector） |
| SPEC-MISMATCH | 2 | D4-23（规则孤儿文件）、D4-17（fail-open） |
| NOT_RUN | 31 | 本轮未覆盖（源码直调/semver/dismiss/文档一致/性能类） |
| **合计** | **81** | |

### 3.2 展开级（71）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 1 | EXP-D5-3-3（CodeArtsAgent D5-3 工具全量枚举，复用 D5-3 证据） |
| FAIL | 0 | |
| BLOCKED | 47 | EXP-E 评测集、EXP-D1-58 install 菜单、EXP-C4 服务创建真云矩阵、NR3 Windows/macOS |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 23 | 其余客户端 D5 枚举、NR3 Linux 54 条通用断言探针未逐一执行 |
| **合计** | **71** | |

---

## 四、逐用例结果（已执行项）

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 | 备注 |
|---|---|---|---|---|---|
| D2-4 | P0 | 凭证脱敏正确性 | PASS | `evidence/D2-4/stdout.log` | show_profile_redacted 返回 accessKeyId/secretAccessKey/securityToken 均 `<redacted>` |
| D2-11 | P0 | R3 STS token 拒绝落盘 | PASS | `evidence/D2-11/stdout.log` | persist+token→R2 仲裁→newImported 返回 scope:rejected，S1 未污染 |
| D4-1 | P0 | 凭证文件读取拦截 | PASS | `evidence/D4-1/stdout.log` | deny (hwc-command-credential-file) |
| D4-2 | P0 | 凭证 env 打印拦截 | FAIL | `evidence/D4-2/stdout.log` | HW_ACCESS_KEY/HW_SECRET_KEY 前缀 allow，见缺陷 #1 |
| D4-3 | P0 | 明文 secret API 拦截 | PASS | `evidence/D4-3/stdout.log` | deny (hwc-command-secret-value-read) |
| D4-5 | P0 | 写操作误判检测 | PASS | `evidence/D4-5/stdout.log` | plan DeleteServers→risk:write deny，未误判只读 |
| D4-9 | P0 | 公开暴露/破坏性预检 | PASS | `evidence/D4-9/stdout.log` | deny (hwc-network-public-admin-port) |
| D4-15 | P0 | hook 绕过尝试 | FAIL | `evidence/D4-15/stdout.log` | $() 命令替换+ANSI-C 绕过 allow，见缺陷 #2 |
| D4-16 | P0 | 命令包裹穿透 | PASS | `evidence/D4-16/stdout.log` | bash -c 内层 hcloud ECS DeleteServer→warn 拦截 |
| D4-18 | P0 | confirm-not-deny 审批语义 | PASS | `evidence/D4-18/stdout.log` | 写操作 approvalToken 显式确认/拒绝 |
| D4-19 | P0 | 确认流下预检仍生效 | PASS | `evidence/D4-19/stdout.log` | allowWrites=true 下公网暴露仍 deny |
| D4-21 | P0 | hook_check_artifacts 具名回归 | PASS | `evidence/D4-21/stdout.log` | deny IAM admin + OBS 匿名写 |
| D4-22 | P0 | hook_check_deploy_plan 具名回归 | PASS | `evidence/D4-22/stdout.log` | warn FunctionGraph 公网 |
| D4-23 | P0 | 全局规则注入生效性 | SPEC-MISMATCH | `evidence/D4-23/stdout.log` | 孤儿文件，见缺陷 #3 |
| D8-7 | P0 | 7 个 meta/通用技能指引可机械执行 | PASS | `evidence/D8-7/stdout.log` | retrieve_skill huaweicloud-core ok + 7 技能 |
| D1-3 | P1 | doctor 健康自检 | PASS | `evidence/D1-3/stdout.log` | check_cli installed+authenticated 7.2.12 |
| D1-26 | P1 | 升级提醒工具注册与协议暴露 | PASS | `evidence/D1-26/stdout.log` | check_update/upgrade 工具注册 + tools/list 暴露 |
| D1-27 | P1 | 检测语义-已是最新 | PASS | `evidence/D1-27/stdout.log` | 四态契约 up_to_date |
| D1-41 | P1 | check_update 真实 MCP 返回契约 | PASS | `evidence/D1-41/stdout.log` | currentVersion/latestNext 字段齐全 |
| D3-A1 | P1 | skill 检索完整性 | PASS | `evidence/D3-A1/stdout.log` | retrieve_skill + search_docs + search_marketplace |
| D3-C5 | P1 | 工具冒烟 | PASS | `evidence/D3-C5/stdout.log` | check_cli/list_regions/service_catalog/list_operations |
| D4-4 | P1 | 写操作审批门 | PASS | `evidence/D4-4/stdout.log` | 读 allow / 写 deny |
| D4-6 | P1 | adminPass 回显警告 | FAIL | `evidence/D4-6/stdout.log` | 无警告，见缺陷 #4 |
| D4-7 | P1 | hook 三工具有效性 | PASS | `evidence/D4-7/stdout.log` | 三工具均拦截 |
| D4-17 | P1 | hook 模糊 fail-closed | SPEC-MISMATCH | `evidence/D4-17/stdout.log` | fail-open，见缺陷 #5 |
| D5-3 | P1 | 工具全量枚举 | PASS | `evidence/D5-3/stdout.log` | TOOL_DEFINITIONS 39 工具含 inputSchema |
| D9-1 | P1 | tools/list 合规 | PASS | `evidence/D9-1/stdout.log` | 39 schema-ok |
| D2-2 | P2 | auth status 判定准确性 | PASS | `evidence/D2-2/stdout.log` | configured 判定 + 指纹核对 |
| D3-B1 | P2 | list_operations 规范名 | PASS | `evidence/D3-B1/stdout.log` | ECS 117 操作 |
| D3-B5 | P2 | detect_framework 识别 | PASS | `evidence/D3-B5/stdout.log` | Next/Vite/VitePress/CRA 识别正确 |
| EXP-D5-3-3 | P1 | CodeArtsAgent D5-3 工具全量枚举 | PASS | `evidence/D5-3/stdout.log` | 复用 D5-3 |

---

## 五、缺陷清单（详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整（HW_* 前缀未覆盖） | `cloud-risk-rules.json:39` | 待提单（新发现） |
| 2 | P0 | D4-15 | hook 命令替换绕过（$() + ANSI-C quoting） | `risk-rule-engine.mjs:50-54` | 待提单（复测） |
| 3 | P0 | D4-23 | 全局规则 huawei-agent-rules 未注入（孤儿文件） | `rules/huawei-agent-rules.mdc` 零引用 | 待提单（复测） |
| 4 | P1 | D4-6 | hook 层缺失 adminPass 明文回显警告 | `cloud-risk-rules.json` 无 adminPass | 待提单（复测） |
| 5 | P1 | D4-17 | hook 畸形输入 fail-open（非 fail-closed） | `risk-rule-engine.mjs:106` | 待提单（复测） |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截不完整**
- 期望：`env | grep HW_ACCESS_KEY` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39`
  env-dump 规则第二条件正则 `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀
- 证据：`evidence/D4-2/stdout.log`，复现 `env | grep HW_ACCESS_KEY` 实测 `allow`

**#2 [P0] D4-15 hook 命令替换绕过**
- 期望：`hcloud $(echo $'E\x43S DeleteServer')` → `deny`/`warn`
- 实际：返回 `allow`
- 根因：`risk-rule-engine.mjs:50-54` conditionMatches 纯正则，不做 shell 解析

---

## 六、阻塞项

| 阻塞原因 | 涉及用例 |
|---|---|
| Windows 专属（EINVAL/文件锁/registry 镜像 lag） | D1-39、D1-40；EXP-NR3-01/03/09/11/23 |
| promptfoo 评测 harness 基建未就绪 | D10-1、D10-2、D10-3、D10-4、D10-5；EXP-E01~15 |
| 真云 AK/SK 或资源创建（需最小配置创建→测后归零） | D3-C4、D4-13；EXP-C4-01~22 |
| 非 TTY 审批流（确认令牌过期/拒绝后零操作） | D4-20、D4-24 |
| MCP inspector/mcp-server 协议客户端 + 可注入延迟/并发 | D6-4、D9-2、D9-3、D9-4、D9-5、D9-6、D9-9 |
| install 菜单交互（空 HOME/多客户端共存/镜像源） | D1-58、D7-4；EXP-D1-58-01~05 |
| 其余客户端 D5 枚举（非本客户端 CodeArtsAgent） | EXP-D5-1/2/4~10-* |
| Linux 54 条通用断言探针未逐一执行 | EXP-NR3-02/04/10/24 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D2-11 使用假 AK/SK/token，R3 拒绝后 S1 未污染；auth_status 指纹复核 caae65f2 未变）

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/OBS/沙箱等真云资源 | 否 | — | 本轮未创建，残留 0 |

> 本轮仅做只读/黑盒 hook/规划检查，无真云资源落地；D2-11 冲突仲裁后 R3 拒绝（scope:rejected），无凭证写入。

---

## 九、遗留与建议

- 待裁决 SPEC：D4-17（fail-closed 语义）、D4-23（规则注入契约）
- 本轮未覆盖：真云 E2E、多终端矩阵（其他 9 客户端）、审批流实时对话框、MCP 协议 inspector 深测、CLI 安装/卸载、源码直调类（semverCompare/judgeUpdate/dismiss 冷却）、文档一致性、性能延迟采样、NR3 Linux 54 条通用断言探针
- 建议：优先修复 P0 #1（env-dump 正则补 `HW_ACCESS_KEY|HW_SECRET_KEY|HW_SECURITY_TOKEN` 前缀）；#2（hook 引入 shell 解析或覆盖 `$()`/ANSI-C quoting）；#3（规则文件接入 install 注入或删除孤儿文件）
