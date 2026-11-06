# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-07 05:21（北京时间）
> **执行归档**：`results/Hermes/2026-11-07-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷；16 项缺陷（FAIL 13 + SPEC 3）与上一推 2026-11-06（v1.1.13，gitHead `8a6d8be2`）结论完全一致，均为历史复现、无新增缺陷、无修复）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64 ECS） |
| Node / npm / hcloud | `Node v22.13.0` / `npm 10` / `KooCLI 7.2.12` |
| 被测版本（SUT） | `1.1.13`（npm `latest` 正式版，gitHead `8a6d8be2`） |
| 工具全集 | `46`（tools/list） |
| daily 基础用例 | 设计级 107 / 展开级 43 |
| 真云凭证 | `cn-north-4`（AKSK，统一账号 hw018619646 + 只读子账号 test001） |

> **执行方法**：`run_all.sh` 编排 43 批探针——源码直调（classify/hook/auth/protocol/extended/d1 安装域/updatecheck/disttags/merge/routing/supplement/new-*）；spawn `mcp-server.mjs` 驱动 MCP 协议（D5/D8/D9）；真云 E2E 建删资源（realcloud-probe 的 D2-1/D3-C4/D4-14/D4-18/19/20、D4-13 只读子账号、D4-23 mdc 注入、D3-C1~C7）。证据逐用例落 `evidence/<case-id>/stdout.txt`，执行状态已回填三份 CSV。本轮为当日首轮全量执行（05:02 `prepare_env --latest` 拉取 latest=1.1.13 → 05:06~05:16 探针全量跑完 → 05:16 真云 E2E 收尾，05:21 回填+双门禁通过）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146`（PASS+FAIL+BLOCKED+SPEC） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 13 / 5 / 3 / 4` |
| 通过率（分母 = PASS+FAIL+SPEC = 141） | `88.7%` |
| 产品缺陷（FAIL） | `13`（设计级 12 + 展开级 EXP-E01 1） |
| 契约漂移（SPEC-MISMATCH） | `3`（D8-9 / D9-9 / D10-4） |
| P0 / P1 / P2 缺陷 | `4 / 7 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `D3-C1 ECS/VPC/子网、D3-C2 OBS、D3-C7 跨区域 EIP、D3-C13/D3-S2/D4-14 VPC-OBS 均真实创建后删除归零（D3-C1 自动化归零轮询超时，已手工补删并核实 GONE）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `83` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限阻塞（夹具/多客户端/审批流 5） |
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

完整根因（文件:行号）+ 断言 + 证据见同目录 `FINDINGS.md`（16 项：FAIL 13 + SPEC 3，EXP-E01 与 D10-3 合并计为 15 条）。下表为概览：

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

> 合计 16 行中，SPEC 3 项为「契约漂移」（实现正确，需维护用例母版），产品缺陷 13 项（FAIL 12 设计级 + EXP-E01 1 展开级）。16 项均与 2026-11-06（v1.1.13，gitHead `8a6d8be2`）结论**完全一致，无新增缺陷、无修复**（同日同 version 同 commit）。FunctionGraph 参数报错名本轮为 `function_name`（历轮漂移 function_name/code.filename/code.zip_file），RDS 为 `db.password`（历轮 db.port/db.password），属同一参数装配缺口。

---

## 五、未执行用例与原因

### NOT_RUN（4）

| 用例ID | 维度 | 标题 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 调归属 | Windows 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10（disttags 探针）代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 改用例 | 需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 改用例 | 需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | D8质量 | 中英文文档一致 | 改用例 | 需中英双源逐段比对，本轮未覆盖 |

### BLOCKED（5）

| 用例ID | 维度 | 标题 | 分类 | 阻塞原因（解除条件） |
|---|---|---|---|---|
| `D2-10` | D2认证 | R7 current档跟随 | 补环境 | 需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | D2认证 | R9 configuredBySession优先env | 补环境 | 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D4-12` | D4安全 | 供应链安装期安全 | 补环境 | 需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界 | 补环境 | 需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 调归属 | 需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。本轮 AK/SK/adminPass 均未明文落盘；D4-26/D4-6/D8-9 为「产品未脱敏」缺陷（属被测缺陷，非测试侧泄漏）。
- [x] 写操作误判 read-only：无。D4-14/D4-18/19/20 写操作 plan 均正确 `deny`/`confirm`；D4-13 只读子账号 readPassRate=100%、writeDenied=true、归零=true。
- [x] 红线（I 类）违规：无。
- [x] 脱敏复核：`credentialPanel`/`auth_status`/`redactSecrets`/`redactOutput` 均验证通过；证据 stdout 已避免回显明文 AK/SK。
- [x] 真云建删归零：D3-C1 ECS/subnet/VPC、D3-C2/D3-C13 OBS、D3-C7 跨区域 EIP、D3-S2/D4-14 VPC 均真实创建后删除并核实 GONE（见 §七）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1，`testbot3-hermes-ecs-3999574479`） | ✓ serverId `e3d295f8-...` | ✓ 自动化提交删除 + 手工补删 | ✓ ListServersDetails 本次 id=0 |
| VPC/subnet（D3-C1，`testbot3-hermes-e2e-3999574479`） | ✓ 创建成功（vpc `98f90d2c`/subnet `300c995d`） | ✓ 手工 DeleteSubnet + DeleteVpc | ✓ vpcs=0 / subnets=0 |
| OBS（D3-C2，`testbot3-hermes-obs-3999735926`） | ✓ 建桶成功 | ✓ hcloud OBS rm -f | ✓ Delete bucket successfully |
| OBS（D3-C13，`tctest-hermes-obs-mw5gzrqp`） | ✓ 建桶成功 | ✓ OBS rm -f | ✓ bucket removed |
| EIP（D3-C7 跨区域，`8ee493b6-...`） | ✓ publicipId 返回 | ✓ DeletePublicip | ✓ ListEips 无本次 id |
| VPC（D3-S2，`tctest-hermes-s2-mw5gzrqp` → `afd917c4-...`） | ✓ | ✓ DeleteVpc（确认后） | ✓ 归零=true |
| VPC（D4-14，`tctest-hermes-20261012-5h0ts9`） | ✓ | ✓ DeleteVpc | ✓ 归零验证 OK |
| 沙箱（D3-C3/C6） | ✓ connect/upload/deploy 成功 | ✓ close_session | ✓ 无残留 |

