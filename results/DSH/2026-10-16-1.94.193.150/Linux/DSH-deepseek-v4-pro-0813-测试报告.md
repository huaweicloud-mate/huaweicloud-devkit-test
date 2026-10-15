# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-16 05:25（北京时间）
> **执行归档**：`results/DSH/2026-10-16-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04.4 LTS） |
| 机器 IP | `1.94.193.150` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.9-next.0`（npm @next，gitHead `6302921c`，PR #914） |
| 工具全集 | `42`（`tools.mjs` 注册源数量，`D5-3` 实测） |
| hcloud / 依赖 | `hcloud 7.2.12`，doctor 已配置 |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，统一账号 hw018619646；只读子账号 test001 已就绪） |
| 测试类型 | 源码级探针（直调 hdk src 导出函数）/ 真机 CLI（hcloud）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39（预筛剔除非 DSH/Linux 27 条后） |

> **执行方法**：`_probe/main.mjs` 全量驱动 146 个用例——`checks1-4.mjs` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（`evaluateCommandRisk`/`serviceCatalog`/`redactSecrets`/`detectFramework` 等）+ `hcloud` 真机 CLI（真云建删资源）+ `eval/harness/fixtures` 权威夹具，决策/结果落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 仅 1 条 Windows 专属） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 11 / 5 / 1 / 1` |
| 通过率（分母 = PASS+FAIL） | `92.1%` |
| P0 / P1 / P2 缺陷 | `5 / 4 / 3` |
| 红线（I 类）违规 | `0`（本次测试过程无凭证泄漏事件；缺陷清单中的脱敏缺口为被测产品自身安全策略缺陷） |
| 资源释放 | `全部归零（VPC/ECS/OBS/EIP 无本次残留；OBS 建删归零逐一验证）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `1` | region 优先级契约漂移（D1-68） |
| NOT_RUN | `1` | D1-39 Windows 专属，Linux 不适用 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏漏小写 `ak=`/`sk=`（明文残留） | `safety-policy.mjs:42,45` | 历史缺陷 |
| 2 | P0 | `D4-3` | 明文 secret API 拦截缺 `kms DecryptData` | `cloud-risk-rules.json` + `risk-rule-engine.mjs:79-113` | 历史缺陷 |
| 3 | P0 | `D4-16` | 命令包裹穿透（`sh -c "env\|grep HW_*"` 未拦截） | `cloud-risk-rules.json`（hwc-command-env-dump）+ `risk-rule-engine.mjs:79-113` | 历史缺陷 |
| 4 | P0 | `D4-21` | HCL/Terraform 宽权限 IAM 制品未拦截 | `cloud-risk-rules.json`（hwc-iam-admin-policy）+ `risk-rule-engine.mjs:150` | 历史缺陷 |
| 5 | P0 | `D9-12` | MCP 未 `initialize` 先 `tools/list` 未拒绝 | `mcp-protocol.mjs:57-59` + `mcp-server.mjs:186-187` | 历史缺陷 |
| 6 | P1 | `D4-17` | 命令替换 `$(curl\|sh)` fail-open 未拦截 | `cloud-risk-rules.json` + `risk-rule-engine.mjs:143` | 历史缺陷 |
| 7 | P1 | `D2-10` | KooCLI 配置缺失错误消息中英文不一致 | `auth/reconcile.mjs:50` + `auth/guidance.mjs:71` | 历史缺陷 |
| 8 | P1 | `D3-S7` | 复合意图 Web+RDS 路由未命中部署目标 | `tools.mjs:1984,2223-2239` | 历史缺陷 |
| 9 | P1 | `EXP-E01` | "查云主机" 意图路由 MISS（未命中 ECS） | `tools.mjs:1984,2239` | 历史缺陷 |
| 10 | P2 | `D1-68` | region 优先级契约漂移（HW_REGION 覆盖 HUAWEICLOUD_REGION） | `auth/credentials.mjs:225 (173,339)` | SPEC，待裁决 |
| 11 | P2 | `D3-C14` | 沙箱 HDKit 无凭证错误消息中英文不一致 | `auth/guidance.mjs:55` + `auth/credentials.mjs:286` | 历史缺陷 |
| 12 | P2 | `D8-9` | 遥测 `sanitizeValue` 未脱敏凭证 | `telemetry/telemetry.mjs:189` | 历史缺陷 |

> **说明**：本日 12 项缺陷与 2026-10-15（同版本 1.1.9-next.0，gitHead 6302921c）完全一致，均为**历史已提单缺陷**（详见 `HISTORY_LINKS.md`），本轮为复核复现，不新开单。逐项根因/断言/证据见 `FINDINGS.md`。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链可用性（OS 列标注「Windows（升级检测）」专属），本机 Linux 不适用，Linux 侧由展开级 EXP-NR3 系列代表覆盖 |

