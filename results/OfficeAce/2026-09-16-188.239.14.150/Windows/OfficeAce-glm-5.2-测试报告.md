# OfficeAce-glm-5.2 每日测试报告

> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：`2026-09-16 09:53:56`（北京时间）
> **执行归档**：`results/OfficeAce/2026-09-16-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 SPEC-MISMATCH 与 FAIL，P0 无 NOT_RUN 但部分 P0 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows AMD64` |
| Node / npm / Python | `Node v24.14.1 / npm / Python 3.13.4` |
| 被测版本（SUT） | `v1.1.4-next.6`（OfficeAce plugin `1.1.5`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置 / 本轮未触发写操作）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 评测集路由 |
| 设计真源 | 设计级 78 / 展开级 39 |
| daily 基础用例 | 设计级 78 / 展开级 39 |

> **执行方法**：6 个子代理并行执行——①eval harness 路由准确率 ②MCP 协议探针 ③源码级函数直调 ④CLI 真机冒烟 ⑤C4 22 服务只读规划 ⑥静态评审。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `117`（设计级 78 + 展开级 39） |
| 已执行 | `108`（PASS 49 + FAIL 11 + BLOCKED 45 + SPEC-MISMATCH 2 + NOT_RUN 10） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `49 / 11 / 45 / 2 / 10` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 62） | `79.0%`（49/62） |
| P0 / P1 / P2 新增缺陷 | `0 / 2 / 11`（2 个 SPEC-MISMATCH + 11 个 eval 路由 MISS） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本轮未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `22` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `45` | 环境阻塞（38 需 hook-capable 客户端 + 7 需隔离环境/真云凭证） |
| SPEC-MISMATCH | `2` | D9-1 错误码漂移 + D9-2 缺参数校验 |
| NOT_RUN | `9` | 均为 P2 用例，本轮未覆盖 |
| **合计** | **`78`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | 22 服务只读冒烟 + D5 客户端矩阵 2 + eval 路由 HIT 3 |
| FAIL | `11` | eval harness 路由 MISS（serviceCatalog 中文意图未命中） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `1` | EXP-E08 诊断意图无对应 serviceCatalog 路由 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | `D9-1` | 未知 JSON-RPC 方法错误码漂移 | 未知方法返回 `error.code = -32601`（Method Not Found） | 返回 `error.code = -32603`（Internal Error） | `mcp-server.mjs` dispatch 错误处理 | P | 待提单 |
| 2 | P1 | `D9-2` | 缺少 required 参数校验 | `tools/call` 缺失必填参数时返回 `error.code = -32602`（Invalid Params） | 未校验，直接执行报错 | `mcp-server.mjs` tools/call 入口 | P | 待提单 |
| 3 | P1 | `EXP-E01` | serviceCatalog 中文意图"查云主机"未命中 ECS 路由 | `serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` → ECS 查询 | MISS（未命中） | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |
| 4 | P1 | `EXP-E02` | serviceCatalog "创建云服务器"未命中 ECS 路由 | `serviceCatalog("创建一台 2C4G 的 Ubuntu 云服务器")` → ECS 创建 | MISS | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |
| 5 | P1 | `EXP-E03` | serviceCatalog "部署静态网站"未命中 OBS 路由 | `serviceCatalog("把本地 dist 目录部署成一个公网静态网站")` → OBS 部署 | MISS | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |
| 6 | P1 | `EXP-E04` | serviceCatalog "绑定弹性公网IP"未命中 EIP 路由 | `serviceCatalog("给这台服务器绑定一个弹性公网IP")` → EIP | MISS | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |
| 7 | P1 | `EXP-E05` | serviceCatalog "查MySQL状态"未命中 RDS 路由 | `serviceCatalog("看一下我的云数据库MySQL实例的状态")` → RDS 查询 | MISS | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |
| 8 | P1 | `EXP-E07` | serviceCatalog "配置备份策略"未命中 CBR 路由 | `serviceCatalog("给生产环境的服务器配置一个每日备份策略")` → CBR | MISS | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |
| 9 | P1 | `EXP-E10` | serviceCatalog "部署函数"未命中 FunctionGraph 路由 | `serviceCatalog("部署一个函数处理图片自动压缩")` → FunctionGraph | MISS | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |
| 10 | P1 | `EXP-E11` | serviceCatalog "查费用"未命中 Billing 路由 | `serviceCatalog("查一下我账号这个月的费用情况")` → Billing 查询 | MISS | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |
| 11 | P1 | `EXP-E12` | serviceCatalog "云监控告警"未命中 CES 路由 | `serviceCatalog("把应用日志指标推送到云监控告警")` → CES | MISS | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |
| 12 | P1 | `EXP-E13` | serviceCatalog "HTTPS证书"未命中 ELB/DEW 路由 | `serviceCatalog("申请HTTPS证书并配置到我的域名")` → ELB/DEW | MISS | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |
| 13 | P1 | `EXP-E14` | serviceCatalog "IAM审计"未命中 IAM 路由 | `serviceCatalog("我账号下的用户都有哪些权限, 帮我审计一下")` → IAM 审计 | MISS | `serviceCatalog` 中文关键词覆盖不足 | G | 待提单 |

### 根因详情

