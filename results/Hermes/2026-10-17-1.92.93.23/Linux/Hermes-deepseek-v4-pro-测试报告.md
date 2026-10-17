# Hermes-deepseek-v4-pro 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-测试报告.md`
> **生成时间**：2026-10-17 05:38:24（北京时间）
> **执行归档**：`results/Hermes/2026-10-17-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：**PARTIAL**（有 FAIL + P0 缺口，未达全 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0007，IP 1.92.93.23） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.9-next.0`（npm @next 自动取最高，gitHead `6302921c`，PR #914） |
| 工具全集 | `42`（tools.mjs TOOL_DEFINITIONS，protocol 探针实测 42 工具） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI），doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK 已配置 + 只读子账号 test001 已配置） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 43（预筛后）/ 追踪表 + mission-001 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 / spawn MCP server，决策与结果落 `stdout.log`；真云 E2E 经 `huaweicloud_plan_cli_command` + `run_approved_command` + `run_readonly_command` 真机建删；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 150（设计级 107 + 展开级 43，另使命 9 条为设计级子集） |
| 已执行 | 150 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 131 / 15 / 2 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 131 / 147 = **89.1%** |
| P0 / P1 / P2 新增缺陷 | 1 / 7 / 6（合并 14 项，见 FINDINGS） |
| 红线（I 类）违规 | 0（1 次真云删除静默失败已当场人工归零，无残留） |
| 资源释放 | 全部归零（VPC/子网/EIP/OBS 桶均删除并验证归零） |

---

## 三、状态汇总

### 3.1 设计级（107，含 1 条 OS 专属豁免）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 91 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | D2-10、D3-C1、D3-C4、D3-S5、D4-6、D4-13、D4-17、D4-25、D4-26、D8-9、D9-8、D9-12 |
| BLOCKED | 2 | D3-S6、D3-S7（真机 FunctionGraph/RDS 需补环境参数） |
| SPEC-MISMATCH | 1 | D9-9（取消能力未声明） |
| NOT_RUN | 1 | D1-39（Windows 专属，本机 Linux，由 EXP-NR3-10 覆盖） |
| **合计** | **107** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 40 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | EXP-C4-14(DMS)、EXP-C4-18(DEW)、EXP-E01（中文查 ECS 未路由） |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **43** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D9-12 | tools/list 未 initialize 不被拒 | 非法时序 tools/list 应返回 -32600 | listed=true 未拒绝，无 initialize 前置校验 | mcp-server.mjs:177-187 | P | 待提单 |
| 2 | P1 | D3-C1 | run_approved_command 未校验底层执行结果 | 底层 USE_ERROR 应返回 ok:false | DeleteSubnet 缺 vpc_id 底层失败却报 ok:true，资源泄漏 | tools.mjs:1927 runApprovedCommand | P | 待提单 |
| 3 | P1 | D3-C4 | DMS/DEW 服务无有效路由操作名 | 全部服务有规范路由且可执行 | DMS/DEW list_operations 无 command 字段 | tools.mjs:1827-1831（聚合定义） | P | 待提单 |
| 4 | P1 | D4-6 | redactSecrets 未覆盖空格/JSON 形态 | --admin_pass X 与 JSON 带引号 key 应脱敏 | 两形态明文密码未脱敏 | safety-policy.mjs:49 | P | 待提单 |
| 5 | P1 | D2-10 | KooCLI 多 profile 夹具 5/6 | resolveManagedProfile 稳定返回 current 档 | 1 项多 profile 断言未达 | auth/reconcile.mjs:87 | P | 待提单 |
| 6 | P1 | D4-13 | 只读子账号最小权限不完整 | 只读 100% 可用 | CES ListMetrics 被拒（5/6） | 只读子账号 IAM 策略缺 CES | P | 待提单 |
| 7 | P1 | D4-17 | hook 模糊输入 fail-closed 未满足 | 异常输入默认拒绝 | && rm -rf 等纯 shell 破坏输入返回 ok | hook 分类仅覆盖华为云规则 | P | 待提单 |
| 8 | P1 | D10-3 | 中文 serviceCatalog 为空致查云主机未路由 | 中文意图应命中 ECS | EXP-E01 MISS | hcloud-cli.mjs:252 services_cn.json 空 | P | 待提单 |
| 9 | P2 | D4-26 | findings.evidence 明文密钥残留 | evidence 中 AK/SK/password 应 redacted | leaked=true | hcloud-cli.mjs hashArgs/redactOutput 未覆盖 | P | 待提单 |
| 10 | P2 | D4-25 | 写操作遥测分类错误 | 写→cli:write | CreateVpc 记录为 cli:invoke | hook 遥测分类逻辑 | P | 待提单 |
| 11 | P2 | D8-9 | sanitizeValue 未移除敏感值 | AK/SK/token 应剥离 | 明文保留 | sanitize 未做敏感值脱敏 | P | 待提单 |
| 12 | P2 | D3-S5 | 复合意图未拆分命中多 service | 存储+托管应命中多 service | 返回 Run hcloud --help | tools.mjs:1984 serviceCatalog | P | 待提单 |
| 13 | P2 | D9-8 | inputSchema 未标注 $schema 版本 | 版本统一且明确 | $schema 取值集合为空 | tools.mjs TOOL_DEFINITIONS | P | 待提单 |
| 14 | P2 | D9-9 | 取消能力未在 capabilities 声明 | capabilities 应含 cancellation | capabilities={tools:{}} | mcp-server.mjs initialize | P | 待提单 |

