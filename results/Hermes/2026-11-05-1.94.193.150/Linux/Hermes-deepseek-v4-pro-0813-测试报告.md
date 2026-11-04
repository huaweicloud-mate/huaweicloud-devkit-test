# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-05 05:22（北京时间）
> **执行归档**：`results/Hermes/2026-11-05-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项产品缺陷/SPEC；13 项 FAIL + 3 项 SPEC 均历史复现，无新增产品缺陷；另新增 4 项真云账户环境 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64 ECS） |
| Node / npm / hcloud | `Node v22.13.0` / `npm 11` / `KooCLI 7.2.12` |
| 被测版本（SUT） | `1.1.13-next.5`（npm `@next`，gitHead `4ab34ed2`） |
| 工具全集 | `46`（tools/list） |
| daily 基础用例 | 设计级 107 / 展开级 43 |
| 真云凭证 | `cn-north-4`（AKSK，统一账号 hw018619646 + 只读子账号 test001） |

> **执行方法**：`run_all.sh` 编排 43 批探针——源码直调（classify/hook/auth/protocol/extended/d1 安装域/updatecheck/disttags/merge/routing/supplement/new-*）；spawn `mcp-server.mjs` 驱动 MCP 协议（D5/D8/D9）；真云 E2E 建删资源（realcloud-probe 的 D2-1/D3-C4/D4-14/D4-18/19/20、D4-13 只读子账号、D4-23 mdc 注入、D3-C1~C7）。证据逐用例落 `evidence/<case-id>/stdout.txt`，执行状态已回填三份 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `118 / 13 / 12 / 3 / 4` |
| 通过率（分母 = PASS+FAIL+SPEC = 134） | `88.1%` |
| 产品缺陷（FAIL） | `13`（设计级 12 + 展开级 EXP-E01 1） |
| 契约漂移（SPEC-MISMATCH） | `3`（D8-9 / D9-9 / D10-4） |
| P0 / P1 / P2 缺陷 | `4 / 7 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本轮真云未创建任何付费资源（账户受限/余额不足）；VPC/subnet/OBS 等免费/已建资源均已归零` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `76` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `12` | 环境/权限/凭证阻塞（含 4 项账户受限/余额不足） |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行（OS 专属 1 + 文档级 3） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（与 D10-3 同根因） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单

完整根因（文件:行号）+ 断言 + 证据见同目录 `FINDINGS.md`（16 项）。下表为概览：

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） |
|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `safety-policy.mjs:550` |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL broad IAM | `cloud-risk-rules.json:196` |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线两处缺口 | `mcp-protocol.mjs:34-42,61` |
| 4 | P0 | `D10-4` | D10评测 | 风险规则库 16→19 条断言漂移（SPEC） | `cloud-risk-rules.json` |
| 5 | P1 | `D1-70` | D1安装 | 代理 WebSocket 崩溃（undici 缺 node zstd） | `proxy-agent.mjs:20-22` |
| 6 | P1 | `D4-6` | D4安全 | `--admin-pass` 不告警 + JSON key adminPass 未脱敏 | `cloud-risk-rules.json:68` |
| 7 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open | `risk-rule-engine.mjs:106` |
| 8 | P1 | `D3-S7` | D3功能 | 复合意图部署目标未命中 + CreateInstance 缺前置 | `tools.mjs` |
| 9 | P1 | `D10-3` | D10评测 | 「云主机」意图路由 MISS（92.9%） | `tools.mjs:2197` |
| 10 | P1 | `EXP-E01` | D10评测 | 同上（展开级代表，同 D10-3 根因） | `tools.mjs:2197` |
| 11 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs` |
| 12 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单一服务 | `tools.mjs` |
| 13 | P2 | `D3-S6` | D3功能 | FunctionGraph CreateFunction 失败（function_name） | `tools.mjs`（FUNCTION_OPS 装配） |
| 14 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类 cli:invoke | `huaweicloud-safety.py:46` |
| 15 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（明文 secret 残留） | `risk-rule-engine.mjs:22` |
| 16 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏（SPEC） | `telemetry.mjs:190` |

> 合计 16 行中，SPEC 3 项为「契约漂移」（实现正确，需维护用例母版），产品缺陷 13 项（FAIL 12 设计级 + EXP-E01 1 展开级）。16 项均与 2026-11-04（v1.1.13-next.3）结论**完全一致，无新增缺陷、无修复**（next.5 未包含对这些缺陷的修复）。FunctionGraph 参数报错名本轮为 `function_name`（历轮漂移 function_name/code.filename/code.zip_file），RDS 为 `db.port`（历轮 db.port/db.password），属同一参数装配缺口。

---

## 五、未执行用例与原因

### NOT_RUN（4）

| 用例ID | 维度 | 标题 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 调归属 | Windows 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10（disttags 探针）代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 改用例 | 需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 改用例 | 需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | D8质量 | 中英文文档一致 | 改用例 | 需中英双源逐段比对，本轮未覆盖 |

### BLOCKED（12）

