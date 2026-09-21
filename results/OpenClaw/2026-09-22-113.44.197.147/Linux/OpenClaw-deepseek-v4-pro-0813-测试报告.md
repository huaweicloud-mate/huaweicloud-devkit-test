# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-22 06:00:00`（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-22-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（16 项 FAIL/SPEC 全部历史同源，本轮无新增提单，1 项真机环境阻塞已解归零）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0003） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm **latest 正式版**，gitHead `e7ed6f6`，release-1.1.5） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud（`~/bin/hcloud`）已配置，doctor 自检通过 |
| 真云凭证 | `cn-north-4`（AK/SK + 只读子账号 test001 均就绪） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| 设计真源 | 设计级 100 / 展开级 39 / 追踪表 211 行 |
| daily 基础用例 | 设计级 100（P0 19 / P1 51 / P2 30）+ 展开级 39（P1） |

> **版本选择说明**：`prepare_env.py --update` 默认「自动取 latest/next 最高版本」会把 SUT 切到 `1.1.6-next.0`（预发布）。依据仓库根 `AGENTS.md §0`「npm 安装最新正式包（latest；测 NR 预发布新功能时才用 --next）」的铁律，本轮强制 `prepare_env.py --update --latest` 回归 **1.1.5 正式版**，并同步将 hdk 源码 checkout 至 1.1.5 对应 commit `e7ed6f6`，保证源码检查与黑盒测同一版本。

> **执行方法**：探针脚本（.mjs/.py）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数或真机 hcloud 命令，决策/结果落 `evidence/<case-id>/*.stdout.log`；真云用例真机建删并归零验证；证据统一落 `evidence/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `139`（设计级 100 + 展开级 39） |
| 已执行 | `137`（100 设计级执行 99 + 1 OS 专属豁免；39 展开级执行 38 + 1 BLOCKED） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `110 / 25 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 设计级 `84.7%`（83/98）；展开级 `71.1%`（27/38） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（25 项 FAIL/SPEC 全部命中历史单，本轮不重复提单） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（真云 E2E 建删 RDS/VPC/subnet/安全组/函数/OBS 桶后计数归零） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `83` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | 不符预期，根因见缺陷清单（全部历史同源） |
| BLOCKED | `1` | D3-S3 沙箱 expose 步骤（沙箱镜像 devbridge 鉴权参数变更，非产品缺陷） |
| SPEC-MISMATCH | `1` | D9-9 caps.cancellation 未暴露（历史同源） |
| NOT_RUN | `1` | D1-39 Windows 专属用例，Linux 结构性不适用（OS 专属豁免） |
| **合计** | **`100`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E 中文路由 MISS（D10-3 子项，历史同源） |
| BLOCKED | `1` | EXP-E08 真·外部依赖（真实 Agent 诊断意图层） |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 铁律：以下 25 项 FAIL/SPEC 均为**历史同源**缺陷，本轮全量探针 fresh 重跑复现，`file_issue.py` 查重命中上游已有 issue，**不重复提单**，关联清单详见 `HISTORY_LINKS.md`。本轮**无新增缺陷**。

