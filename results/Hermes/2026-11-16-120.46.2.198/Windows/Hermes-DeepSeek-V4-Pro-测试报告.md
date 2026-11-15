# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-11-16（北京时间）
> **执行归档**：`results/Hermes/2026-11-16-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（3 FAIL / 2 SPEC-MISMATCH / 8 BLOCKED；缺陷与历史高度重合，走历史查重）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Windows 10 |
| Node / npm / Python | Node v26.7.0 / npm 11.19.0 / Python 3.14 |
| 被测版本（SUT） | `v1.1.14-next.5`（npm @next，TypeScript 编译产物 src/*.mjs） |
| 工具全集 | `47`（TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI），真云凭据就绪（cn-north-4，admin + 只读子账号 test001） |
| 真云凭证 | 已具备，真机执行（VPC/子网建删归零 + OBS 建删归零 + 只读权限通过率实测） |
| 测试类型 | 源码级探针（file:/// 直调 src/*.mjs）/ 真机 CLI / MCP 协议 / 真云 E2E / eval 路由 harness |
| 执行包 | 设计级 107 / 展开级 43（已按 Hermes+Windows 预筛）+ 使命 1 |

> **执行方法**：npm 包 `plugins/huaweicloud-core/src/*.mjs` 为运行产物，探针经 `file:///` URL 直调导出函数；真云经 `hcloud` CLI 真机建删归零；版本检测/审批/安全走 update-check·hcloud-cli·safety-policy·risk-rule-engine 直调；路由评测逐条 `tools.callTool('huaweicloud_service_catalog', {intent})` 真实路由。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 150（设计级 107 + 展开级 43）+ 使命 9（命中设计级安全子集，同 ID） |
| 已执行 | 150 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 137 / 3 / 8 / 2 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 96.5% |
| P0 / P1 / P2 缺陷 | 0 / 2 / 1（另 2 条 SPEC-MISMATCH 含 D10-4 规则漂移） |
| 红线（I 类）违规 | 0 |
| 资源释放 | VPC/子网建删归零、OBS 桶签名 DELETE 归零（204）、ECS 本轮未创建 |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 95 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D3-C2 / D3-C13（OBS 静态站 AWS4 签名 403 InvalidAccessKeyId） |
| BLOCKED | 8 | 沙箱 E2E / 服务创建回归 / FG 定时 / 跨服务交付 / 跨客户端互通 |
| SPEC-MISMATCH | 2 | D8-9（sanitizeValue 未脱敏）/ D10-4（规则数 19 vs 16） |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 42 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（「查云主机」路由 MISS） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

> **覆盖率门禁**：verify_coverage 通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%）。
> **PASS 门禁**：verify_no_fake_pass 通过（137 PASS 均 evidencePath 存在 + evidence 真实）。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 分类 |
|---|---|---|---|---|---|
| 1 | P1 | EXP-E01/D10-3 | 「查云主机」意图路由 MISS（准确率 92.9%） | tools.mjs:2368-2373 serviceCatalog 缺「云主机」别名 | 产品缺陷 |
| 2 | P1 | D3-C2/D3-C13 | OBS website 配置 403 InvalidAccessKeyId | tools.mjs:3204 signedHeaders 未纳入 x-amz-security-token + :3241 添加该 header | 产品缺陷 |
| 3 | P0 | D10-4 | 规则数漂移 9d+10w=19 vs 文档 16 | cloud-risk-rules.json 规则演进未同步文档 | SPEC-MISMATCH |
| 4 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK | telemetry.mjs:190 仅去空白/截断 | SPEC-MISMATCH |

> 详细根因见 `FINDINGS.md`。本轮 4 条缺陷与 2026-11-11~11-15 历史缺陷高度重合（服务路由「云主机」MISS、OBS AWS4 签名 STS 头、sanitizeValue 脱敏、规则数漂移延续），历史查重决定是否重复提单。

---

## 五、未执行用例与原因（BLOCKED 8 条逐条）

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 + 解除条件 |
|---|---|---|---|---|
| D3-C3 | 设计级 | P1 | 【补环境】 | 沙箱部署 E2E：需沙箱服务可连 + upload_project 完整链路 |
| D3-C4 | 设计级 | P1 | 【补环境】 | 服务创建类回归：VPC/子网真机建删归零 + 22 服务只读冒烟已 PASS；逐服务计费资源建删待额度 |
| D3-C6 | 设计级 | P1 | 【补环境】 | 沙箱 7 隐式工具具名冒烟：前置 check_user 实测 HDKIT_UPSTREAM_ERROR（实名状态查询失败），需沙箱上游可连 |
| D3-C14 | 设计级 | P1 | 【补环境】 | 沙箱 HDKit 服务参数与 hwlink 凭证：需 sandbox 服务 |
| D3-S3 | 设计级 | P1 | 【补环境】 | 沙箱预览 URL：upload_project+deploy_nginx+expose_tunnel 依赖沙箱 |
| D3-S6 | 设计级 | P2 | 【补环境】 | FunctionGraph 定时任务：需真机建 FG 函数+触发器 |
| D3-S7 | 设计级 | P1 | 【补环境】 | 跨服务交付(Web+RDS)：需 RDS 实例 + 沙箱部署 Web 应用 |
| D9-6 | 设计级 | P1 | 【补环境】 | 跨客户端互通：本机 Hermes 单客户端，无第二客户端会话跑互通夹具 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证（AK/SK 均 redact）
- [x] 真云资源归零：VPC/子网二次验证残留 0（testbot5-hermes-e2e-*），OBS 空桶签名 DELETE 归零（204）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（testbot5-hermes-e2e-*） | 是 | 已删 | 二次 ListVpcs 残留 0 |
| 子网（同 VPC） | 是 | 已删 | ListSubnets 残留 0 |
| ECS 实例 | 否（本轮未创建） | — | 账户内 2 台均为其他机器人(testbot3)残留，非本次创建 |
| OBS 桶（testbot5-hermes-obs-*） | 是（1 桶） | 已删（签名 DELETE 204） | 归零 |

> 注：共享账户(cn-north-4)存在其他机器人残留（testbot3-hermes-ecs-* ECS、testbot3-hermes-e2e-* VPC），非本客户端创建，按红线「只删本次创建」不处理，仅在报告记录。

---

## 八、遗留与建议

- 版本 CLI 1.1.14-next.5 与 Hermes 运行插件副本 2.0.0 不一致（`npx huaweicloud-devkit version` 显示 `Hermes: 2.0.0`），系本轮未跑 `prepare_env.py --update --next` 的 `sync_agent_plugin` 同步步骤所致；探针直接 import npm 全局包(1.1.14-next.5)，结果不受影响，建议后续跑 prepare_env 同步插件副本。
- OBS：obsSignedRequest(tools.mjs:3204/3241) 的 STS 头未纳入 SignedHeaders 缺陷延续（本轮 403 InvalidAccessKeyId，较上轮 400 InvalidArgument 表述变化、同根因），建议修复 + 补齐空桶删除能力（hcloud obs 无 rb）。
- serviceCatalog(tools.mjs:2368) 补充「云主机」等中文同义别名可收敛 EXP-E01 MISS。
- sanitizeValue(telemetry.mjs:190) 与 D10-4 规则快照属契约漂移，待维护者裁决实现或改用例。