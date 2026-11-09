# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-10 05:21（北京时间）
> **执行归档**：`results/DSH/2026-11-10-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项；12 项缺陷均为历史遗留，归入既有单 #1055）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64/arm64） |
| 被测版本（SUT） | `huaweicloud-devkit v1.1.13`（npm latest，gitHead `8a6d8be2`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针直调 hdk 源码（`_probe` 直接 `import plugins/huaweicloud-core/src` 模块，146 例覆盖设计级 + 展开级）+ 真云 E2E（ECS/VPC/OBS/sandbox 建删并归零）+ `eval/harness` 路由评测（D10/EXP 系列）+ 权威 fixtures（D2/D3 认证与沙箱）。PASS 用例均有 `evidence/<case-id>/probe.mjs` + `stdout.log` 证据落盘。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（另 1 项为 OS 专属豁免 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 11 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 142） | `91.5%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 3`（含 1 项 SPEC-MISMATCH 归入 P2） |
| 红线（I 类）违规 | `无`（凭证文件读取/env 打印均被拦截，写操作审批门通过；D4 已知缺陷为「漏拦」而非「越权执行」） |
| 资源释放 | `已归零`（OBS 桶建删归零；ECS 未创建、其 VPC/子网/SG 已建删归零；sandbox 会话已释放） |

> 本轮执行环境为 `workspace-write` 沙箱 + `danger-full-access` 单次写放行（对测试仓库/真云资源操作逐条放行）。真云/审批类用例（D3-C2 OBS、D3-C13 静态站、D3-C3/D3-C6 sandbox、D4-24 审批令牌一次性消费）均一次通过，无环境侧误判。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞（均有 blockedReason） |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | OS 专属豁免（D1-39 Windows 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 服务目录路由 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `src/safety-policy.mjs` + `safety/rules/cloud-risk-rules.json` 未覆盖「双引号 + 管道」sh -c 包裹 | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety/rules/cloud-risk-rules.json` 写操作前缀表缺 `Decrypt`/`DecryptData` | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 3 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `safety/rules/cloud-risk-rules.json` 缺 HCL `actions=["*"]` + `evaluateArtifacts` 未识别宽授权 | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 4 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `src/safety-policy.mjs` `redactSecrets` 仅覆盖大写 `AK=`/`SK=` 前缀 | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 5 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `src/mcp-protocol.mjs` 未校验 initialize 握手状态即处理 `tools/list` | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 6 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `safety/rules/cloud-risk-rules.json` 缺 `$(...)` + `src/risk-rule-engine.mjs` 未识别命令替换 | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 7 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | `src/tools.mjs` serviceCatalog 复合意图未聚合第二意图 | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 8 | P1 | `D2-10` | D2认证 | R7 current档跟随 | `src/auth/` KooCLI 报错被包装 + 中文指引追加（文案契约漂移） | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 9 | P1 | `EXP-E01` | 路由 | 服务目录路由 MISS | `src/tools.mjs` serviceCatalog 缺「云主机」→ECS 同义映射 | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 10 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `src/telemetry/telemetry.mjs` `sanitizeValue` 未覆盖 `secret_key`/`token` | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 11 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | `src/auth/service.mjs` + `guidance.mjs` 中文文案替代精确英文 | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |
| 12 | SPEC(P2) | `D1-68` | D1安装 | region 优先级契约漂移 | `src/auth/credentials.mjs` 实现 HW_REGION 优先，与契约（HUAWEICLOUD_REGION 优先）相反 | 历史遗留 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) |

### 根因详情

> 全部 12 项缺陷的「期望 / 实际 / 根因（文件:行号）/ 证据」详见同目录 `FINDINGS.md`；历史查重结论与关联单号详见 `HISTORY_LINKS.md`。核心证据均已落盘 `evidence/<case-id>/stdout.log`：
> - `D4-16` 实际 `{"decision":"allow"}` · `D4-3` 实际 `{"decision":"allow"}` · `D4-21` `json=deny hcl=allow`
> - `D2-4` 明文残留 `ak=AK123456 sk=SKsecret` · `D9-12` 未 init 先 list 返回 40 工具
> - `D4-17` 实际 `{"decision":"allow"}` · `D3-S7` 仅命中 RDS · `D2-10` 文案混入中文 · `EXP-E01` 回退 help
> - `D8-9` sanitizeValue 未脱敏 · `D3-C14` 抛中文文案 · `D1-68` HW_REGION 优先

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），本机为 Linux，不适用；由展开级 EXP-NR3 代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：`Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零 全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品 / 开启按需计费（补环境·billing 产品配额） |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 跨区域 `ap-southeast-3` 不在账号项目范围（账号 project 仅 `cn-north-4`）——ECS 只读返回 `Common.0013`、EIP 创建返回 `VPC.0501`，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3、plan_cli_command 含 --cli-region。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多 region 权限） |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL）。解除条件：沙箱配额就绪且 devbridge 隧道可用后重测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`——D4-1（凭证文件读取拦截 deny）/D4-2（凭证 env 打印拦截 deny）均 PASS；D2-4/D8-9 为脱敏覆盖缺口（明文入日志），属已知缺陷而非本轮泄漏事件。
- [x] 写操作误判 read-only：`无`——D4-4（写操作审批门）/D4-5（写操作未误判只读）均 PASS；D4-13 只读子账号 run_readonly 成功。
- [x] 红线（I 类）违规：`无`。
- [x] 脱敏复核：完成——PASS 场景脱敏正常；小写 ak=/sk=（D2-4）与 telemetry secret_key/token（D8-9）两处漏脱敏已记缺陷。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2） | `obs://testbot2-dsh-obs-*` 建桶 + 上传 index.html | 对象 rm + 桶 rm | `hcloud OBS ls` 无 testbot2-dsh 残留，归零=true |
| OBS 静态站（D3-C13） | mb=true set=true | 删除 | 已归零 |
| VPC / 子网 / 安全组（D3-C1 / D3-S2） | 创建 | 删除 | `hcloud VPC ListVpcs` 无 testbot2-dsh 残留，归零=true |
| ECS（D3-C1） | 未创建（billing 订单拦截） | 无 | 无残留 |
| 沙箱会话（D3-C3 / D3-C6） | 创建 | 释放 | PASS，无残留 |
| 跨区域资源（D3-C7） | 无（region 权限阻塞） | 无 | 无残留 |

---

## 八、遗留与建议

- 12 项缺陷均为历史遗留（源码 `8a6d8be2`/latest 1.1.13 上仍复现），已由 `file_issue.py` 查重归入既有单 #1055（详见 HISTORY_LINKS.md），不重复开单，建议维护者跟踪修复状态。
- `D1-68`（SPEC-MISMATCH）：region 优先级「实现 HW_REGION 优先 vs 契约 HUAWEICLOUD_REGION 优先」待维护者裁决统一口径。
- 3 项 BLOCKED 均为真·外部依赖（D3-C1 BSS 产品配额 / D3-C7 跨 region 项目 / D3-S3 DevStation 配额 + devbridge 隧道），环境就绪后补测；其中 D3-C3/D3-C6 沙箱已 PASS，D3-S3 建议配额就绪后复测。