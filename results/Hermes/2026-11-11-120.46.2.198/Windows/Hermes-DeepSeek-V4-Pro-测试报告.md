# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-11-11 06:05（北京时间）
> **执行归档**：`results/Hermes/2026-11-11-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 P1 真云 OBS 静态站 400、沙箱 upload_project Windows 失败、2 条评测路由 MISS 等产品缺陷，P0 仅 1 例 SPEC-MISMATCH 规则数漂移）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Windows（IP 120.46.2.198） |
| Node / npm / Python | Node v26.7.0 / npm 11.19.0 / Python 3.14.7 |
| 被测版本（SUT） | `1.1.14-next.2`（npm @next，gitHead `5c9478d`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor/status 确认已配置） |
| 真云凭证 | cn-north-4（管理员 AKSK + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（ECS/OBS/沙箱）/ 评测路由 |
| daily 用例 | 设计级 107 / 展开级 43 / 追踪表 216 / 使命 mission-001 9 |

> **执行方法**：探针脚本直调 npm 全局包 `plugins/huaweicloud-core/src/*` 编译产物导出函数（v2 TypeScript 化后，探针走 npm 包 .mjs）；MCP 协议 spawn 真实 mcp-server 走 JSON-RPC；真云 E2E 经 plan→approve→run_approved 审批流最低配置建删归零。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 150（设计级 107 + 展开级 43） |
| 已执行 | 150 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 142 / 6 / 0 / 2 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 94.7% |
| P0 / P1 / P2 缺陷 | 0 / 6 / 1（另 SPEC-MISMATCH 2：D10-4 P0 + D8-9 P2） |
| 红线（I 类）违规 | 0（真云资源测后归零，残留已二次清理） |
| 资源释放 | 全部归零（ECS/VPC/子网/OBS/沙箱均确认 0 残留，见 §七） |

---

## 三、状态汇总

### 3.1 设计级（107 条）

| 状态 | 数量 |
|---|---|
| PASS | 101 |
| FAIL | 4（D3-C1/C2/C3/S3） |
| SPEC-MISMATCH | 2（D10-4、D8-9） |
| BLOCKED / NOT_RUN | 0 / 0 |
| **合计** | **107** |

### 3.2 展开级（43 条）

| 状态 | 数量 |
|---|---|
| PASS | 41 |
| FAIL | 2（EXP-E01、EXP-E08） |
| SPEC-MISMATCH | 0 |
| BLOCKED / NOT_RUN | 0 / 0 |
| **合计** | **43** |

---

## 四、缺陷清单（详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因 | 分类 |
|---|---|---|---|---|---|
| 1 | P1 | D3-C1 | ECS 删除归零验证失败（异步删除超时） | realcloud_e2e.mjs 轮询窗口 150s < ECS 异步删除耗时 | 测试侧 |
| 2 | P1 | D3-C2 | OBS 静态站 set/get HTTP 400 | AWS4 签名带 x-amz-security-token 未纳入 SignedHeaders | 产品缺陷 |
| 3 | P1 | D3-C3/D3-S3 | 沙箱 upload_project tar 反斜杠路径失败 | Windows tar -czf 路径未转义 | 产品缺陷 |
| 4 | P1 | EXP-E01 | 「云主机查询」路由 MISS | serviceCatalog 未映射「云主机」→ECS | 产品缺陷 |
| 5 | P1 | EXP-E08 | 「ECS 故障诊断」路由 N/A | serviceCatalog 未映射诊断→explain_error | 产品缺陷 |
| 6 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK | telemetry.mjs 仅折叠空白 | SPEC-MISMATCH |
| 7 | P0 | D10-4 | 规则数漂移（文档 16 vs 实际 19） | cloud-risk-rules.json warn 7→10 | SPEC-MISMATCH |

---

## 五、未执行用例与原因

无。本轮 150 条 daily 用例全部执行，NOT_RUN=0、BLOCKED=0；使命 mission-001 9 条（D4-1/2/4/5/7/15/16/25/27）与设计级同 ID 复用证据已同步回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0（读凭证文件被 hook 拦截，符合 D4-1/D4-2 预期）
- [x] 写操作误判 read-only：0（D4-5 实测 write=write）
- [x] 红线（I 类）违规：无
- [x] 真云只删本次创建资源：ECS/VPC/子网/OBS/沙箱均归零验证

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（c6.large.2, testbot3-hermes-ecs-*） | 是 | 已删（手动二次 DeleteServers） | present=false |
| VPC + 子网（testbot3-hermes-e2e-*） | 是 | 已删（DeleteSubnet→DeleteVpc） | present=false |
| OBS 桶（testbot3-hermes-obs-*） | 是 | 已删 | 无残留 |
| 沙箱会话 | 是 | close_session | ok |

---

## 八、遗留与建议

- 待裁决 SPEC：D10-4（规则数 16→19 文档快照）、D8-9（sanitizeValue 脱敏契约）
- 本轮未覆盖（说明范围）：D3-S7 全量 RDS 建删（>10min 按小时计费，本轮仅规划层验证，沙箱 Web 部署已 D3-C3 实测）
- 建议：OBS website AWS4 签名 STS 头问题、沙箱 tar Windows 路径问题影响面大，建议优先修复；serviceCatalog 补齐「云主机/诊断」中文意图别名