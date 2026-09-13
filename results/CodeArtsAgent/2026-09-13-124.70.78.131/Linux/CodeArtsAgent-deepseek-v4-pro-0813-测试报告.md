# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-13 17:12:04（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-13-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 P0 缺陷 + P0 缺口，不标 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（codearts CLI）+ deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.4-next.3（npm @next，gitHead 3b6290b） |
| 工具全集 | 39（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 |
| 真云凭证 | 未使用（本轮无真云 E2E） |
| 测试类型 | MCP 黑盒直调（hook/auth/plan）+ 源码级检查 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：通过 MCP 工具（huaweicloud_*）黑盒直调被测对象，结果落 `stdout.log`；安全 hook/认证/规划类高危用例 + 关键 P0 逐一真实执行；源码级检查用于根因定位与孤儿文件核验。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行 | 28（设计级 27 + 展开级 1） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 24 / 2 / 53 / 2 / 71 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 85.7%（24/28） |
| P0 / P1 新增缺陷 | 2（D4-15、D4-23）/ 2（D4-6、D4-17） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级（81）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 23 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D4-15 hook 绕过、D4-6 adminPass 无警告 |
| BLOCKED | 31 | 环境阻塞（Windows/真云/TTY/harness/inspector） |
| SPEC-MISMATCH | 2 | D4-17 fail-open、D4-23 规则孤儿文件 |
| NOT_RUN | 23 | 本轮未覆盖（源码/CLI 安装卸载/文档/性能类） |
| **合计** | **81** | |

### 3.2 展开级（71）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 1 | EXP-D5-3-3（CodeArtsAgent D5-3 工具全量枚举，复用 D5-3 证据） |
| FAIL | 0 | |
| BLOCKED | 22 | EXP-E 评测集、EXP-D1-58 install 菜单、NR3 Windows/macOS |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 48 | 其余客户端 D5 枚举、EXP-C4 服务只读冒烟同质枚举未逐一执行 |
| **合计** | **71** | |

---

## 四、逐用例结果（已执行项）

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 | 备注 |
|---|---|---|---|---|---|
| D2-11 | P0 | R3 STS token 拒绝落盘 | PASS | `evidence/D2-11/stdout.log` | persist+token→R2仲裁→newImported 返回 scope:rejected，S1 未污染 |
| D4-1 | P0 | 凭证文件读取拦截 | PASS | `evidence/D4-1/stdout.log` | deny |
| D4-2 | P0 | 凭证 env 打印拦截 | PASS | `evidence/D4-2/stdout.log` | deny |
| D4-3 | P0 | 明文 secret API 拦截 | PASS | `evidence/D4-3/stdout.log` | deny |
| D4-5 | P0 | 写操作误判检测 | PASS | `evidence/D4-5/stdout.log` | deny write |
| D4-9 | P0 | 公开暴露/破坏性预检 | PASS | `evidence/D4-9/stdout.log` | deny |
| D4-16 | P0 | 命令包裹穿透 | PASS | `evidence/D4-16/stdout.log` | warn 拦截 |
| D4-21 | P0 | hook_check_artifacts 具名回归 | PASS | `evidence/D4-21/stdout.log` | deny IAM admin |
| D4-22 | P0 | hook_check_deploy_plan 具名回归 | PASS | `evidence/D4-22/stdout.log` | warn FunctionGraph 公网 |
| D8-7 | P0 | 7 个 meta/通用技能指引可机械执行 | PASS | `evidence/D8-7/stdout.log` | retrieve_skill ok |
| D2-4 | P0 | 凭证脱敏正确性 | PASS | `evidence/D2-4/stdout.log` | redacted |
| D4-15 | P0 | hook 绕过尝试 | FAIL | `evidence/D4-15/stdout.log` | 根因见缺陷 #1 |
| D4-23 | P0 | 全局规则注入生效性 | SPEC-MISMATCH | `evidence/D4-23/stdout.log` | 孤儿文件，见缺陷 #2 |
| D4-4 | P1 | 写操作审批门 | PASS | `evidence/D4-4/stdout.log` | 写 deny/只读 allow |
| D4-7 | P1 | hook 三工具有效性 | PASS | `evidence/D4-7/stdout.log` | 三工具均拦截 |
| D4-17 | P1 | hook 模糊 fail-closed | SPEC-MISMATCH | `evidence/D4-17/stdout.log` | fail-open，见缺陷 #4 |
| D4-6 | P1 | adminPass 回显警告 | FAIL | `evidence/D4-6/stdout.log` | 无警告，见缺陷 #3 |
| D1-26 | P1 | 升级提醒工具注册与协议暴露 | PASS | `evidence/D1-26/stdout.log` | schema-ok |
| D1-27 | P1 | 检测语义-已是最新 | PASS | `evidence/D1-27/stdout.log` | 四态契约 |
| D1-41 | P1 | check_update 真实 MCP 返回契约 | PASS | `evidence/D1-41/stdout.log` | currentVersion/latestNext |
| D3-A1 | P1 | skill 检索完整性 | PASS | `evidence/D3-A1/stdout.log` | retrieve_skill + search_docs |
| D3-C5 | P1 | 工具冒烟 | PASS | `evidence/D3-C5/stdout.log` | check_cli/list_regions/service_catalog |
| D5-3 | P1 | 工具全量枚举 | PASS | `evidence/D5-3/stdout.log` | 39 工具含 inputSchema |
| D9-1 | P1 | tools/list 合规 | PASS | `evidence/D9-1/stdout.log` | 39 schema-ok |
| D2-2 | P2 | auth status 判定准确性 | PASS | `evidence/D2-2/stdout.log` | configured 判定 |
| D3-B1 | P2 | list_operations 规范名 | PASS | `evidence/D3-B1/stdout.log` | ECS 117 操作 |
| D3-B5 | P2 | detect_framework 识别 | PASS | `evidence/D3-B5/stdout.log` | React/Next/Vue/VitePress |
| EXP-D5-3-3 | P1 | CodeArtsAgent D5-3 工具全量枚举 | PASS | `evidence/D5-3/stdout.log` | 复用 D5-3 |