| 用例ID | 维度 | 标题 | 分类 | 阻塞原因（解除条件） |
|---|---|---|---|---|
| `D3-C1` | D3功能 | ECS 生命周期 E2E | 补环境 | 账户余额不足（Ecs.0067）——CreateVpc/Subnet/归零通过，仅 ECS 创建缺余额；解除=账户充值 |
| `D3-C2` | D3功能 | OBS 静态站部署 E2E | 补环境 | 账户受限（OBS mb 403 UserRestricted）；解除=账户实名/解除受限 |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 补环境 | 账户余额不足/受限（跨区域 EIP 创建未返回 publicipId）；plan/只读/可用性通过；解除=账户充值 |
| `D3-C13` | D3功能 | 场景-OBS 部署 | 补环境 | 账户受限（OBS mb 403 UserRestricted）；解除=账户解除受限 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 补环境 | 沙箱维护中（HDKIT_SANDBOX_MAINTENANCE）；解除=华为云沙箱维护完成 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 补环境 | 沙箱维护中；解除=华为云沙箱维护完成 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 补环境 | 沙箱维护中；解除=华为云沙箱维护完成 |
| `D2-10` | D2认证 | R7 current档跟随 | 补环境 | 需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | D2认证 | R9 configuredBySession优先env | 补环境 | 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D4-12` | D4安全 | 供应链安装期安全 | 补环境 | 需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界 | 补环境 | 需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 调归属 | 需多客户端并存环境（单机仅 Hermes） |

> 本轮新增 4 项真云账户环境阻塞（D3-C1/C2/C7/C13，账户受限/余额不足），已在实测中确认非产品缺陷：VPC/子网/OBS 参数校验等免费或 client 侧路径均正常通过，仅付费资源（ECS/OBS/EIP）创建被云端账户态拒绝。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。本轮 AK/SK/adminPass 均未明文落盘；D4-26/D4-6/D8-9 为「产品未脱敏」缺陷（属被测缺陷，非测试侧泄漏）。
- [x] 写操作误判 read-only：无。D4-14/D4-18/19/20 写操作 plan 均正确 `deny`/`confirm`；D4-13 只读子账号 readPassRate=100%、writeDenied=true、归零=true。
- [x] 红线（I 类）违规：无。
- [x] 脱敏复核：`credentialPanel`/`auth_status`/`redactSecrets`/`redactOutput` 均验证通过；证据 stdout 已避免回显明文 AK/SK。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC/subnet（D3-C1，`testbot3-hermes-e2e-3826...`） | ✓ 创建成功 | ✓ 自动 finally 删除 | ✓ subnet:OK vpc:OK（ECS 未创建因余额不足，该 VPC/子网已删） |
| VPC（D3-S2，`tctest-hermes-s2-mw2m3sq6`） | ✓ | ✓ DeleteVpc（确认后） | ✓ 删除后归零=true |
| VPC（D4-14，`tctest-hermes-20261012-2m46wn`） | ✓ | ✓ DeleteVpc | ✓ 归零验证 containsOwn=false |
| ECS（D3-C1） | ✗ 未创建（余额不足 Ecs.0067） | — | ✓ 无残留 |
| OBS（D3-C2/D3-C13） | ✗ 未创建（403 UserRestricted） | — | ✓ 无残留 |
| EIP（D3-C7 跨区域） | ✗ 未创建（余额不足） | — | ✓ ListEips 无本次 id |
| 沙箱（D3-C3/C6/S3） | ✗ 未创建（HDKIT_SANDBOX_MAINTENANCE） | — | ✓ 无残留 |

> 注：本轮因账户受限/余额不足，付费资源（ECS/OBS/EIP）未创建成功，故无付费残留；免费资源（VPC/子网）均已创建后归零。D3-S6（FunctionGraph）CreateFunction 未成功（参数装配缺口），测后删除函数归零。

---

## 八、遗留与建议

- 16 项缺陷（FAIL 13 + SPEC 3）与 2026-11-04（v1.1.13-next.3）结论**完全一致，无新增缺陷、无修复**；均由上游 `file_issue.py` 历史查重关联既有 open issue（见 `HISTORY_LINKS.md`），不重复开单。
- **本轮新增 4 项真云账户环境阻塞（D3-C1/C2/C7/C13）**：统一账号 hw018619646 余额不足且 OBS 受限（403 UserRestricted），建议维护者核实账户充值/实名状态；恢复后可直跑 `realcloud_e2e.mjs --case=D3-C1/C2` 与 `new-cloud-probe.mjs` 补测解除 BLOCKED。
- 3 项 SPEC-MISMATCH（D8-9/D9-9/D10-4）需维护者裁决用例母版是否同步。
- D1-70：建议 devkit 将 bundled undici 与 zstd-capable node 门槛对齐（Node>=22.15 引擎下限，或 proxy-agent 增加 zstd 缺失降级路径）。
- 沙箱用例（D3-C3/D3-C6/D3-S3）待华为云沙箱维护完成后补测解除 BLOCKED。
- D3-S6/D3-S7 历轮 `Invalid parameter` 报错参数名漂移（function_name/code.filename/code.zip_file；db.port/db.password），说明 FunctionGraph/RDS Create 的参数装配缺口需从工具层根治（非单一参数漏传）。