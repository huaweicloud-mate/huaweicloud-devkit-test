# Hermes-GLM-5.2 每日测试报告
> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-11 05:39:32（北京时间）
> **执行归档**：`results/Hermes/2026-10-11-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `GLM-5.2` |
| OS / 架构 | `Windows` (MINGW64_NT-10.0-20348) |
| 被测版本（SUT） | `1.1.7` (npm global, hdk commit 7456d05) |
| daily 基础用例 | 设计级 102 / 展开级 43 |
| 机器 IP | 120.46.2.198 |
| KooCLI 版本 | 7.2.12 |
| Node.js 版本 | v22.23.1 |
| Mission 摄入 | mission-001 (P0, 9 cases) |

> **执行方法**：源码级探针直调（ESM import 从 hdk 源码模块）+ CLI 命令实测（doctor/status/help）+ eval harness 路由测试（run-eval.mjs serviceCatalog 路由层）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `145`（设计级 102 + 展开级 43） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 19 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 145） | `86.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 16 / 1` |
| 红线（I 类）违规 | 无 |
| 资源释放 | 无真云资源创建/销毁（源码级探针测试，未触真云 CRUD） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `96` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `30` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链可用性 | `update-check.mjs:queryDistTagsSync` — Windows 下 `spawnSync('npm.cmd', ...)` 不带 `shell:true` 触发 EINVAL | 已知缺陷（#554） |
| 2 | P0 | `EXP-NR3-09` | D1安装 | Windows spawnSync EINVAL 直接捕获 | 同 D1-39，`spawnSync` 无 `shell:true` 在 Windows 下 EINVAL，MCP check_update 返回 check_failed | 已知缺陷（#554） |
| 3 | P1 | `D2-10` | D2认证 | R7 current档跟随 | `auth/reconcile.mjs:79` `resolveManagedProfile()` 依赖 `readKooCliProfiles()`，本机无 KooCLI profile 配置文件导致返回空 | 环境依赖 |
| 4 | P1 | `D2-16` | D2认证 | import文件读取后擦除 | `auth/reconcile.mjs` 无 `import` 文件擦除函数导出，import 凭证文件后擦除逻辑未在源码导出层暴露 | 缺失功能 |
| 5 | P1 | `D3-A1` | D3功能 | skill检索完整性 | `search-market.mjs` 搜索返回 1 个技能（本机技能目录仅 1 个 SKILL.md），需 ≥20 才覆盖完整 | 环境依赖 |
| 6 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs` 无 `serviceCatalog` 函数导出（serviceCatalog 是内部路由，非独立导出函数） | 探针限制 |
| 7 | P2 | `D6-3` | D6性能 | MCP冷启时间 | `mcp-server.mjs` 导出为 0（server 模块需 spawn 进程才能测试冷启时间，源码级导入无法度量） | 探针限制 |
| 8 | P1 | `EXP-E01` | D10评测 | ECS查询路由 | `mcp-server.mjs:serviceCatalog` 路由层 MISS：中文意图未命中 ECS，返回 generic help | 路由缺陷 |
| 9 | P1 | `EXP-E02` | D10评测 | ECS创建路由 | 同上，中文意图未命中 ECS | 路由缺陷 |
| 10 | P1 | `EXP-E03` | D10评测 | OBS静态站路由 | 未命中 OBS，返回 Sandbox+DevStation | 路由缺陷 |
| 11 | P1 | `EXP-E04` | D10评测 | EIP路由 | 未命中 EIP | 路由缺陷 |
| 12 | P1 | `EXP-E05` | D10评测 | RDS查询路由 | 未命中 RDS | 路由缺陷 |
| 13 | P1 | `EXP-E07` | D10评测 | CBR路由 | 未命中 CBR | 路由缺陷 |
| 14 | P1 | `EXP-E08` | D10评测 | 诊断路由 | N/A，未命中诊断路由 | 路由缺陷 |
| 15 | P1 | `EXP-E10` | D10评测 | FunctionGraph路由 | 未命中 FunctionGraph | 路由缺陷 |
| 16 | P1 | `EXP-E11` | D10评测 | BSS路由 | 未命中 BSS | 路由缺陷 |
| 17 | P1 | `EXP-E12` | D10评测 | CES路由 | 未命中 CES | 路由缺陷 |
| 18 | P1 | `EXP-E13` | D10评测 | ELB路由 | 未命中 ELB | 路由缺陷 |
| 19 | P1 | `EXP-E14` | D10评测 | IAM审计路由 | 未命中 IAM | 路由缺陷 |

### 根因详情

#### D1-39 / EXP-NR3-09 (P0): Windows spawnSync EINVAL
- **期望**: Windows 下 `spawnSync('npm.cmd', ...)` 不带 `shell:true` 应正常返回 dist-tags
- **实际**: 返回 `error.code === 'EINVAL'`，status=null，stdout 为空
- **根因**: `update-check.mjs:queryDistTagsSync` 函数在 Windows 下调用 `spawnSync('npm.cmd', args, { encoding, timeout, windowsHide })` 未设置 `shell: true`，Windows 的 `npm.cmd` 是批处理文件，必须通过 shell 执行
- **修复方向**: 在 `queryDistTagsSync` 的 `spawnSync` 选项中添加 `shell: true`（Windows 专属）
- **关联 issue**: #554
- **证据**: `evidence/D1-39/stdout.log`, `evidence/EXP-NR3-09/stdout.log`

