# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-27 05:30（北京时间）
> **执行归档**：`results/DSH/2026-10-27-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷 P0 5 项 / P1 4 项 / P2 3 项，均为历史复现，本次不重复开单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（Ubuntu 24.04.4 LTS，aarch64） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.12`（npm latest，gitHead `4ed07801`） |
| 工具全集 | `46`（tools.mjs TOOL_DEFINITIONS，DSH 注册源） |
| hcloud / 依赖 | KooCLI 7.2.12（AKSK，region cn-north-4） |
| 真云凭证 | cn-north-4（AKSK 管理员 + 只读子账号 test001） |
| 测试类型 | 源码级探针直调 / MCP 工具真机 / 真云 E2E（建删归零）/ 协议 / 评测集路由层 |
| daily 基础用例 | 设计级 107 / 展开级 39（已按 DSH+Linux 预筛） |

> **执行方法**：`_probe/main.mjs` 统一入口，逐用例 `runOne(id)` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 / MCP 工具 / hcloud 真机 CLI；结果落 `evidence/<case-id>/stdout.log`，`backfill_daily.py` 批量回填 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（唯一 NOT_RUN = D1-39 Windows 专属，OS 豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 11 / 5 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `92.1%` |
| P0 / P1 / P2 新增缺陷（FINDINGS 12 项） | `5 / 4 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | 全部归零（真云建删资源均已删除并验证） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞，见未执行清单 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（12 项，均为历史复现）

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | sh -c 命令包裹穿透（凭证 env 打印绕过） | `safety/rules/cloud-risk-rules.json` env-dump 正则不匹配引号包裹；`risk-rule-engine.mjs:106` 兜底 allow | 历史复现（#896 等） |
| 2 | P0 | `D4-3` | D4安全 | kms DecryptData 明文 secret API 未拦截 | `cloud-risk-rules.json` secret-value-read 正则漏 DecryptData | 历史复现 |
| 3 | P0 | `D4-21` | D4安全 | HCL/Terraform broad IAM 制品未拦截 | `cloud-risk-rules.json` iam-admin-policy 仅覆盖 JSON 语法 | 历史复现 |
| 4 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | `safety-policy.mjs:45` (AK\|SK) 正则缺 `i` 标志 | 历史复现 |
| 5 | P0 | `D9-12` | D9协议 | MCP 协议非法时序未拒绝 | `mcp-protocol.mjs:57-58` tools/list 无 initialize 前置校验 | 历史复现 |
| 6 | P1 | `D4-17` | D4安全 | 命令替换 $(...) 未 fail-closed | `risk-rule-engine.mjs:106` 默认 allow；rules 无命令替换规则 | 历史复现 |
| 7 | P1 | `D3-S7` | D3功能 | 复合意图路由丢部署目标 | `tools.mjs:2188` serviceCatalog 复合匹配未并集部署服务 | 历史复现 |
| 8 | P1 | `D2-10` | D2认证 | KooCLI 缺失配置报错文案不符合契约 | `auth/reconcile.mjs:50` + `auth/guidance.mjs:71` 中文模板拼接 | 历史复现 |
| 9 | P1 | `EXP-E01` | 展开级 | 服务目录路由 MISS（「云主机」未命中 ECS） | `tools.mjs:2188-2443` 关键词表缺「云主机」；`tools.mjs:2443` 兜底 --help | 历史复现 |
| 10 | P2 | `D8-9` | D8质量 | telemetry sanitizeValue 未脱敏凭证 | `telemetry/telemetry.mjs:189-197` 未接 redactSecrets | 历史复现 |
| 11 | P2 | `D3-C14` | D3功能 | 沙箱无凭证报错文案不符合契约 | `auth/service.mjs:134` / `auth/guidance.mjs:55` 返回中文而非英文契约码 | 历史复现 |
| 12 | P2 | `D1-68` | D1安装 | region 读取优先级契约漂移（SPEC-MISMATCH） | `auth/credentials.mjs:225` HW_REGION 优先于 HUAWEICLOUD_REGION | 历史复现 |

> 逐项「现象/断言/根因/证据」详见同目录 `FINDINGS.md`（严格格式，`file_issue.py` 解析输入）。
> 缺陷与昨日（2026-10-26）完全一致，经 `file_issue.py` 历史查重命中上游 open issues，本次**不重复开单**，关联清单见同目录 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链 | Windows 专属用例（OS 列标注「专属」），本机 Linux，OS 豁免（分类=调归属，Linux 侧由展开级代表覆盖） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因（分类=补环境） |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS 生命周期 E2E | 真机实测：VPC/子网/安全组创建→删除→归零成功；ECS CreateServers 被 billing 拒绝 `Ecs.0707 "Can not find product"`（账号 BSS 无该镜像产品映射/按需订单无法创建）。解除：账号开通 ECS 购买产品/按需计费 |
| `D3-C3` | D3功能 | 沙箱部署 E2E | 沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE），connect 即返回「沙箱功能正在升级优化，暂时无法使用」。解除：沙箱服务维护结束恢复 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具冒烟 | 沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE），7 个隐式工具均无法执行。解除：沙箱服务维护结束恢复 |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 真机实测：region 枚举含 ap-southeast-3 + plan 含 --cli-region 均通过；账号 project 仅 cn-north-4，ECS 跨区只读 Common.0013、EIP 创建 VPC.0501。解除：账号开通 ap-southeast-3 项目/region |
| `D3-S3` | D3功能 | 沙箱预览 URL | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL）。解除：沙箱配额就绪且 devbridge 隧道可用 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始 AK/SK，脱敏复核通过）
- [x] 写操作误判 read-only：`0`（D4-5 写命令未误判只读 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：evidence 内 stdout.log/detail.log 无明文凭证（D4-26/27 脱敏 PASS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 静态站（D3-C2/D3-C13） | 是 | `OBS rm -r -f` | `OBS ls` 不含本次桶，归零 |
| VPC/子网/安全组（D3-C1/D3-S2） | 是 | `DeleteVpc/Subnet/SecurityGroup` | ECS 被 billing 拒绝后 finally cleanup 删除，归零 |
| ECS（D3-C1） | 否（billing 拒绝未创建） | — | 无实例残留 |
| 跨区域 EIP（D3-C7） | 否（region 不符未创建） | — | 无 EIP 残留 |
| 沙箱（D3-C3/D3-C6/D3-S3） | 否（服务维护未连接） | — | 无持久云资源残留 |

> 真云只删本次创建资源（命名前缀 `testbot2-dsh-*` / `tctest-dsh-*`），执行后已逐一 `List` 验证归零（VPC/ECS/EIP/OBS 均无本次前缀残留）；不触碰既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级 HUAWEICLOUD_REGION vs HW_REGION，需维护者确认契约方向）
- 缺陷与昨日（2026-10-26）完全一致，均为历史复现（经 file_issue.py 查重命中上游 open issues，本次不重复开单，见 HISTORY_LINKS.md）
- 环境变化：沙箱服务自今日进入维护（HDKIT_SANDBOX_MAINTENANCE），D3-C3/D3-C6 由昨日的 PASS 转为 BLOCKED（补环境，非产品缺陷）
- 建议：补齐 `cloud-risk-rules.json` 的 shell-wrapper / 命令替换 / kms DecryptData / HCL 制品规则覆盖；修复 `safety-policy.mjs:45` 脱敏大小写；`telemetry sanitizeValue` 接入 redactSecrets