### 4.1 设计级 FAIL / SPEC

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整（HW_SECRET_KEY 漏网） | `env \| grep HW_SECRET_KEY` 应返回 `deny` | `safety-policy.mjs` env-dump 正则/枚举未覆盖 `HW_SECRET_KEY` 精确形态 | 历史同源 |
| 2 | P0 | `D4-16` | 命令包裹穿透（`sh -c "env\|grep"` 未解包） | `sh -c "env \| grep HUAWEICLOUD"` 应 `deny` | 包裹命令未解包再判 | 历史同源 |
| 3 | P0 | `D4-21` | hook_check_artifacts broad IAM 未拦截 | HCL `actions=["*"]` 应检出 | broad IAM 规则缺失 | 历史同源 |
| 4 | P0 | `D4-23` | huawei-agent-rules.mdc 注入失效 | package.json files 白名单应含 rules/ | 全局规则安装注入链断（`package.json` files 白名单未含 rules/） | 历史同源 |
| 5 | P1 | `D4-6` | adminPass 空格形式未脱敏 | 空格形式 adminPass 值应 `<redacted>` | adminPass 回显警告仅覆盖等号形式 | 历史同源 |
| 6 | P1 | `D4-7` | hook 三工具有效性不完整 | hook_check_artifacts HCL broad IAM 应 `deny` | broad IAM 规则缺失 | 历史同源 |
| 7 | P1 | `D4-17` | hook 三工具畸形输入 fail-open | 畸形输入应 fail-closed | hook 三工具异常输入放行 | 历史同源 |
| 8 | P2 | `D4-25` | Python hook 写命令遥测误分类为 cli:invoke | 写命令应产出 `cli:write` | `huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 无词边界 | 历史同源 #752 |
| 9 | P1 | `D4-27` | 双路径输出脱敏不完整（裸 token=/小写 ak=/sk= 未脱敏） | 裸 `token=`、小写 `ak=` 应无明文 | 脱敏模式未覆盖裸 token/小写键 | 历史同源 |
| 10 | P1 | `D9-2` | JSON-RPC 错误码：tools/list 传 string params 未返回 -32602 | 非法 params 应返回 -32602 | protocol 层未校验 params 类型 | 历史同源 |
| 11 | P1 | `D9-4` | 协议生命周期：initialize 前 tools/list 未按规范报错 | 未 initialize 应先报错 | 生命周期门控缺失 | 历史同源 |
| 12 | P2 | `D9-7` | 协议版本协商降级：protocolVersion 不校验不回显 | 应校验并回显 protocolVersion | 版本协商逻辑缺失 | 历史同源 |
| 13 | P1 | `D9-9` | tools/call 超时协议语义与取消（SPEC） | capabilities.cancellation 应暴露 | capabilities 未暴露 cancellation（契约漂移） | 历史同源 |
| 14 | P1 | `D10-3` | 服务目录中文意图路由准确率 21.4%（< 90%） | 中文意图路由准确率应 ≥ 90% | serviceCatalog 中文关键词覆盖不足 | 历史同源 |
| 15 | P2 | `D3-S5` | 复合中文意图分层路由拆分失败（全角逗号不拆分） | 应同时命中 RDS 与 OBS | `tools.mjs:1884` tokenizer 仅按 ASCII 逗号断开 | 历史同源 |

### 4.2 展开级 FAIL（D10-3 中文路由子项）

EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14 共 11 项，均为 `serviceCatalog` 中文意图 `MISS`（未命中期望服务），与设计级 D10-3 同源，历史已提单，不重复开单。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」：Windows 升级检测链 EINVAL/npm.cmd 专属）；Linux 无 npm.cmd/EINVAL 语义，本 OS 结构性不适用。Linux 侧检测链已由源码级 `probe-d1-39-linux.mjs`（queryDistTagsSync 直调，dist-tags 含 latest+next）佐证。 | 无（OS 专属，维护方确认归属即可） |
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | 真机沙箱 E2E 核心步骤 connect/check_user/upload_project/deploy_nginx **均 PASS**，仅最后 expose 步骤失败：沙箱内 `devbridge 0.2.2-release`（2026-09-22 镜像）已移除 `devbridge auth login --huaweicloud --access-key --secret-key` 登录参数（现仅剩 `--api-key`），沙箱未预置 api-key，`devbridge host` 报 `API key expired, please login again`。2026-09-21 同探针旧参数仍 `Login successful`，属沙箱镜像版本变更。 | 非 hdk 源码缺陷，不需改用例；需沙箱镜像预置 devbridge api-key 或恢复 AK/SK 登录后复测。 |
| `EXP-E08` | 展开级 | P1 | BLOCKED | 补环境 | 真实 Agent 会话诊断意图层（「ECS启动失败帮我分析原因」）需真实 LLM Agent 判断是否路由 `huaweicloud_explain_error`；`eval/harness/run-eval.mjs` 的 serviceCatalog 确定性路由层无法代理该诊断意图。缺可交互真实 Agent 会话级 harness（仅 DSH/装了 dsh 客户端可用）。 | 接入可交互真实 Agent 客户端会话自动化（CDP）后复测。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针只输出 redacted/布尔断言；`hw_creds.sh` 诊断输出已脱敏为长度/字段，未落盘明文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（tctest-s2-*） | 是 | 已删 | 删除后归零 |
| RDS（tctests7db*）+ VPC/subnet（tctest-s7-*） | 是 | 已删 | RDS ListInstances=0；VPC/subnet 异步删除后手动补删，复盘点 tctest-s7- VPC 残留=0、全账号 VPC=0 |
| VPC 安全组（tctest-d3c4-* / tctest-ro-*） | 是 | 已删 | 删除后计数归零（仅删本次创建前缀） |
| FunctionGraph 函数（D3-S6） | 是 | 已删 | ListFunctions 无残留 |
| OBS 桶（tctest-obs-website-*） | 是 | 已删 | 删桶成功 |
| 沙箱会话（D3-S3） | 是 | 已 close_session | 会话关闭 ok |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留 0。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未暴露，契约漂移，历史同源）
- 本轮未覆盖（说明范围）：`EXP-E08` 真实 Agent 会话诊断意图（非 DSH 客户端缺 CDP 会话自动化环境）；`D3-S3` 沙箱 expose 步骤（沙箱镜像 devbridge 鉴权参数变更，待镜像侧修复）
- 建议：25 项 FAIL/SPEC 均为 v1.1.5 已知历史缺陷（多客户端多轮复现，`HISTORY_LINKS.md` 已关联），建议维护方集中修复；其中 `D3-S3` 沙箱 expose 阻塞为**环境侧新变化**（devbridge 0.2.2 移除 AK/SK 登录），已在报告 §五 标注，请维护方同步沙箱镜像侧处理。