---

## 五、缺陷清单（详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-15 | hook 命令绕过（$() 命令替换+ANSI-C quoting 放行破坏性删除） | `risk-rule-engine.mjs:50-54` + `cloud-risk-rules.json` 三段式正则 | 待提单 |
| 2 | P0 | D4-23 | 全局规则 huawei-agent-rules 未注入（孤儿文件） | `rules/huawei-agent-rules.mdc` 零引用 | 待提单 |
| 3 | P1 | D4-6 | hook 层缺失 adminPass 明文回显警告 | `cloud-risk-rules.json` 无 adminPass 规则 | 待提单 |
| 4 | P1 | D4-17 | hook 畸形输入 fail-open（非 fail-closed） | `risk-rule-engine.mjs:79-108` evaluate 缺 fail-closed | 待提单 |

---

## 六、阻塞项

| 阻塞原因 | 涉及用例 |
|---|---|
| Windows 专属（EINVAL/文件锁/registry 镜像 lag） | D1-39、D1-40 |
| 真云 AK/SK 或资源创建（需最小配置创建→测后归零，单 run 无人工审批闭环） | D2-1、D2-10、D2-12、D2-13、D2-16、D3-B3、D3-C4、D4-13 |
| 非 TTY 审批流（confirm-not-deny/确认流/令牌过期） | D4-18、D4-19、D4-20、D4-24 |
| MCP inspector/mcp-server 协议客户端 + 可注入延迟 | D6-4、D9-2、D9-3、D9-4、D9-5、D9-6、D9-7、D9-8、D9-9 |
| promptfoo 评测 harness 基建未就绪 | D10-1、D10-2、D10-3、D10-4、D10-5 |
| install 菜单交互（空 HOME/多客户端共存/镜像源） | D1-2、D1-58、D7-4 |
| 展开级：评测集 / install 菜单 / Windows·macOS 探针 | EXP-E01~15、EXP-D1-58-01~05、EXP-NR3-09、EXP-NR3-11 |

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

> 本轮仅做只读/黑盒 hook/规划检查，无真云资源落地；D2-11 冲突仲裁后选 s1 恢复 + R3 拒绝，无凭证写入。

---

## 九、遗留与建议

- 待裁决 SPEC：D4-17（fail-closed 语义）、D4-23（规则注入契约）
- 本轮未覆盖：真云 E2E、多终端矩阵（其他 9 客户端）、审批流实时对话框、MCP 协议 inspector 深测、CLI 安装/卸载、源码直调类（semverCompare/judgeUpdate/dismiss 冷却）、文档一致性、性能延迟采样
- 建议：优先修复 P0 #1（hook 命令替换绕过，需引入 shell 解析或覆盖 `$()`/ANSI-C quoting）；#2 规则文件接入 install 注入或删除孤儿文件
