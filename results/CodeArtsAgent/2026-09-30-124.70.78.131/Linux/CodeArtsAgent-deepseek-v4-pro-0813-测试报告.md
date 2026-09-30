# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-30（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-30-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 与 P0 缺陷，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（ecs-hd-ai-work-00-0011，IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b474`） |
| 工具全集 | `41`（tools/list=41，较 v1.1.7 新增 sandbox_expose_tunnel） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI，真云可用）；undici 已列入 dependencies |
| 真云凭证 | cn-north-4（AKSK 管理员 + 只读子账号 test001，均已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（VPC/OBS/沙箱/最小权限建删归零）/ D10 评测集 / fixtures |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `evidence/<case-id>/stdout.txt`；真云用例经 `hcloud`/MCP 工具真机建删并测后归零验证；D2-10/D2-13/D4-12/D9-6/D9-9 走 `eval/harness/fixtures/*.mjs` 夹具；D4-13 用只读子账号 test001 实测最小权限；D10-3 评估直调 serviceCatalog + `eval/harness/run-eval.mjs`（15 条中文意图）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 11 / 2 / 2 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `90.6%`（125/138） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（11+2 项全部命中历史 issue，无新增） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/OBS/沙箱均已删净） |

> **相对 v1.1.7（2026-09-28）的修复**：D4-16 命令包裹穿透（已拦截）、D4-23 全局规则注入（package.json files 已含 rules + install 产物含 mdc）、D10-3 中文路由（准确率 21.4%→92.9%）、D4-2 凭证 env 打印拦截（HW_ 前缀已拦截）、D4-24 审批令牌（新增 inspectApprovalToken 状态机，字段契约待对齐）、D1-68（SPEC→PASS）、D2-10/D2-13/D4-12（BLOCKED→fixture PASS）。

---

## 三、状态汇总

### 3.1 设计级（102）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | D3-S6/D3-S7 真云创建用例探针测试数据/前置不完整（改用例） |
| SPEC-MISMATCH | `2` | D9-9 取消语义未声明；D4-24 令牌契约字段漂移 |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 列标注专属，Linux 豁免） |
| **合计** | **`102`** | |

- **P0**（21）：PASS 16 / FAIL 4（D4-3、D4-15、D4-21、D9-12）/ NOT_RUN 1（D1-39 OS 专属豁免）
- **P1**（51）：PASS 46 / FAIL 2（D4-17、D3-S7→BLOCKED 已改）/ SPEC 2（D9-9、D4-24）/ BLOCKED 1（D3-S7）
- **P2**（30）：PASS 25 / FAIL 4（D4-25、D4-26、D8-1、D8-9、D3-S5）/ BLOCKED 1（D3-S6）

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | EXP-C4 22/22 + EXP-D5 2/2 + D10 评测集中文意图 HIT 13 + E08 诊断 |
| FAIL | `1` | EXP-E01「查云主机」中文意图 MISS（fallback） |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽）