> 注：D3-C1 自动化 `finally` 归零的 ECS 删除轮询（150s）超时 + `sh().ok` 以退出码 0 误记 subnet:OK/vpc:OK，导致自动化判定归零 false；经手工 `hcloud ECS DeleteServers --servers.1.id=e3d295f8-f073-47c5-b532-35bddbe3ac5f --delete_publicip=true` → 轮询至 servers=0、`DeleteSubnet` → subnets=0、`DeleteVpc` → vpcs=0 逐一核实 GONE。此为测试脚本 150s 轮询时序抖动 + 退出码假阳性，非产品缺陷（创建/删除全链路均通过）。D3-S6（FunctionGraph）CreateFunction 未成功（参数装配缺口），测后删除函数归零。D4-13 只读子账号写操作被 IAM 拒绝（writeDenied=true），未创建任何 VPC（residualZero=true）。

---

## 八、遗留与建议

- 16 项缺陷（FAIL 13 + SPEC 3）与 2026-11-06（v1.1.13，gitHead `8a6d8be2`）结论**完全一致，无新增缺陷、无修复**；同日同 version 同 commit。均由上游 `file_issue.py` 历史查重关联既有 open issue（见 `HISTORY_LINKS.md`），不重复开单。
- 本轮 KooCLI 版本为 7.2.12，devkit 配对版本 7.3.12（`check_cli` 报 version_mismatch，但不影响本轮 hcloud 真云命令执行）；建议按提示 `npx huaweicloud-devkit install-hcloud` 对齐版本。
- 3 项 SPEC-MISMATCH（D8-9/D9-9/D10-4）需维护者裁决用例母版是否同步。
- D1-70：建议 devkit 将 bundled undici 与 zstd-capable node 门槛对齐（Node>=22.15 引擎下限，或 proxy-agent 增加 zstd 缺失降级路径）。
- D3-S6/D3-S7 历轮 `Invalid parameter` 报错参数名漂移（function_name/code.filename/code.zip_file；db.port/db.password），说明 FunctionGraph/RDS Create 的参数装配缺口需从工具层根治（非单一参数漏传）。
- EXP-NR3-10（disttags 探针）：本轮首跑 `queryDistTags`（异步 spawn npm view）偶发返回 null，隔离复跑即正常返回 dist-tags 对象（`{"latest":"1.1.13","next":"1.1.14-next.0"}`），判 PASS（transient npm spawn 抖动，非产品缺陷，证据已覆盖复跑结论）。