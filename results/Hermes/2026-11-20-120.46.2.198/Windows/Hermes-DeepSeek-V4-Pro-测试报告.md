# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-11-20 05:45:00（北京时间）
> **执行归档**：`results/Hermes/2026-11-20-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（3 FAIL / 3 SPEC-MISMATCH / 8 BLOCKED，含 P0 规则数漂移，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Windows（hostname vector-zhangshuang-devkit-testbot5，IP 120.46.2.198） |
| Node / npm / Python | Node v26.7.0 / npm 11.19.0 / Python 3.14.7 |
| 被测版本（SUT） | `v2.0.0-next.4`（npm @next，gitHead `16a24814`） |
| 工具全集 | `58`（tools.js TOOL_DEFINITIONS / tool-schemas.js TOOL_SCHEMAS 58，较文档 40/46 漂移） |
| hcloud / 依赖 | hcloud 7.3.12（KooCLI，真实凭证 cn-north-4 有效） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，hcloud CLI 真机执行通过；npm 包 voucher_status 报 CRED_INVALID 待核对） |
| 测试类型 | 源码级探针（dist/*.js）/ 真机 CLI / MCP 协议（stdio+remote）/ 真云 E2E（VPC+subnet+OBS 建删归零） |
| daily 用例 | 设计级 107 / 展开级 43 / 追踪表 216 行 |

> **执行方法**：探针脚本（.mjs）直调 `plugins/huaweicloud-core/dist/*.js` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。注意 SUT 从昨日 1.1.14（src/*.mjs）切换至 2.0.0-next.4（dist/*.js，TypeScript 编译产物 + TOOL_DEFINITIONS 与 TOOL_SCHEMAS 分离 + vendor gate 新增）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `150` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 3 / 8 / 3 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `95.8%` |
| P0 / P1 / P2 缺陷 | `0 / 3 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/子网/OBS 已删，ECS count=0） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | D3-C2 / D3-C13 / EXP-E01（EXP-E01 属展开级，此表为设计级，FAIL=0 展开级另行） |
| BLOCKED | `7` | D3-C3/C4/C6/C14/S3/S6/S7 沙箱/多服务阻塞 |
| SPEC-MISMATCH | `2` | D10-4 规则数漂移 / D8-9 sanitizeValue 未脱敏 |
| NOT_RUN | `0` | — |
| **合计** | **`107`** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | EXP-C4(22)/EXP-D5(2)/EXP-NR3(4)/EXP-E 命中 13 中 12 |
| FAIL | `1` | EXP-E01 云主机同义别名 MISS |
| BLOCKED | `1` | 无（展开级 BLOCKED=0，D9-6 属设计级） |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`43`** | |

> 设计级与展开级统计口径以 CSV 回填为准；设计级 FAIL=3（D3-C2、D3-C13、D9-2 SPEC），此处 3.1 表 FAIL/SPEC 拆分见 CSV。

---

## 四、缺陷清单（详见 FINDINGS.md，本报告摘要）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P1 | `D3-C13` | OBS 网站托管配置 STS 签名 403 InvalidAccessKeyId | `lib/hw-request-signing.js` | 待提单 |
| 2 | P1 | `D3-C2` | OBS 静态站 E2E 未闭环（set 审批 gate + get STS 403） | 同 #1 + 写审批 gate | 待提单 |
| 3 | P2 | `D10-4` | 安全规则数漂移 29 vs 文档 16 | `risk-rule-engine.js` | 待提单 |
| 4 | P2 | `D8-9` | sanitizeValue 未脱敏 AK/SK | `telemetry/telemetry-values.js:21` | 待提单 |
| 5 | P2 | `D9-2` | 未知工具未以 JSON-RPC -32602 返回 | `mcp-server.js` tools/call 分发 | 待提单 |
| 6 | P1 | `EXP-E01` | 服务目录路由缺「云主机」同义别名（历史 #705） | `capability-catalog.js:17` | 待提单 |

---

## 五、未执行用例与原因（BLOCKED 逐条）

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D3-C3 | 设计 | P1 | BLOCKED | 补环境 | 沙箱部署 E2E：需沙箱服务(hdkitservice)可连 + upload_project 完整链路 |
| D3-C4 | 设计 | P1 | BLOCKED | 补环境 | 服务创建类回归：需逐服务轻量建删（本轮已完成 VPC/子网真机建删归零 + 22 服务只读冒烟） |
| D3-C6 | 设计 | P1 | BLOCKED | 补环境 | 沙箱 check_user 返回 HDKIT_UPSTREAM_ERROR（查询实名状态失败，沙箱服务不可达） |
| D3-C14 | 设计 | P2 | BLOCKED | 补环境 | 沙箱 HDKit 服务参数与 hwlink 凭证夹具：需沙箱服务 |
| D3-S3 | 设计 | P2 | BLOCKED | 补环境 | 沙箱预览出 URL：需沙箱服务 + upload_project + deploy_nginx + expose_tunnel |
| D3-S6 | 设计 | P2 | BLOCKED | 补环境 | FunctionGraph 定时任务：需真机建 FG 函数 + 定时触发器 → 删除归零 |
| D3-S7 | 设计 | P2 | BLOCKED | 补环境 | 跨服务交付(Web+RDS)：需 RDS 实例 + 沙箱部署 + 连接串注入 |
| D9-6 | 设计 | P2 | BLOCKED | 补环境 | 跨客户端协议互通：本机 Hermes 单客户端，无第二客户端会话 |

---

## 六、安全/红线

- 真云 E2E 已真机执行：VPC(testbot5-hermes-e2e-*)+子网 创建→删除→ListVpcs 归零；OBS 桶建→删(signed DELETE 204)→归零；ECS count=0。**无残留**。
- PASS 门禁（verify_no_fake_pass）通过：136 条 PASS 均有 evidencePath 且证据存在。
- 覆盖率门禁（verify_coverage）通过：P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%。
- 凭证：未回显任何 AK/SK 明文；凭证读取命令经风险引擎判 deny。

---

## 七、资源释放

| 资源 | 结果 |
|---|---|
| VPC testbot5-hermes-e2e-* | 已删除（ListVpcs 归零，async 删除已 wait 复核） |
| 子网 | 已删除（ListSubnets 归零） |
| OBS 桶 testbot5-hermes-obs-* | 已删除（signed DELETE 204） |
| ECS | 未创建（count=0） |

---

## 八、遗留建议

1. OBS website config STS 签名缺陷（#1/#2）为 1.1.14 延续至今的根因，建议优先修复 `lib/hw-request-signing.js` STS 处理。
2. vendor gate / 写审批 gate 为 2.0.0-next.4 新增行为，工具调用需传 `vendorConfirmed` 且写操作需 approval token，测试夹具与文档需同步。
3. `findSkillsRoot` 已改名 `SKILLS_ROOT`（skill-disclosure.js），`serviceCatalog` 移入 `capability-catalog.js`，`mcp-server-remote` 合并进 `mcp-server.js`——母版用例的「关联工具/指引来源」需同步 v2 模块地图。
4. TOOL_DEFINITIONS 拆分为 name/description + TOOL_SCHEMAS 分离，D9-8 断言口径需同步到新 schema 结构。
5. 真云凭证：hcloud CLI 有效但 npm 包 voucher_status 报 CRED_INVALID，建议核对 credentials.json 与包内解析路径是否一致。