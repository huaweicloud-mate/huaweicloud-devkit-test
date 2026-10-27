# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-27 09:50（北京时间）
> **执行归档**：`results/Hermes/2026-10-27-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Linux`（aarch64，机器 IP `120.46.222.180`） |
| Node / npm / Python | Node 22 / npm（全局 `huaweicloud-devkit@1.1.12`）/ Python 3.12 |
| 被测版本（SUT） | `v1.1.12`（npm `latest` 正式版，gitHead `4ed07801`，PR #1013 release-1.1.12） |
| 工具全集 | 40 个 MCP 工具（`tools.mjs`）+ CLI 命令 |
| 真云凭证 | cn-north-4（管理员 AKSK + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 43（已按 agent+OS 预筛） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E（D3-C1、D3-C13、D4-13 等）真实建删资源并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149`（NOT_RUN 1 为 D3-S7 跨服务交付，超出 daily 单服务真云范围） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 13 / 3 / 2 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 146） | `89.7%` |
| P0 / P1 / P2 新增缺陷（FAIL+SPEC） | `2 / 6 / 7` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本次创建资源全部归零（含历史残留 prw145 泄漏补删）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 沙箱服务维护中（D3-C3/D3-C6/D3-S3），见阻塞项 |
| SPEC-MISMATCH | `2` | 契约漂移（D1-68 region 优先级 / D8-9 sanitizeValue），待裁决 |
| NOT_RUN | `1` | D3-S7 跨服务交付超出 daily 范围（详见未执行用例） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01「云主机」路由 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性——JSON 小写 ak/sk 键未脱敏 | `src/safety-policy.mjs:34/49` | 待提单 |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线——非法时序未拒绝 | `src/mcp-protocol.mjs:57` | 待提单 |
| 3 | P1 | `D4-4` | D4安全 | 写操作审批门——Change* 变更类动词漏拦截 | `safety/policy.json:27` | 待提单 |
| 4 | P1 | `D3-C1` | D3功能 | 真云 ECS 生命周期 E2E——异步删除未归零泄漏 | `scripts/realcloud_e2e.mjs` finally | 待提单 |
| 5 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导——跨区错误码不符 | `src/tools.mjs:377/1329` | 待提单 |
| 6 | P1 | `D3-S1` | D3功能 | 场景-只读查 ECS——「云主机」路由 MISS | `src/tools.mjs` ECS routeMap | 待提单 |
| 7 | P1 | `D10-3` | D10评测 | 路由准确率——1 条中文意图 MISS | `src/tools.mjs` routeMap | 待提单 |
| 8 | P1 | `EXP-E01` | D10评测 | 评测集「云主机」路由 MISS | `src/tools.mjs` ECS routeMap | 待提单 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类——写操作落 cli:invoke | `hooks/huaweicloud-safety.py:24/46` | 待提单 |
| 10 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整 | `src/risk-rule-engine.mjs:19-22` | 待提单 |
| 11 | P2 | `D1-65` | D1安装 | 调试模式环境变量——DEBUG 仅认 'true' | `src/telemetry/telemetry.mjs:81` | 待提单 |
| 12 | P2 | `D1-66` | D1安装 | 遥测开关与端点环境变量不生效 | `src/telemetry/telemetry.mjs:176-180` | 待提单 |
| 13 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由——仅命中单一服务 | `src/tools.mjs` serviceCatalog | 待提单 |
| 14 | P2 | `D1-68` | D1安装 | region 环境变量优先级与契约相反（SPEC-MISMATCH） | `src/auth/credentials.mjs:225` | 待提单 |
| 15 | P2 | `D8-9` | D8遥测 | sanitizeValue 未做凭证脱敏（SPEC-MISMATCH） | `src/telemetry/telemetry.mjs:189` | 待提单 |

> 完整「现象/断言/根因/证据」细节见 `FINDINGS.md`（本目录，15 项，file_issue.py 解析输入）。较 2026-10-25（同为 v1.1.12，gitHead 4ed07801）15 项缺陷全部稳定复现、查重命中（不重复开单）；10-25 所列 D3-C3「deploy_nginx 端口冲突」缺陷本轮因沙箱服务维护（HDKIT_SANDBOX_MAINTENANCE）无法复测，仍为历史在案缺陷。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【改用例/补环境】跨服务复合编排(RDS+沙箱+连接串注入+归零)超出 daily 单服务真云探针范围，需专用编排 harness 与 RDS 实例配额；建议转专项隔离执行 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署 E2E | 华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE：沙箱功能正在升级优化)，无法建立/复用沙箱会话执行 E2E 建删资源；解除条件：沙箱服务恢复后重跑 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 同上（沙箱服务维护中） |
| `D3-S3` | D3功能 | 场景-沙箱预览出 URL | 同上（沙箱服务维护中） |

---

## 六、安全与红线合规

- 凭证泄漏事件：`无`（探针隔离 HOME/凭证 store，未触碰真实凭证；D2-4/D2-8/D2-18 脱敏用例已测）
- 写操作误判 read-only：`无`（D4-5 写命令不被误判只读 PASS）
- 红线（I 类）违规：`无`
- 脱敏复核：`D2-4（JSON ak/sk）、D4-26（--password 空格形态）、D8-9（sanitizeValue）三处脱敏缺口已记缺陷；D4-27 双路径输出脱敏 PASS`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（真云 D3-C1） | CreateServers 建成 | finally 提交删除（150s 轮询未确认） | 事后 List 确认归零（本轮创建 serverIds 已无残留） |
| VPC / 子网（真云 D3-C1） | 建成 | 提交删除 | List 确认归零 |
| 残留泄漏 prw145（`tctest-hermes-ecs-prw145` ECS/子网/VPC/系统盘） | 历史 D10 plan/deploy 建 | 本轮人工补删 ECS→子网→VPC | List 归零确认（ECS count=0、VPC 删除成功、EIP total_count=0） |
| OBS 桶（D3-C13） | 建桶 | `rm -f -r` + 空桶 `rm -f` | 已清（含空桶本体） |
| EIP | 无创建 | — | `total_count=0` |

> 并发说明：清点期间发现另一批 `testbot3-hermes-e2e-3064978816` 真云资源（ECS BUILD→ACTIVE），经核实为同机并发客户端（AtomCode/OpenClaw）正在执行的 realcloud E2E 建删，**非本客户端本次创建**，故未越权清理。

---

## 八、遗留与建议

- **15 项缺陷**（`FINDINGS.md`）均稳定复现、与 2026-10-25 同版本（v1.1.12）一致，建议维护者按 P0 → P1 → P2 排期修复；P0 优先：D2-4（JSON 凭证脱敏）与 D9-12（MCP 握手时序）。
- D3-C1 真云 ECS 异步删除泄漏为**高危资源泄漏**，建议 `realcloud_e2e.mjs` finally 将 ECS 删除轮询窗口扩展并增加真实归零校验（当前「提交即报 OK」会虚报归零）。
- 沙箱服务当前维护中（HDKIT_SANDBOX_MAINTENANCE），D3-C3/D3-C6/D3-S3 及历史 D3-C3「deploy_nginx 端口冲突」缺陷待沙箱恢复后补测收尾。
- D3-S7 跨服务交付建议转专项隔离执行（需 RDS 配额 + 编排 harness）。
- 待裁决 SPEC-MISMATCH：D1-68（region 优先级）与 D8-9（sanitizeValue 脱敏）需维护者确认契约口径后定修复或改用例。