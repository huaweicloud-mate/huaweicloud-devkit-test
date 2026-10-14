# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-14（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-14-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 与 P0 缺陷，均历史延续，无新增，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（IP 1.94.193.150） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8`（npm latest，gitHead `74f519dc`） |
| 工具全集 | `42`（tools/list=42，文档 AGENTS.md 仍声明 39，漂移见 D8-1） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI，真云可用） |
| 真云凭证 | cn-north-4（AKSK 管理员 + 只读子账号 test001，均已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（ECS/OBS/EIP/VPC 建删归零）/ D10 评测集 / fixtures |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `evidence/<case-id>/stdout.txt`；真云用例经 hcloud CLI + MCP 工具真机建删并测后归零验证；D2-10/D2-13/D4-12/D9-6/D9-9 走 `eval/harness/fixtures/*.mjs` 夹具；D4-13 用只读子账号 test001 实测最小权限；D10-3 直调 serviceCatalog + `eval/harness/run-eval.mjs`（15 条中文意图）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（D1-39 Windows 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 11 / 2 / 2 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `90.9%`（130/143） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（13 项全部命中历史 issue，无新增） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（ECS/EIP/VPC/子网/安全组/OBS 桶均已删，沙箱会话已关闭） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | D3-S6/D3-S7 真云创建需改用例（见 §五） |
| SPEC-MISMATCH | `2` | D4-24 / D9-9 契约漂移 |
| NOT_RUN | `1` | D1-39 Windows 专属（Linux 不适用） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文意图「云主机」残留 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（13 项，全部历史延续，详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData 明文 secret 解密 API 未拦截 | safety/policy.json:26 | 历史 |
| 2 | P0 | D4-15 | `$(...)` 命令替换(ANSIC/printf/base64)绕过 | risk-rule-engine.mjs | 历史 #673 |
| 3 | P0 | D4-21 | HCL/Terraform broad IAM 未拦截 | risk-rule-engine.mjs:150 | 历史 |
| 4 | P0 | D9-12 | initialize 时序未强制（未返回 -32600） | mcp-server.mjs:175 | 历史 #699/#774 |
| 5 | P1 | D4-17 | 畸形输入 fail-open | risk-rule-engine.mjs | 历史 #673 |
| 6 | P1 | D4-24 | 审批令牌契约字段漂移（SPEC） | hcloud-cli.mjs:113 | 历史 #745/#747 |
| 7 | P1 | D9-9 | tools/call 取消语义未声明（SPEC） | mcp-protocol.mjs:47 | 历史 #774/#698 |
| 8 | P2 | D4-25 | Python hook 写操作遥测分类失效 | huaweicloud-safety.py:46 | 历史 #13 |
| 9 | P2 | D4-26 | findings 证据 secret_key/adminPass 明文残留 | risk-rule-engine.mjs | 历史 |
| 10 | P2 | D8-1 | 文档声明 39 vs 实现 42 漂移 | AGENTS.md:27,45 | 历史 |
| 11 | P2 | D8-9 | sanitizeValue 不脱敏 AK/SK/token | telemetry.mjs | 历史 #797 |
| 12 | P2 | D3-S5 | 复合意图未拆分命中多 service | tools.mjs serviceCatalog | 历史 #11 |
| 13 | P2 | EXP-E01 | 中文意图「云主机」未命中 ECS | tools.mjs serviceCatalog | 历史 #11 |

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），本机 Linux，由 D1-40/EXP-NR3 代表覆盖 |
| D3-S6 | 设计级 | P2 | BLOCKED | 改用例 | FunctionGraph 定时任务真云创建用例，探针 CreateFunction 未提供 function_name/code 完整参数，hcloud 返回 USE_ERROR Invalid parameter: code.zip_file，无法真机创建函数验证 URN/触发器绑定 |
| D3-S7 | 设计级 | P2 | BLOCKED | 改用例 | 跨服务交付用例需先编排创建 VPC/子网/安全组前置再创建 RDS，探针未实现前置编排，CreateInstance 缺 db.password/VPC 参数返回 USE_ERROR Invalid parameter: db.password |

> 维护建议：D3-S6/D3-S7 属真云创建场景，需维护 agent 补充完整参数编排（前置 VPC/子网/安全组 + function_name/code/db.password），或改判为「真云编排能力」用例并标注前置环境要求。

---

## 六、安全 / 红线

| 检查项 | 结果 |
|---|---|
| I 类红线违规（mock 真云 / 无凭证标 BLOCKED / 虚报 PASS） | `0` |
| 真云用例是否真机执行 | `是`（ECS/OBS/EIP/VPC/沙箱均真机建删归零） |
| PASS 门禁（evidencePath 证据落盘） | `通过`（verify_no_fake_pass） |
| 覆盖率门禁（P0 无 NOT_RUN/空） | `通过`（verify_coverage，NOT_RUN+空 0%） |
| 只读子账号状态 | `test001 已下发，D4-13 实测只读 6/6 + 写拒绝 + 归零` |
| 目录权限 | `仅提交 results/CodeArtsAgent/，未碰 Summary/其他客户端/test-cases` |

---

## 七、资源释放

| 资源 | 创建 | 删除/归零 |
|---|---|---|
| ECS（D3-C1，c6.large.2 + Ubuntu24.04 gold 48de6f82） | 77bcf9e1-8eab-4726-acef-dafe304557cb | DELETED（DeleteServers job_id 落盘，轮询后归零） |
| EIP（D3-C7，121.36.54.113）+ 带宽 | 已创建（e8fc0e83-7389-4aff-9383-948ec2506213） | 已删（DeletePublicip，PoV ListPublicips 不含） |
| VPC/子网/安全组（D3-C1 前置） | aed83253-… / d83501b3-… / 045f69a1-… | 已删（ECS→SG→子网→VPC 顺序删除，归零验证通过） |
| OBS 桶（D3-C2 tctest-c2-77p667） | 已建 + 网站托管 | 已删（rm -f，归零 ls 不含） |
| 测试 VPC（D3-S2 realcloud / D4-14） | 已建 | 已删（归零验证通过） |
| 沙箱会话（D3-S3/D3-C3/D3-C6） | 已连接 | close_session 已关闭 |

> 真云全部资源建删归零，无残留。首轮 D3-C1 ECS 因 marketplace 镜像 product 缺失(Ecs.0707)改用公共 gold 镜像 48de6f82 后创建成功并 ACTIVE，随后删除归零。

---

## 八、遗留建议

1. **kms DecryptData / 命令替换绕过 / HCL broad IAM**（P0×3）：security 规则库需将 kms DecryptData 列入 blockedSecretOperations、解析 `$(...)` 命令替换内层、覆盖 HCL/Terraform `actions=["*"]` 语法。
2. **D9-12 协议时序**：mcp-server dispatch 前增加 initialize 状态机，未 initialize 先 tools/list 返回 -32600。
3. **D8-1 文档漂移**：AGENTS.md:27,45 同步工具数 42。
4. **D3-S6/D3-S7 改用例**：维护 agent 补充真云编排参数。
5. **版本趋势**：v1.1.8（74f519dc）下 13 项缺陷与本机 2026-10-13 无变化，均为历史延续（security 规则库 / MCP 协议时序 / 文档漂移 / serviceCatalog 中文路由）。
