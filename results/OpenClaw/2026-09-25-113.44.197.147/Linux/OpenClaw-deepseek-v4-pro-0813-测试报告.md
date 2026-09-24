# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-25 06:00（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-25-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有历史同源 FAIL 缺陷，P0 5 项，无新增缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64 (Ubuntu 6.8.0-106-generic)` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.7`（npm latest，gitHead `7456d05`，merge PR #813） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.x / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AK/SK 管理员 + test001 只读子账号已预置）` |
| daily 基础用例 | 设计级 102 / 展开级 39（建包预筛剔除 27 条非本客户端/OS 展开级） |

> **执行方法**：源码级探针（.mjs/.py）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（safety-policy / risk-rule-engine / hcloud-cli / credentials / mcp-protocol / tools.callTool）；CLI 真机执行（install/doctor/status/help/proxy）；真云 E2E 建删资源归零（VPC/Subnet/RDS/SecurityGroup/OBS/FunctionGraph）；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `112 / 25 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `81.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（15 项均为历史同源，查重命中不重复提单） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（残留 0 项）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `85` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | Windows 专属用例（OS 列标注专属） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期（EXP-E01~E14 中文路由 MISS，源于 D10-3） |
| BLOCKED | `1` | EXP-E08 真实 Agent 会话诊断（缺会话级 harness） |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 本轮未覆盖 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

