# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-07 06:15（北京时间）
> **执行归档**：`results/Hermes/2026-11-07-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit @1.1.14-next.0（npm `next`，gitHead `ac955889`）
> **结论**：**PARTIAL**（15 项产品缺陷 + 2 项非产品 + 2 项 BLOCKED，含 P0 安全缺口，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Windows（Windows Server x86_64） |
| Node / npm / Python | Node v26.7.0 / npm 11 / Python 3.14 |
| 被测版本（SUT） | `1.1.14-next.0`（npm `next`，gitHead `ac955889`） |
| 工具全集 | `47`（`tools.mjs` TOOL_DEFINITIONS；较 1.1.13 新增 `huaweicloud_install_hcloud`） |
| hcloud / 依赖 | KooCLI 7.2.12（doctor 提示与插件配对 7.3.12 不一致，WARN） |
| 真云凭证 | cn-north-4（AKSK 已配置；只读子账号 test001 已下发） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status/version）/ MCP 协议 / 真云 E2E / 沙箱 |
| daily 基础用例 | 设计级 107 + 展开级 43 = **150** |

> **执行方法**：探针脚本（.mjs）直调 npm 全局包 `plugins/huaweicloud-core/src/*` 编译产物（v2 重构后 .mjs 在 npm 包内），决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。除常规「源码级存在性/规划类」探针外，本轮对 P0/P1 安全与协议用例追加了**深度断言探针**（脱敏小写形态、伪造命令 fail-closed、HCL 制品、Change* 动词、admin_pass command 阶段、list_operations 路由等），避免浅层探针虚报 PASS。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `150` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 17 / 2 / 3 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `86.5%`（128/148） |
| P0 / P1 / P2 缺陷 | `5 / 9 / 3`（本节口径：FAIL+SPEC 合计 17，另 2 项非产品、2 项 BLOCKED 不计入） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 全部归零（ECS/VPC/子网/OBS 均 0 残留，只读子账号测试 VPC 已删） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `88` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | D2-4 / D3-C1 / D3-C2 / D3-C4 / D3-C13 / D3-S6 / D3-S7 / D4-2 / D4-4 / D4-6 / D4-13 / D4-17 / D4-21 / D9-2 |
| BLOCKED | `2` | D3-C3 / D3-S3（沙箱部署链未闭环） |
| SPEC-MISMATCH | `3` | D4-23 / D9-9 / D8-9 |
| NOT_RUN | `0` | — |
| **合计** | **`107`** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | EXP-C4-14 / EXP-C4-18 / EXP-E01 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`43`** | |

### 3.3 使命（9）

`使命-mission-001`（D4 安全红线 9 条）与设计级 D4 用例同源，本轮深度断言后 D4-2/D4-17 转 FAIL，其余 PASS。

---

## 四、缺陷清单

> 15 项产品缺陷（FAIL 12 + SPEC-MISMATCH 3）详见 `FINDINGS.md`。2 项非产品（D3-C1 测试编排、D4-13 账号侧 IAM）、2 项 BLOCKED（沙箱部署链）不计入产品提单。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 产品/非产品 |
|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 小写 ak=/sk= 与 JSON 带引号 key 脱敏失效 | safety-policy.mjs:45/:20 | 产品 |
| 2 | P0 | D4-2 | 裸 access_key env 打印漏拦截 | safety-policy.mjs env-dump 正则 | 产品 |
| 3 | P0 | D4-21 | HCL/托管策略制品预检漏拦截 | cloud-risk-rules.json hwc-iam-admin-policy | 产品 |
| 4 | P0 | D4-23 | 全局规则未注入安装目标（SPEC） | setup-cli.mjs / bin/setup.cjs | 产品 |
| 5 | P1 | D4-4 | Change* 变更类动词漏拦截 | policy.json:27 writeOperationPrefixes | 产品 |
| 7 | P1 | D4-6 | admin_pass command 阶段未告警 | cloud-risk-rules.json stages | 产品 |
| 8 | P1 | D4-17 | 命令替换/控制字符 fail-open | risk-rule-engine.mjs 默认 allow | 产品 |
| 9 | P1 | D3-C4/EXP-C4-14/EXP-C4-18 | DMS/DEW list_operations 无 command | tools.mjs listOperations | 产品 |
| 10 | P1 | D3-C2/D3-C13 | OBS AWS4 签名缺 security-token | tools.mjs:3183/:3220 | 产品 |
| 11 | P1 | D9-2 | tools/list 非法 params 未返回 -32602 | mcp-protocol.mjs:61 | 产品 |
| 12 | P1 | D9-9 | capabilities 未声明 cancellation（SPEC） | mcp-protocol.mjs:51 | 产品 |
| 13 | P1 | D3-S7 | RDS 最小参数集缺项 + db.password | hcloud-cli.mjs | 产品 |
| 14 | P1 | EXP-E01 | 「云主机」中文意图路由 MISS | tools.mjs serviceCatalog | 产品 |
| 15 | P2 | D3-S6 | FG CreateFunction 字段名 func_name 错误 | hcloud-cli.mjs:784 | 产品 |
| 16 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK/token（SPEC） | telemetry.mjs sanitizeValue | 产品 |
| 17 | P1 | D3-C1 | ECS 脚本异步删除竞态致泄漏 | 测试编排脚本 | 非产品 |
| 18 | P1 | D4-13 | 只读子账号具备写权限 | 账号 IAM 策略 | 非产品 |

> 附：D10-4「安全干预-静态规则层」本轮实测规则库 19 条（9 deny + 10 warn），断言 `规则>=9 且 deny>=9 且 deny 生效` 通过，标 PASS；规则计数 16→19 属用例断言滞后（SPEC 契约漂移），已在 §八 建议（该类序号不占用缺陷清单编号）。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|---|
| D3-C3 | 设计级 | P1 | BLOCKED | 待定位 | 沙箱 connect 已恢复，但 upload_project 在 Windows 报 tar 路径错误 + expose_tunnel 公网 URL 实测 HTTP 404（内容未在 nginx 根路径服务） | 部署链修复（Windows tar 路径 / nginx 静态站 root）后复测 |
| D3-S3 | 设计级 | P1 | BLOCKED | 待定位 | 同 D3-C3（沙箱预览出 URL，公网 URL 404） | 同上 |

> 无 NOT_RUN 用例。真云用例（ECS/OBS/只读子账号）均已真机执行并归零。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（只读子账号测试经 run-as-readonly.py 注入，未输出 AK/SK 明文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（testbot5-hermes-e2e-*） | 是 | 已删（脚本竞态泄漏后手动补删） | ListServersDetails 前缀计数 0 |
| VPC（testbot5-hermes-e2e-*） | 是 | 已删 | ListVpcs 前缀计数 0 |
| 子网（testbot5-hermes-e2e-*） | 是 | 已删 | ListSubnets 前缀计数 0 |
| OBS 桶（testbot5-hermes-obs-*） | 是 | 已删（hcloud obs rm） | 已归零 |
| 只读子账号测试 VPC（testbot5-hermes-ro-*） | 是 | 已删 | ListVpcs 前缀计数 0 |
| 沙箱会话 | 是 | 已 close_session | "ok" |

> 真云只删本次创建资源（testbot5-hermes 前缀白名单），删除后三查归零确认 0 残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（notifications.cancellation）、`D4-23`（全局规则未注入）、`D8-9`（sanitizeValue 脱敏）。
- 相对 1.1.13：本轮 SUT 升级到 `1.1.14-next.0`，工具全集 46→47（新增 `huaweicloud_install_hcloud`）；昨夜沙箱由「维护中」恢复「可 connect（agreementSigned=true）」，但部署链在 Windows 暴露新问题（upload_project tar 路径 + 公网 URL 404）。
- 本轮新增深度断言暴露 6 项此前浅层探针未覆盖的安全缺陷（D2-4 小写形态 / D4-2 裸前缀 / D4-21 HCL / D4-4 Change* / D4-6 command 阶段 / D4-17 命令替换），均为真实复现，非环境噪音。
- 建议：① `probe-realcloud-ecs` 脚本需在 CreateServers 后加 ECS 就绪等待，规避 Ecs.0614 异步删除竞态；② 沙箱 upload_project 的 Windows 路径（tar -czf 含反斜杠/短路径）需专项修复；③ 规则库 19 条与用例断言 16 条触发维护侧同步用例计数。