### BLOCKED

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | 真机 ECS 生命周期 E2E 第一步 `hcloud VPC CreateVpc` 即返回 `VPC.0114 Quota exceeded for resources: ['router']`（共享账号 hw018619646 router 配额已耗尽，现存 5 个 VPC 均为历史/他客户端资源），VPC→子网→安全组→ECS 无法建删。已实测 VPC 创建真实返回配额错误（非 mock） | 清理既有 router / 提升 VPC router 配额 |
| `D3-S2` | 设计级 | P1 | BLOCKED | 补环境 | 场景「删 VPC 先确认」需先建 VPC 再验证 `plan_cli_command` 写操作审批，但 VPC 创建同 D3-C1 被 `VPC.0114` router 配额阻断，无法进入删 VPC 确认流。已实测项：`service_catalog` 对「删除这个 VPC」路由命中 VPC=true | router 配额恢复 |
| `D3-C6` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 7 隐式工具具名冒烟：`check_user`/`sign_agreement` 实测通过（realnameVerified=true, agreementSigned=true），但 `sandbox_connect` 调 hdkitservice-api 命中上游 HDKit 编排服务瞬时内部错误（`HDKIT_INTERNAL: 服务内部错误` / `HDKIT_UPSTREAM_ERROR: GET /open-api-public/v2/devenvs failed`），connect 之后 5 工具无法执行。同日 D3-C3 沙箱部署 E2E 的 connect/upload/deploy 通过，证明 devkit 调用链正常，为上游瞬时抖动 | 沙箱编排上游服务恢复 |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 跨区域 `ap-southeast-3` 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 `Common.0013`（region 与项目不符）、EIP 创建返回 `VPC.0501`，无法建删跨区资源。已实测通过项：`list_regions` 含 ap-southeast-3、`plan_cli_command` 含 `--cli-region=ap-southeast-3` | 账号开通 ap-southeast-3 项目/region 权限 |
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL） | 沙箱配额就绪且 devbridge 隧道可用后重测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（测试过程未向证据/日志写入真实 AK/SK；`redactSecrets` 实测对 `AK=AK123` 形态脱敏正常，超小写 `ak=` 形态的缺口已列为缺陷 #1）
- [x] 写操作误判 read-only：`0`（D4-5 write 误判检测 PASS，`DeleteVpc` 正确判定为写操作）
- [x] 红线（I 类）违规：`无`（本次未 mock 云资源、未跳过真云用例；真机执行建删归零）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针均用占位 `AK123/MyP@ss` 假值，无真实密钥）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS（D3-C2 静态站） | 是 | 已删 | `obs ls` 不含本次 bucket（`zero=true`） |
| OBS（D3-C13 静态网站托管） | 是 | 已删 | `finally` 中 `obs rm` 归零 |
| 沙箱会话（D3-C3 部署 E2E） | 是 | 已关闭 | `sandbox_close_session` 调用 |
| VPC/子网/安全组/ECS（D3-C1） | 否（首步被配额阻断） | — | `VPC ListVpcs` 无 testbot2-dsh 残留 |
| VPC（D3-S2） | 否（配额阻断） | — | 无残留 |
| EIP（D3-C7） | 否（区域无权限，未建） | — | `EIP ListPublicips` total=2（非本次，历史余额） |

> **真云资源盘点结论**：`VPC ListVpcs` 无 `testbot2-dsh-*` 残留、`ECS ListServersDetails` 无本次 ECS、`OBS ls` 无本次 bucket、`EIP ListPublicips` 无本次 EIP。本次真云用例建删归零，未触碰/删除既有或他人资源。

---

## 八、遗留与建议

- **待裁决 SPEC**：`D1-68` region 优先级（实现 `HW_REGION > HUAWEICLOUD_REGION`，用例契约期望相反）——需维护者裁决以哪一方为准。
- **历史缺陷（12 项）**：本轮 12 项 FAIL/SPEC 均为同版本历史已提单缺陷的复核复现（P0×5 / P1×4 / P2×3），安全类 P0（D2-4/D4-3/D4-16/D4-21/D9-12）建议优先修复。
- **环境阻塞（5 项 BLOCKED）**：D3-C1/D3-S2 因共享账号 router 配额耗尽、D3-C6 因沙箱上游瞬时错误、D3-C7 因账号无跨区项目、D3-S3 因 DevStation 配额——均属补环境，环境恢复后应补测，无需改用例。
- **建议**：维护 agent 补齐 D1-39「Windows 专属」在 Linux 侧的展开级代表覆盖，避免 Linux 侧 P0 依赖 NOT_RUN 豁免。