#### D2-10 (P1): R7 current档跟随
- **期望**: `resolveManagedProfile()` 返回 KooCLI current 档
- **实际**: 本机无 `~/.hcloud/config.json` profile 配置，`readKooCliProfiles()` 返回空
- **根因**: 环境依赖 — 需 KooCLI 多 profile 配置才能测试，`auth/reconcile.mjs:44` `readKooCliProfiles()` 读 `~/.hcloud/config.json`
- **证据**: `evidence/D2-10/stdout.log`

#### D2-16 (P1): import文件读取后擦除
- **期望**: import 凭证文件后文件内容被擦除
- **实际**: `auth/reconcile.mjs` 无 import 文件擦除函数导出
- **根因**: `auth/reconcile.mjs` 模块未导出 import 文件擦除逻辑，可能功能未实现或在其他模块
- **证据**: `evidence/D2-16/stdout.log`

#### D3-A1 (P1): skill检索完整性
- **期望**: 检索到 ≥20 个技能
- **实际**: 仅检索到 1 个技能（`search-market.mjs` 返回本地技能目录）
- **根因**: 环境依赖 — 本机 hdk 技能目录仅含少量 SKILL.md，`search-market.mjs` 搜索范围受限
- **证据**: `evidence/D3-A1/stdout.log`

#### D3-S1 (P1): 场景-只读查ECS
- **期望**: `serviceCatalog` 函数可直调，ECS 只读路由可达
- **实际**: `tools.mjs` 无独立 `serviceCatalog` 导出（serviceCatalog 是 MCP 工具内部路由逻辑，非独立函数）
- **根因**: 探针限制 — serviceCatalog 路由通过 `huaweicloud_service_catalog` MCP 工具暴露，需通过 MCP 协议调用而非源码直调
- **证据**: `evidence/D3-S1/stdout.log`

#### D6-3 (P2): MCP冷启时间
- **期望**: MCP server 冷启动时间可度量
- **实际**: `mcp-server.mjs` 导出为 0（server 需 spawn 子进程才能度量冷启时间）
- **根因**: 探针限制 — 源码级导入无法度量进程启动时间，需 MCP Inspector 或 spawn 测试
- **证据**: `evidence/D6-3/stdout.log`

#### EXP-E01~E14 (P1): serviceCatalog 路由 MISS
- **期望**: 15 条中文意图评测集中，serviceCatalog 路由层命中对应华为云服务
- **实际**: 3/15 命中（EXP-E06 DCS, EXP-E09 CCE, EXP-E15 voucher），11/15 MISS + 1 N/A = 21.4% 命中率（与已知基线一致）
- **根因**: `mcp-server.mjs:serviceCatalog` 路由层对中文自然语言意图识别能力不足，大部分意图返回 generic help 消息而非路由到对应服务
- **证据**: `eval/results/eval-run-20261010020740.csv`, 各 `evidence/EXP-E*/stdout.log`

---

## 五、未执行用例与原因

无未执行用例。全部 145 条用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无 — 所有凭证脱敏用例（D2-4, D4-1~3, D4-6, D4-26~27）均 PASS，AK/SK 正确替换为 `<redacted>`
- [x] 写操作误判 read-only：无 — D4-5 写操作误判检测 PASS，DeleteServer 正确判为 `risk=write, decision=deny`
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：D2-4 凭证脱敏 PASS，D4-6 adminPass 脱敏 PASS，D4-27 双路径脱敏 PASS，D4-26 findings 证据脱敏 PASS

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS 等 | 无 | 无 | N/A |

> 本次测试为源码级探针 + CLI 命令实测，未触发真云 CRUD 操作。EXP-C4-01~C4-22 展开级用例通过源码级 `classifyHcloudArgs` + `planHcloudCommand` 验证只读规划冒烟命令语法/参数正确性，未实际创建云资源。

---

## 八、遗留与建议

1. **D1-39/EXP-NR3-09 (P0 EINVAL)**: 已知缺陷 #554，Windows 下 `spawnSync('npm.cmd')` 需 `shell:true`。建议在 `queryDistTagsSync` 添加 Windows 专属 `shell:true` 选项。
2. **EXP-E01~E14 路由 MISS (21.4% 命中率)**: serviceCatalog 中文意图路由能力不足，建议增强中文 NLU 路由规则或引入意图识别模型。已知基线，非新缺陷。
3. **D2-10 (KooCLI profile)**: 需配置 KooCLI 多 profile 环境才能完整测试，建议在测试环境预置 `~/.hcloud/config.json`。
4. **D2-16 (import 文件擦除)**: 需确认 import 文件擦除功能是否已实现，若未实现则需补开发。
5. **D3-S1/D6-3 (探针限制)**: 需通过 MCP Inspector 或 spawn 进程方式测试，建议在后续迭代中补充 MCP 协议级测试。
