# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-24 06:30（北京时间）
> **执行归档**：`results/Hermes/2026-10-24-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷；P1 缺陷 14 项，其中 11 项为已知 serviceCatalog 路由基线）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Windows`（MSYS 环境） |
| Node / 版本 | Node v26.7.0 / npm 11.19 / Python 3.14.7 |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.12`（npm latest；hdk package.json 1.1.12） |
| KooCLI | 7.2.12（`hcloud version`） |
| 真云凭证 | cn-north-4（AK/SK + STS token 已配置，真机建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：源码级探针（.mjs 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数）+ CLI 真机命令 + MCP 协议验证 + eval harness 路由评测 + 真云 E2E 真机执行（`scripts/realcloud_e2e.mjs` 建删 ECS/VPC/OBS/沙箱归零）。证据统一落 `evidence/<case-id>/probe.mjs + stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `150` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 14 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 150） | `90.7%` |
| P0 / P1 / P2 新增缺陷 | `0 / 14 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `ECS/VPC/子网归零，OBS 桶归零，沙箱会话已 close`（详见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `104` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | D3-C1/D3-C2/D3-C3（真云 E2E，根因见缺陷清单） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | 无（较 10-23 补齐 D1-65/D1-67/D4-25） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `32` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E01~E14 路由 MISS（已知 21.4% 基线） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D3-C2` | D3功能 | OBS静态站托管 AWS4 签名缺 x-amz-security-token | `tools.mjs:2398-2402` + `2438` | 待提单 |
| 2 | P1 | `D3-C1` | D3功能 | ECS生命周期删除异步超时，归零窗口不足 | `realcloud_e2e.mjs:107-122`（测试编排） | 待提单 |
| 3 | P1 | `D3-C3` | D3功能 | 沙箱 upload_project Windows tar 归档失败 | `session-manager.mjs:327-358` + `realcloud_e2e.mjs:153` | 待提单 |
| 4 | P1 | `EXP-E01~E14` | D10评测 | serviceCatalog 路由准确率 21.4% | `tools.mjs` service_catalog 中文关键词覆盖不足 | 历史基线（10-23 已提单） |

### 根因详情

**#1 D3-C2 OBS 静态站签名缺口（产品 bug）**
- 期望 `obs_set_website_config` set/get 返回 200；实际 set/get 均 400 `Request has x-amz-security-token header but signed headers not`。
- 根因：`tools.mjs:2398-2402` `signedHeaders` 仅含 host/x-amz-content-sha256/x-amz-date，但 `2438` 在凭证带 securityToken（STS）时向实际请求头加了 `x-amz-security-token` → 签名清单与发送头不一致 → AWS4 校验失败。
- 证据：`evidence/D3-C2/stdout.log`。

**#2 D3-C1 ECS 归零超时（测试编排）**
- 期望 ECS 生命周期测后 count=0；实际 Create VPC/Subnet/Server 成功，finally 删 ECS 后 150s 轮询仍 ACTIVE，残留 1 台 ECS。
- 根因：`realcloud_e2e.mjs:107-122` 未等 CreateServers 异步完成即删 + 轮询窗（15×10s）不足。残留已由测试方二次删除并核实 ECS count=0、VPC count=0。
- 证据：`evidence/D3-C1/stdout.log`。

**#3 D3-C3 沙箱上传 tar 失败（测试编排+Windows 兼容）**
- 期望 upload_project 成功（md5Verified）；实际 `tar -czf` 命令失败 upload_project=False，connect/deploy/check/close 均通过。
- 根因：`realcloud_e2e.mjs:153` 用 POSIX `/tmp/d3c3-proj`；`session-manager.mjs:327-358` `createTarGz` 以 `execFile('tar',....)` 归档，Windows 上 C:\ 路径与 MSYS `tar -C /tmp` 不匹配。
- 证据：`evidence/D3-C3/stdout.log`。

**#4 EXP-E 路由准确率（历史基线）**
- 期望 ≥50%；实际 21.4%（HIT=3/MISS=11/N/A=1）。
- 根因：`tools.mjs` service_catalog 中文关键词匹配覆盖不足（与 10-23 同）。
- 证据：`evidence/EXP-E01~EXP-E15/stdout.log`、`hdk/eval-results.json`。

---

## 五、未执行用例与原因

无未执行用例。150 条 daily 用例均已执行并回填（NOT_RUN=0、BLOCKED=0、空=0）。

---

## 六、安全与红线合规

- 凭证泄漏事件：0（D2-4/D4-2/D4-26/D4-27/D8-9 全脱敏通过）。
- 写操作误判 read-only：0（D4-5/D4-18/D4-19 写操作正确判 write/deny）。
- 红线（I 类）违规：0（真云 E2E 全真机执行，未 mock、未无凭证标 BLOCKED）。
- 脱敏复核：通过（报告与 findings 均无明文凭证）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（c6.large.2 ×1） | D3-C1 创建 | 二次手工 DeleteServers | `ListServersDetails` count=0 ✅ |
| VPC（testbot3-hermes-e2e-*） | D3-C1 创建 | DeleteVpc | 无 testbot3-hermes 残留 ✅ |
| 子网 | D3-C1 创建 | DeleteSubnet | SYS.0404 二次确认无此资源 ✅ |
| OBS 桶 | D3-C2 创建 | `OBS rm` | 删桶归零 ✅ |
| 沙箱会话（D3-C3/D3-C6） | 连接 | close_session | 会话关闭 ✅ |

> D3-C1 ECS 因删除异步超时残留 1 台，已由测试方真机二次删除并核实归零；其余资源均在探针 finally 中归零。

---

## 八、遗留与建议

1. **OBS AWS4 签名缺陷（#1）**：`obsSignedRequest` 需在 signedHeaders/canonicalHeaders 条件性加入 `x-amz-security-token`。
2. **ECS E2E 编排（#2）**：等待 CreateServers 异步完成后再删，加长删除确认轮询窗。
3. **沙箱上传 Windows 兼容（#3）**：`createTarGz` Windows 路径归一化。
4. **serviceCatalog 路由（#4）**：扩充中文意图关键词映射库。
5. 较 10-23 改进：D1-65/D1-67/D4-25 已源码级直调回填 PASS，本轮 NOT_RUN=0。
