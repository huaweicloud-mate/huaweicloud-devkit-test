# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-22 05:20（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-22-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL/SPEC 缺陷，P0 5 项；全部历史已知，见 `HISTORY_LINKS.md`）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64） |
| Node / npm / Python | `Node v22.23.5 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.15`（npm latest，源仓 commit bf79b643） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已配置（AKSK profile default / cn-north-4）` |
| 真云凭证 | `cn-north-4（AKSK 已配置；只读子账号 test001 已就绪）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（`_probe/core.mjs`+`checks1-6.mjs`）`file://` 直调 `hdk/plugins/huaweicloud-core/src/*.mjs` 导出函数（Node v22 直接 import `.mjs`）+ 经 `tools.callTool` 走真实 MCP 工具面；MCP 协议类自起 `mcp-server.mjs` 走 JSON-RPC 帧；真云 E2E（ECS/OBS/VPC/沙箱）真机执行（建删归零）；D10 评测走 `serviceCatalog` 路由层。证据统一落 `evidence/<case-id>/stdout.log`。

> 本日 SUT 为 **1.1.15**（npm latest，`.mjs` 布局）。复用 2026-11-18/11-21 的 `_probe/` harness 全量重跑，本机新证据逐条落盘，PASS 门禁机械校验通过。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（1 条 OS 专属 P0 豁免 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 9 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 142） | `93.0%` |
| P0 / P1 / P2 缺陷 | `5 / 3 / 2` |
| 红线（I 类）违规 | `0`（测试过程未 mock、未虚标 PASS、未泄露明文凭证；真云资源归零） |
| 资源释放 | `归零`（OBS 静态站建删归零；VPC/子网/安全组建删归零；沙箱 connect/upload/nginx 执行，隧道步骤因 devbridge 凭证过期受阻） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | OS 专属（D1-39 Windows 专属，Linux 不适用） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（云主机路由 MISS） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

见 `FINDINGS.md`（10 项：P0 ×5 / P1 ×3 / P2 ×2）。逐条根因（文件:行号）已严格落盘：

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏漏小写 ak=/sk= | `safety-policy.mjs:45` |
| 2 | P0 | `D4-3` | hcloud kms DecryptData 未拦截 | `cloud-risk-rules.json:56` |
| 3 | P0 | `D4-16` | sh -c 命令包裹穿透 | `cloud-risk-rules.json:26` + `risk-rule-engine.mjs:143` |
| 4 | P0 | `D4-21` | HCL 宽泛 IAM 制品未拦截 | `cloud-risk-rules.json:205-213` |
| 5 | P0 | `D9-12` | initialize 握手时序未强制 | `mcp-protocol.mjs:70` |
| 6 | P1 | `D3-S7` | 跨服务复合意图路由缺失 | `tools.mjs:2765-2769` / `:2817` |
| 7 | P1 | `D4-17` | 模糊输入 fail-open | `risk-rule-engine.mjs:106` |
| 8 | P1 | `EXP-E01` | 云主机口语别名未命中 ECS | `tools.mjs:2586-2587` |
| 9 | P2 | `D8-9` | sanitizeValue 不脱敏 AK/SK | `telemetry/telemetry.mjs:190` |
| 10 | P2 | `D1-68` | region 优先级契约漂移 | `auth/credentials.mjs:225` |

> 上述 10 项全部命中上游仓已有历史 issue（D2-4→#683 等、D4-3→#694、D4-16→#1055、D4-21→#1158、D9-12→#1158、D4-17→#1055、D8-9→#1158、D1-68→#1158、EXP-E01→#844、D3-S7→#844），属**历史已知缺陷复现**，本次不重复提单，详见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN（1 条）

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属用例（OS 列标注「专属」），本机为 Linux，不适用；Linux 侧由展开级 EXP-NR3-10 代表覆盖 | 【调归属】OS 归属列正确，Linux 无需执行 |

### BLOCKED（3 条）

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射）。已实测 VPC/子网/安全组创建→删除→归零成功，ECS 到达订单提交层。解除：账号开通 ECS 购买产品/按需计费 | 【补环境】billing 产品配额 |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013、EIP 创建返回 VPC.0501。已实测 list_regions 含 ap-southeast-3=true、plan_cli_command 含 --cli-region=true。解除：账号开通 ap-southeast-3 权限 | 【补环境】真云多 region 权限 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 DevBridge 隧道凭证已过期——沙箱内 devbridge create 返回 "API key expired, please login again"，无法暴露预览 URL。已实测 connect/upload/deploy_nginx 通过（deploy_check nginx_serving=HTTP 200），仅 tunnel 暴露步骤受阻。解除：沙箱环境刷新 devbridge API key | 【补环境】沙箱 devbridge 凭证 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（本测试过程未泄露明文 AK/SK；findings 均为 SUT 自身脱敏缺口，证据中凭证值均为测试桩值）
- [x] 写操作误判 read-only：`无`（真云写操作均经 plan_cli_command 确认流）
- [x] 红线（I 类）违规：`0`（未 mock 假跑、未虚标 PASS、真云资源建删归零）
- [x] 脱敏复核：`已复核`（D2-4 脱敏缺口为已知历史缺陷，非本测试引入泄露）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 静态网站桶（D3-C13） | `testbot2-opencode-obs-*` | 已 `OBS rm` 删除 | 已归零 |
| VPC/子网/安全组（D3-S2/D3-C1） | `testbot2-opencode-vpc-*` | 已 DeleteVpc 删除 | 已归零（ListVpcs 无本次创建残留） |
| ECS（D3-C1） | 未创建（订单提交被 billing 拒绝） | — | ECS count 无本次新增 |
| 沙箱（D3-S3） | workspace 会话（connect 复用） | tunnel 未创建成功 | 沙箱无残留隧道；devbridge 凭证过期是环境侧 |

> 真云用例均「最低配置创建 → 测后删除 → 归零验证」，只删本次创建资源；中断重跑前已复核查无泄漏。

---

## 八、遗留与建议

- **待裁决 SPEC**：D1-68 region 优先级契约漂移——实现 `HW_REGION` 优先，用例契约期望 `HUAWEICLOUD_REGION` 优先。建议维护者裁决契约或修正 `credentials.mjs:225`。
- **BLOCKED 补测**：3 条 BLOCKED 均为真·外部依赖（billing 产品未开通 / ap-southeast-3 无权限 / devbridge API key 过期），已写四要素解除条件，待环境恢复后补测。
- **历史缺陷**：10 项 FAIL/SPEC 全部为上游仓历史已知缺陷复现（v1.1.15 未修复），已记根因+证据、生成 `HISTORY_LINKS.md` 关联清单，本次不重复提单。