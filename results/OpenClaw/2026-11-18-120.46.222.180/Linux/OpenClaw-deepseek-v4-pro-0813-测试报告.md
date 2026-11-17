# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-18 05:29:56（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-18-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.15-next.1`（源仓 commit `df6bea57`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（`_probe/checks1-6.mjs` + `core.mjs` + `main.mjs`）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；MCP 协议类通过自起 `mcp-server.mjs` 走 JSON-RPC 帧；真云 E2E（ECS/OBS/沙箱/凭证）真机执行（建删归零）；D10 评测走 serviceCatalog 路由层。证据统一落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 10 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 142） | `92.3%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 1` |
| 红线（I 类）违规 | `0`（P0 缺陷为产品侧 hook 缺口，测试过程未 mock、未虚标 PASS、未泄露明文凭证） |
| 资源释放 | `全部归零`（ECS/VPC/子网/安全组/OBS 建删后验证归零；D3-C1 因 billing 配额未建成 ECS，VPC/子网/SG 已删并归零） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行（OS 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） |
|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` 正则无 `i` 标志 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety/policy.json` 缺 KMS DecryptData |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs:415` 未覆盖包裹内层管道 |
| 4 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归 | `cloud-risk-rules.json` 不匹配 HCL |
| 5 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-server.mjs:187-208` 无会话状态闸门 |
| 6 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `risk-rule-engine.mjs:106` 无规则命中即 allow |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务交付并归零 | `tools.mjs` sandbox keywords 缺「部署/Web应用」 |
| 8 | P1 | `D3-S3` | D3功能 | 沙箱预览出URL | 沙箱 devbridge 隧道层 403（环境性） |
| 9 | P1 | `EXP-E01` | D10评测 | serviceCatalog「云主机」路由 MISS | `tools.mjs:2370` ECS keywords 缺「云主机」 |
| 10 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry.mjs:190` sanitizeValue 无脱敏 |
| 11 | P2 | `D1-68` | D1安装 | 图标离线与区域环境变量 | `credentials.mjs:225` 顺序与契约相反 |

> **提单状态**：见 `FINDINGS.md`，统一经 `file_issue.py` 查重后提单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），本机 Linux，由展开级代表段覆盖（NOT_RUN 仅限 OS 专属例外，符合 P0 铁律） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"。已实测 VPC/子网/安全组创建→删除→归零全部成功。解除条件：账号开通 ECS 购买产品/按需计费（补环境·billing 产品配额） |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | ap-southeast-3 不在账号项目范围（仅 cn-north-4），ECS 只读返回 Common.0013。已实测 list_regions/plan_cli_command 区域维度通过。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多region权限） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无**。真云凭证走 `~/.config/huaweicloud/credentials.json`（0600），探针只读、不回显明文；AK/SK 未进入任何日志/会话/证据。
- [x] 写操作误判只读：**无**。D4-5/D4-18/D4-20 实测 `plan_cli_command` 正确判定写操作并走审批门。
- [x] 红线（I 类）违规：**0**。发现的 P0 缺陷为产品侧安全 hook 缺口，测试过程未 mock、未虚标 PASS。
- [x] 脱敏复核：`D2-4` 实测确认小写 `ak=/sk=` 脱敏缺口（已记缺陷）；大写键脱敏正常。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 静态站（D3-C2） | 桶 `testbot2-opencode-obs-*` | `OBS rm -r -f` | `OBS ls` 不含该桶 ✓ |
| OBS 静态网站（D3-C13） | 桶（set/get 后） | `OBS rm -f` | ✓ 归零 |
| VPC+子网+安全组（D3-S2） | CreateVpc/CreateSubnet/CreateSecurityGroup | DeleteVpc/DeleteSubnet/DeleteSecurityGroup | ListVpcs 不含 ✓ |
| ECS 生命周期（D3-C1） | VPC/子网/SG 建成功，ECS 未建成（billing 配额） | 已删 VPC/子网/SG | ListVpcs/Servers 归零 ✓ |
| 沙箱部署（D3-C3/D3-C6/D3-S3） | 上传临时站点 | nginx/close_session | 沙箱侧临时文件已清 ✓ |
| 跨区域（D3-C7） | 未建成（无 region 权限） | — | 无残留 ✓ |

> 真云用例均「最低配置创建 → 测后删除 → 只删本次创建资源」，无泄漏残留。

---

## 八、遗留与建议

- **11 项缺陷与昨日一致**（v1.1.15-next.1 未引入新回归，均已在源码仓有历史单），建议维护方跟踪既有单闭环。
- **D3-C14（测试侧修正）**：昨日探针误用 `hdkitCredentials({})`（绕参数守卫触发网络）+ 非契约网络断言；今日按 test-cases 契约四断言确定性直调，4 断言全 PASS，SUT 无需改动。
- **D3-C1/D3-C7（BLOCKED）**：真实账号配额/权限阻塞（billing 产品未开通 / ap-southeast-3 无项目权限），建议维护方协调账号侧开放后复测。
- **环境侧注意**：探针需用 `~/nodejs/bin/node`（v22.23.5）跑（`/usr/bin/node` v24 亦可）；共享 `~/.config/huaweicloud/proxy.json` 若被历史写入占位会阻断出网，已中和还原。