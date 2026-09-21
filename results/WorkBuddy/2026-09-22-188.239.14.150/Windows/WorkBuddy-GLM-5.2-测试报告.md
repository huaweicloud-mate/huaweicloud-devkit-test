# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-22 05:30:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-22-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（P0 全通过；EXP-E 路由评测 12/15 FAIL，为已知基线缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + GLM-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | `v1.1.6-next.0`（npm @next，gitHead `faaefb8f`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12` / doctor 已配置 |
| 真云凭证 | `cn-north-4（AKSK，已使用）` |
| 测试类型 | 源码级探针 / MCP 工具调用 / 真机 CLI / 真云 E2E |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：MCP 工具直调（hook_check_command/plan_cli_command/run_readonly_command 等）+ Node.js 探针脚本直调源码函数 + hcloud CLI 真机执行 + 真云 VPC 建删归零。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 139（设计级 100 + 展开级 39） |
| 已执行 | 139 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `127 / 12 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 139） | `91.4%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（VPC 建删验证 count=0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 100 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | EXP-E01~E15 serviceCatalog 中文意图路由 MISS（12/15） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | EXP-E01~E15 | serviceCatalog 中文意图路由大面积 MISS | 中文意图命中对应服务（云主机→ECS, 数据库→RDS 等） | 12/15 MISS，返回 "Run hcloud --help" | `tools.mjs:1786-1890` routeMap 缺中文关键词 | P | 待提单 |

### 根因详情

```markdown
**#1 [P1] EXP-E01~E15 serviceCatalog 中文意图路由大面积 MISS（12/15 未命中）**

- 期望：serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机") → recommendedServices 含 "ECS"
- 实际：返回 recommendedServices = ["Run hcloud --help to list available services."]
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1786-1890`
  `serviceCatalog()` 的 `routeMap` 关键词列表几乎全是英文，缺少中文服务名关键词。
  - ECS 路由缺 '云主机','服务器'
  - RDS 路由缺 '数据库'
  - CBR 路由缺 '备份'
  - FunctionGraph 路由缺 '函数'
  - BSS 路由缺 '费用','账单'
  - CES 路由缺 '监控','告警'
  - IAM 路由缺 '权限','审计'
  - ELB 路由完全缺失
  - EIP 路由缺 '弹性公网IP'
  - OBS '静态网站' 被 Sandbox 路由的 '网站','静态' 抢占

- 证据：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log`
- 基线：21.4% 准确率（3 HIT, 11 MISS, 1 N/A）
```

---

## 五、未执行用例与原因

无未执行用例。全部 139 条用例已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（show_profile_redacted 返回 `<redacted>`，hook findings.evidence 已脱敏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC (devkit-test-wb-vpc) | 是 (id=5054a56f) | 已删 | ListVpcs count=0 ✓ |
| ECS | 否（count=0，未创建） | — | count=0 ✓ |
| RDS | 否（未创建） | — | — |
| CCE | 否（未创建） | — | — |
| WAF | 否（未创建） | — | — |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留=0。

---

## 八、遗留与建议

- **待提单缺陷**：#1 serviceCatalog 中文关键词缺失（P1，已写入 FINDINGS.md，待 file_issue.py 提单）
- **已知基线**：EXP-E 路由评测 21.4% 准确率为已知基线，非本次回归新发现。根因已定位到 `tools.mjs:1786-1890` routeMap 缺中文关键词。
- **建议**：在 routeMap 各路由条目中补充中文服务名关键词（云主机/服务器/数据库/备份/函数/费用/监控/证书/权限/弹性公网IP 等），并新增 ELB 路由条目。
- **环境修复记录**：credentials.json trailing space 导致 APIGW.0301，已修复（strip + domain_id/project_id 配置）。