> 详单见 `FINDINGS.md`（12 项）。全部命中历史 issue（file_issue.py 查重），无新增缺陷。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData 明文 secret 解密 API 未拦截 | policy.json:26 blockedSecretOperations 缺 DecryptData | 历史 |
| 2 | P0 | D4-15 | ANSI-C 引号编码绕过写操作规则 | risk-rule-engine.mjs 未解析 ANSI-C | 历史 #673 |
| 3 | P0 | D4-21 | HCL/Terraform broad IAM 未拦截（只拦 JSON） | risk-rule-engine.mjs:150 | 历史 |
| 4 | P0 | D9-12 | 非法时序 tools/list 未 initialize 未返 -32600 | mcp-server.mjs:175 无时序校验 | 历史 #699/#774 |
| 5 | P1 | D4-17 | hook 畸形输入 fail-open | risk-rule-engine.mjs 无 finding 即 allow | 历史 #673 |
| 6 | P1 | D4-24 | 令牌契约字段漂移（state 枚举 vs code/outcome） | hcloud-cli.mjs:113 | 历史 #745/#747 |
| 7 | P1 | D9-9 | tools/call 取消语义未声明（SPEC） | mcp-protocol.mjs:47 | 历史 #774/#698 |
| 8 | P2 | D4-25 | Python hook 写分类失效（CreateVpc→cli:invoke） | huaweicloud-safety.py:46 | 历史 #13 |
| 9 | P2 | D4-26 | findings.evidence 中 secret_key/adminPass 明文残留 | risk-rule-engine.mjs | 历史 |
| 10 | P2 | D8-1 | 文档声明 39 tools vs 实现 41 | AGENTS.md:27 | 历史 |
| 11 | P2 | D8-9 | sanitizeValue 不脱敏 AK/SK/token | telemetry.mjs:189 | 历史 #797 |
| 12 | P2 | D3-S5/EXP-E01 | 复合意图/「查云主机」路由残留 MISS（92.9% 已达标） | tools.mjs serviceCatalog routeMap | 历史 #11 |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链（EINVAL/文件锁），OS 列标注「专属」，本机 Linux | 由 D1-40 + EXP-NR3 代表覆盖，Linux 侧无需执行 |
| D3-S6 | 设计级 | P2 | BLOCKED | 改用例 | FunctionGraph 定时任务真云创建，探针 CreateFunction 未提供 function_name/code 完整参数，返回 USE_ERROR | 补全探针 CreateFunction 的 function_name/code/触发器参数后真机创建 |
| D3-S7 | 设计级 | P1 | BLOCKED | 改用例 | 跨服务交付用例需先编排 VPC/子网/安全组前置再建 RDS，探针未实现前置编排，CreateInstance 缺 db.password/VPC 参数 | 用例/探针补全 VPC/子网/安全组前置编排步骤与 db.password 参数 |

> 其余无 BLOCKED/NOT_RUN（D9-6 经双 stdio 客户端互证 7/7 PASS；D3-S3 沙箱真机全链路走通，nginx serving HTTP 200；D2-10/D2-13/D4-12 fixture 全 PASS）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（show_profile_redacted 走 redaction pipeline，ak/sk/token 均 `<redacted>`）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 只读子账号（test001）写操作被 IAM 拒绝（PolicyNotAuthorized），最小权限生效，只读 6/6
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14/D3-S2） | 是 | 已删 | ListVpcs 归零（containsOwn=false） |
| VPC（D3-S2 确认流） | 是 | 已删 | 归零 |
| OBS 桶（D3-C13） | 是 | 已删（obs rm -f） | 已归零 |
| 沙箱（D3-S3） | 是 | close_session | 会话关闭，无计费残留 |
| 只读子账号写（D4-13） | 拒绝 | — | 未创建任何 VPC |

> 真云只删本次创建资源（前缀 `tctest-codeartsagent-`），测后逐一归零验证。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（tools/call 取消语义未声明）、`D4-24`（令牌返回 state 枚举 vs 契约 code/outcome）。
- 本轮无新增缺陷：12 项缺陷全部命中历史 issue，file_issue.py 查重后不重复开单。
- v1.1.8-next.1 已修复（相对 v1.1.7）：D4-16 命令包裹穿透、D4-23 全局规则注入（files 含 rules）、D10-3 中文路由 21.4%→92.9%、D4-2 HW_ 前缀 env 拦截、D1-68 图标离线/区域 env、D2-10/D2-13/D4-12（fixture 化）。建议继续推进剩余安全 P0（D4-3 KMS DecryptData、D4-15 ANSI-C、D4-21 HCL IAM、D9-12 initialize 时序）与 serviceCatalog 残留中文意图（EXP-E01 云主机清单）覆盖。
- 遗留：D3-S3 沙箱 deploy_nginx 返回 url 空 + devbridge_tunnel FAIL（公网 URL 外发依赖 DevStation 隧道，nginx 本身 serving HTTP 200）。