> 说明：P/G/I = Product/Governance/Infra 归类，本轮均为 P（产品缺陷）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属用例，本机 OS=Linux | 已由展开级 EXP-NR3-10 代表覆盖（PASS），无需改用例 |
| D3-S6 | 设计级 | P2 | BLOCKED | 补环境 | FunctionGraph 路由命中但 CreateFunction 缺有效 function_name（probe 参数不足） | 补 FunctionGraph 函数包+定时触发器完整参数后复测 |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | RDS 最小实例创建需 VPC/子网/安全组前置 + db.password 参数 + 配额；RDS 只读已验证可达 | 补完整 VPC/子网/安全组前置 + RDS 建库参数后复测 |

> 无「改用例」必填项（D1-39 为 OS 专属归属，展开级已覆盖；D3-S6/S7 为补环境项）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（show_profile_redacted → accessKeyId/secretAccessKey/securityToken 均 `<redacted>`；tools/call 无 AK/SK 明文）
- [x] 写操作误判 read-only：`0`（DeleteServer/DeleteSecurityGroup 均 deny=write）
- [x] 红线（I 类）违规：`无`（1 次真云删除静默失败，已识别根因并当场人工归零）
- [ ] 脱敏复核：D4-6 / D4-26 发现 2 处脱敏缺口（--admin_pass 空格形态 + findings.evidence 明文），已列为缺陷

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14 真机） | 是（tctest-hermes-20261014-bgq3yh） | 已删 | ListVpcs 不含 ✓ |
| VPC（D3-S2 真机） | 是（opencode-s2） | 已删 | 归零 ✓ |
| VPC+子网（D3-C1 真机） | 是（08a23322 + 9453f542） | 已手动删除 | ListVpcs/ListSubnets 归零 ✓ |
| EIP（D3-C7 真机） | 是 | 已释放 | ListPublicips 不含 ✓ |
| OBS 桶（D3-C2/D3-C13 真机） | 是 | 已删 | Succeed count:1 ✓ |
| 沙箱会话（D3-C3/D3-C6/D3-S3） | 是 | 已 close | 会话关闭 ✓ |

> 真云只删本次创建资源；D3-C1 触发 run_approved_command 静默失败（DeleteSubnet 缺 vpc_id）导致 VPC/子网一度残留，已当场手动删除并验证归零——该问题已列为 FINDING #2。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（取消能力未声明，capabilities 仅 {tools:{}}）——建议明确是否需补 cancellation 能力。
- 本轮未覆盖（说明范围）：真实 Agent 会话行为评测（D10-1/2/5/9 需 dsh/CDP 会话自动化，本机 Hermes 客户端未装 dsh，非商品协议/路由缺陷）。
- 建议：①修复 run_approved_command 未校验底层 exitCode（安全红线关联）；②补齐中文 serviceCatalog（services_cn.json 当前为空，影响中文路由召回）。