> **铁律**：缺陷必须真实执行后填写。15 项 FAIL/SPEC 根因经源码定位（文件:行号）确认，本轮相对昨日 SUT v1.1.7-next.1 → v1.1.7 的安全/协议/serviceCatalog 路由层代码未变，均为**历史同源**缺陷（多客户端多轮复现）。查重命中上游已开单，不重复提单，关联清单见 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D9-12` | D9协议 | initialize 握手：未 initialize 先 tools/list 未返回 -32600 | mcp-protocol.mjs:30-59 | 历史同源(D9-4 #699) |
| 2 | P0 | `D9-13` | D9协议 | tools/call 凭证不泄露与权限校验 | — | 全 PASS |
| 3 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截（env\|grep HW_SECRET_KEY 漏网） | safety-policy.mjs:398-405 | 历史同源(#650) |
| 4 | P0 | `D4-16` | D4安全 | 命令包裹穿透（sh -c 未解包） | safety-policy.mjs:384-401 | 历史同源(#650) |
| 5 | P0 | `D4-21/D4-7` | D4安全 | hook_check_artifacts broad IAM 未检出 | cloud-risk-rules.json:179-201 | 历史同源(#651/#652) |
| 6 | P0 | `D4-23` | D4安全 | 全局规则 huawei-agent-rules.mdc 注入失效 | package.json:8-17 | 历史同源(#651/#673…) |
| 7 | P1 | `D4-6` | D4安全 | adminPass 空格形式未脱敏 | safety-policy.mjs:42-46 | 历史同源(#712) |
| 8 | P2 | `D4-25` | D4安全 | Python hook 写命令遥测误分类 | huaweicloud-safety.py:46 | 历史同源(#752) |
| 9 | P1 | `D4-27` | D4安全 | 双路径脱敏（裸 token=/小写 ak= 未脱敏） | safety-policy.mjs:34-46 | 历史同源(#726) |
| 10 | P1 | `D9-2` | D9协议 | JSON-RPC tools/list 传 string params 未返 -32602 | mcp-protocol.mjs:57-59 | 历史同源(#643/#704) |
| 11 | P1 | `D9-4` | D9协议 | initialize 前 tools/list 未按规范报错 | mcp-protocol.mjs:30-59 | 历史同源(#699) |
| 12 | P2 | `D9-7` | D9协议 | protocolVersion 不校验不降级 | mcp-protocol.mjs:46 | 历史同源(#702) |
| 13 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未暴露（SPEC） | mcp-protocol.mjs:47-49 | 历史同源(#698) |
| 14 | P1 | `D10-3` | D10评测 | 中文意图路由准确率 21.4%（EXP-E01~E15） | tools.mjs:1816-1946 | 历史同源(#705/#706) |
| 15 | P2 | `D3-S5` | D3功能 | 复合中文意图全角逗号不拆分 | tools.mjs:1923 | 历史同源(#762/#788) |

### 根因详情

> 15 项 FAIL/SPEC 的完整「期望 / 实际 / 根因（文件:行号）/ 证据」详见 `FINDINGS.md`（逐条含源码行号 + 复现命令 + evidencePath）。本轮相对昨日 SUT v1.1.7-next.1 → v1.1.7，安全/协议/serviceCatalog 路由层代码未变，缺陷根因不变，均为历史同源（查重命中，不重复提单，详见 `HISTORY_LINKS.md`）。
>
> 本轮新增 2 个 P0 用例 D9-12 / D9-13：D9-12 实测暴露「未 initialize 先 tools/list 未返回 -32600」历史同源缺陷（与 D9-4 同根）；D9-13 全 PASS（35/35 断言，含运行时凭证注入/清理、审批令牌不可重放、tools/call 无明文凭证、候选占位识别、持久化 0600 权限）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」：Windows 升级检测链 EINVAL/npm.cmd 专属）；Linux 无 npm.cmd/EINVAL 语义，本 OS 结构性不适用。Linux 侧检测链已由源码级 queryDistTagsSync 探针佐证（evidence/d1-upgrade/probe-d1-39-linux.stdout.log dist-tags 含 latest+next） | — |

### BLOCKED

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | 真机沙箱 E2E 核心步骤 connect/check_user/upload_project/deploy_nginx 均 PASS，仅 expose 步骤失败：沙箱内 devbridge 0.1.13-release 硬编码网关 cn-north-4-bridge.myhuaweicloud.com 已迁移失效（Connection failed/Connection lost），且未预置 0.2.x API Key，无法升级暴露公网 URL。非 hdk 源码缺陷（hdk 已支持 api_key 注入路径 + 运行时能力探测）。解除条件：预置 DevBridge API Key 或沙箱镜像更新 devbridge 0.2.x | — |
| `EXP-E08` | 展开级 | P1 | BLOCKED | 补环境 | 真实 Agent 会话诊断意图层（"ECS启动失败帮我分析原因"）需真实 LLM Agent 判断是否路由 huaweicloud_explain_error；eval/harness/run-eval.mjs 的 serviceCatalog 确定性路由层无法代理该诊断意图（实测返回 N/A）。缺可交互真实 Agent 会话级 harness（仅 DSH/装了 dsh 客户端可用）。解除条件：接入可交互真实 Agent 客户端会话自动化 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D9-13 探针实测 tools/call 返回无 AK/SK/token 明文）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志；D9-13 探针在隔离 temp HOME 下跑，用完 rm 清理

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC / Subnet（D3-S2/S7） | 是 | 已删 | tctest- 前缀剩余 0 |
| RDS MySQL（D3-S7） | 是 | 已删 | ListInstances 0 |
| SecurityGroup（D3-C4/D4-14） | 是 | 已删 | tctest SGs 0 |
| OBS 桶（D3-C13） | 是 | 已删 | tctest 桶 0 |
| FunctionGraph 函数（D3-S6） | 是 | 已删 | tctest functions 0 |
| 沙箱（D3-S3） | 是 | close_session 已关 | expose 步骤 BLOCKED（devbridge 网关失效） |

> 真云只删本次创建资源；删除前全量盘点 + tctest- 前缀白名单，禁删既有/他人资源。残留即 FAIL —— 本轮归零验证全部通过。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` capabilities.cancellation 未声明（历史 #698，MCP 取消能力契约漂移）。
- 本轮 BLOCKED：`D3-S3` 沙箱 expose（沙箱镜像 devbridge 0.1.13 网关已迁移 + 无 0.2.x API Key，非 hdk 源码缺陷）；`EXP-E08` 真实 Agent 会话诊断意图（非 DSH 客户端缺 CDP 会话级 harness）。均已回填 blockedReason。
- 本轮 NOT_RUN：`D1-39` Windows 专属用例（OS 列标注专属，Linux 结构性不适用）。
- 建议：15 项 FAIL 均为历史同源、多客户端多轮复现，建议维护方优先收敛安全边界（D4-2/16/21/23）、serviceCatalog 中文关键词覆盖（D10-3）、MCP 协议生命周期门控（D9-4/12）三项高价值缺陷簇。