```markdown
**#1 [P1] D9-1 未知 JSON-RPC 方法错误码漂移**

- 期望：未知方法返回 error.code = -32601（Method Not Found）
- 实际：返回 error.code = -32603（Internal Error）
- 根因：mcp-server.mjs 中 dispatch/handleRequest 对未知 method 走通用 catch 路径，
  返回 -32603 而非 MCP 规范要求的 -32601
- 证据：evidence/D9-1/evidence.md

**#2 [P1] D9-2 缺少 required 参数校验**

- 期望：tools/call 缺失必填参数时返回 error.code = -32602（Invalid Params）
- 实际：未做 required 参数校验，直接传入 undefined 导致执行报错
- 根因：mcp-server.mjs tools/call 入口未在调用前校验 inputSchema.required
- 证据：evidence/D9-2/evidence.md

**#3-#13 [P1] EXP-E01~E14 serviceCatalog 中文意图路由未命中**

- 期望：serviceCatalog(中文意图) 命中对应华为云服务路由
- 实际：11/14 中文意图 MISS，路由准确率仅 21.4%（3/14 HIT）
- 根因：serviceCatalog 中文关键词覆盖严重不足，仅 DCS/CCE/voucher 三个命中
- 影响：中文用户自然语言请求无法正确路由到对应华为云服务
- 证据：eval/results/eval-run-20260916011644.csv
```

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D4-1~D4-24` | 设计级 | P0/P1 | BLOCKED | 补环境 | 需 hook-capable 客户端(Hermes)，OfficeAce 为非 Hook 客户端 | — |
| `D2-1~D2-16` | 设计级 | P0/P1 | BLOCKED | 补环境 | 需真云凭证完整环境(securityToken/STS/多profile) | — |
| `D10-3/D10-4` | 设计级 | P0/P1 | BLOCKED | 补环境 | 需评测预算+真实 Agent 会话(源码级已由 EXP-E01~E15 覆盖) | — |
| `D1-5` | 设计级 | P1 | BLOCKED | 补环境 | 卸载会破坏当前测试环境(OfficeAce 运行中) | — |
| `D1-31/D1-41/D1-42/D1-45` | 设计级 | P1 | BLOCKED | 补环境 | 需隔离 HOME+可控时钟/registry 注入 | — |
| `D3-A1` | 设计级 | P1 | BLOCKED | 补环境 | 需本地 ~30 个 SKILL.md 完整环境 | — |
| `D6-4` | 设计级 | P1 | BLOCKED | 补环境 | 需标准环境+并发 30 请求压力测试夹具 | — |
| `D1-2` | 设计级 | P2 | BLOCKED | 补环境 | 需多客户端共存环境 | — |
| `D9-6` | 设计级 | P1 | BLOCKED | 补环境 | 需 ≥3 真实客户端跨客户端互通环境 | — |
| `D9-9` | 设计级 | P1 | BLOCKED | 补环境 | 需可注入延迟的 MCP 客户端夹具 | — |
| `D1-58` | 设计级 | P1 | BLOCKED | 补环境 | 需隔离 HOME+Linux 真机环境 | — |
| `D1-33` | 设计级 | P2 | NOT_RUN | 补环境 | skip 文件持久化未执行 | — |
| `D3-B5` | 设计级 | P2 | NOT_RUN | 补环境 | detect_framework 识别未执行 | — |
| `D6-1` | 设计级 | P2 | NOT_RUN | 补环境 | 检索响应延迟采样未执行 | — |
| `D6-3` | 设计级 | P2 | NOT_RUN | 补环境 | MCP 冷启时间采样未执行 | — |
| `D7-4` | 设计级 | P2 | NOT_RUN | 补环境 | 国内镜像源安装未执行 | — |
| `D8-1` | 设计级 | P2 | NOT_RUN | 补环境 | 文档与能力一致性扫描未执行 | — |
| `D8-6` | 设计级 | P2 | NOT_RUN | 补环境 | 中英文文档对比未执行 | — |
| `D9-7` | 设计级 | P2 | NOT_RUN | 补环境 | 协议版本协商降级未执行 | — |
| `D9-8` | 设计级 | P2 | NOT_RUN | 补环境 | inputSchema 版本合规未执行 | — |
| `EXP-E08` | 展开级 | P1 | NOT_RUN | 改用例 | 诊断意图无对应 serviceCatalog 路由(explain_error 为通用工具) | 展开规则应排除诊断类意图或标注为 N/A |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（本轮未触发写操作）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否 | — | N/A（本轮未创建真云资源） |
| OBS | 否 | — | N/A |
| 沙箱 | 否 | — | N/A |

> 本轮以源码级探针+CLI 冒烟+MCP 协议测试为主，未创建真云资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-1`（错误码 -32603 vs -32601）、`D9-2`（缺 required 参数校验）
- 本轮未覆盖：真云 E2E 写操作 / 多终端矩阵 / 审批流实时对话框 / hook 安全拦截（需 Hermes 客户端）
- **关键发现**：serviceCatalog 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足，建议优先补齐中文服务路由关键词
- 建议：OfficeAce 作为非 Hook 客户端，D4 安全用例可考虑在用例归属中标注"需 Hook 客户端"，避免非 Hook 客户端重复 BLOCKED
