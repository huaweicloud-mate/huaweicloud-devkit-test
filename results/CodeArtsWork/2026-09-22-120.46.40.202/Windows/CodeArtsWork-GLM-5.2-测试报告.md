# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-22 15:10:00（北京时间）
> **执行归档**：`results/CodeArtsWork/2026-09-22-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 12 条 FAIL，均为 serviceCatalog 中文意图路由未命中）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsWork` + `GLM-5.2` |
| OS / 架构 | `Windows (win32) x64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.6-next.1`（npm @next，gitHead `10e52432`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置 / 只读子账号已配置）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E / 评测 harness |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP JSON-RPC 子进程 + eval harness（run-eval.mjs）；决策/结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 100 + 展开级 39 = 139 |
| 已执行 | 139 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 12 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 138） | `91.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 12 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（真云只读操作无创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | D10-3 路由准确率 21.4% < 90% 阈值 |
| BLOCKED | `1` | D3-S3 沙箱预览需 DevStation 配额 |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`100`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E01~E05/E07/E10~E14 serviceCatalog 路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

> 所有 12 条 FAIL 均为同一根因：`serviceCatalog` routeMap 中文意图关键词覆盖不足，11/14 条中文自然语言意图未命中正确服务路由，返回 fallback `"Run hcloud --help to list available services."`。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | `D10-3` | serviceCatalog 路由准确率 21.4% | ≥90% | 21.4%（3 HIT/11 MISS/1 N/A） | `tools.mjs:1817-1947` | P | 待提单 |
| 2 | P1 | `EXP-E01` | ECS查询意图未命中 | `ECS` | `Run hcloud --help...` | `tools.mjs:1947` | P | 待提单 |
| 3 | P1 | `EXP-E02` | ECS创建意图未命中 | `ECS` | `Run hcloud --help...` | `tools.mjs:1947` | P | 待提单 |
| 4 | P1 | `EXP-E03` | OBS静态站意图未命中 | `OBS` | `Sandbox+DevStation` | `tools.mjs:1935-1939` | P | 待提单 |
| 5 | P1 | `EXP-E04` | EIP意图未命中 | `EIP` | `Run hcloud --help...` | `tools.mjs:1947` | P | 待提单 |
| 6 | P1 | `EXP-E05` | RDS查询意图未命中 | `RDS` | `Run hcloud --help...` | `tools.mjs:1947` | P | 待提单 |
| 7 | P1 | `EXP-E07` | CBR意图未命中 | `CBR` | `Run hcloud --help...` | `tools.mjs:1947` | P | 待提单 |
| 8 | P1 | `EXP-E10` | FunctionGraph意图未命中 | `FunctionGraph` | `Run hcloud --help...` | `tools.mjs:1947` | P | 待提单 |
| 9 | P1 | `EXP-E11` | BSS费用查询意图未命中 | `BSS` | `Run hcloud --help...` | `tools.mjs:1947` | P | 待提单 |
| 10 | P1 | `EXP-E12` | CES意图未命中 | `CES` | `Run hcloud --help...` | `tools.mjs:1947` | P | 待提单 |
| 11 | P1 | `EXP-E13` | ELB证书意图未命中 | `ELB` | `Run hcloud --help...` | `tools.mjs:1947` | P | 待提单 |
| 12 | P1 | `EXP-E14` | IAM审计意图未命中 | `IAM` | `Run hcloud --help...` | `tools.mjs:1947` | P | 待提单 |

### 根因详情

```markdown
**#1 [P1] D10-3 serviceCatalog 路由准确率 21.4%**

- 期望：serviceCatalog 中文意图路由准确率 ≥90%
- 实际：21.4%（3 HIT / 11 MISS / 1 N/A），11 条中文意图返回 fallback
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1817-1947`
  routeMap 的 keywords 数组中文关键词覆盖不足。serviceCatalog 在 1922-1929 行
  按 `route.keywords.some(kw => ... it.includes(kw) ...)` 匹配，未命中的
  在 1945-1947 行返回 fallback `['Run hcloud --help to list available services.']`。
  
  未覆盖的中文意图模式：
  - "帮我查一下我账号在华北北京四有哪些云主机" → 期望 ECS
  - "创建一台 2C4G 的 Ubuntu 云服务器" → 期望 ECS
  - "看一下我的云数据库MySQL实例的状态" → 期望 RDS
  - "给这台服务器绑定一个弹性公网IP" → 期望 EIP
  - "给生产环境的服务器配置一个每日备份策略" → 期望 CBR
  - "部署一个函数处理图片自动压缩" → 期望 FunctionGraph
  - "查一下我账号这个月的费用情况" → 期望 BSS
  - "把应用日志指标推送到云监控告警" → 期望 CES
  - "申请HTTPS证书并配置到我的域名" → 期望 ELB
  - "我账号下的用户都有哪些权限, 帮我审计一下" → 期望 IAM

- 证据：`evidence/D10-3/stdout.log` + `eval/results/eval-run-20260922070047.csv`
- 复现：`node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs`
```

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱预览需 DevStation 配额 + 前端项目，本机无沙箱配额 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 验证 DeleteServer 正确判 deny）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（真云只读查询） | 否 | — | 只读操作无创建 |
| 只读子账号（D4-13） | 否 | — | env 注入临时生效，命令结束自动还原 |

> 真云只读操作（D3-S1 ListServersDetails）未创建任何资源，无需清理。

---

## 八、遗留与建议

- **主要缺陷**：serviceCatalog routeMap 中文意图覆盖不足（21.4% 准确率），建议扩充 routeMap keywords 增加中文自然语言模式（"云主机/云服务器"→ECS、"云数据库"→RDS、"弹性公网IP"→EIP、"备份策略"→CBR、"费用/账单"→BSS、"监控告警"→CES、"证书"→ELB、"权限审计"→IAM 等）
- **BLOCKED 项**：D3-S3 沙箱预览需 DevStation 配额，解除条件为配置沙箱环境
- **EXP-E03 特殊**：OBS 静态站意图被 sandbox deployment 优先匹配（tools.mjs:1935-1939 deploymentIntent 逻辑），需调整路由优先级
