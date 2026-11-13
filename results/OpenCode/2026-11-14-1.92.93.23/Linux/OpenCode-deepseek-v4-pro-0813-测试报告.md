# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-11-14 13:20:00`（北京时间）
> **执行归档**：`results/OpenCode/2026-11-14-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL/SPEC 缺陷：P0 5 项 / P1 4 项 / P2 2 项，其中 SPEC-MISMATCH 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux x86_64`（非 TTY，bash） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.14-next.5`（npm @next，hdk checkout `4fb59d76`，src/**/*.mjs） |
| 工具全集 | `47`（`tools.mjs` TOOL_DEFINITIONS 注册源数量） |
| hcloud / 依赖 | `KooCLI`（cn-north-4 已认证；auth 三端可用） |
| 真云凭证 | `cn-north-4`（AK/SK 管理账号 + test001 只读子账号，均就绪） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议（stdio）/ 真云 E2E（建删资源归零）/ 沙箱 E2E / D10 评测路由 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针框架 `_probe/main.mjs`（复用 v1.1.14-next.x 源码级探针，直调 `hdk/plugins/huaweicloud-core/src/*.mjs` 导出函数）+ 4 个 checks 文件，146 条用例全部落盘；证据统一按 `evidence/<case-id>/`（probe.mjs + stdout.log）组织。真云 E2E 用 `hcloud` CLI 真机建删资源并归零验证；MCP 协议用例 spawn 真实 `mcp-server.mjs`（stdio）；D10 路由层用 `serviceCatalog` 逐条实测；沙箱 E2E 走真实 connect→upload→deploy。每 10 分钟后台 `hourly_sync.py` 增量提报已随建包后立即拉起。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（1 条 Windows 专属用例在 Linux 标 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 10 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC = 143，不含 BLOCKED/NOT_RUN） | `92.3%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 2`（含 SPEC-MISMATCH 1：D1-68） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/子网/安全组、OBS 桶均建后删并归零验证；沙箱会话已 close） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单（D2-4/D3-S3/D3-S7/D4-3/D4-16/D4-17/D4-21/D8-9/D9-12） |
| BLOCKED | `2` | 环境阻塞（D3-C1 billing 拒绝、D3-C7 跨区域权限），见 §五 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级相反） |
| NOT_RUN | `1` | D1-39 Windows 专属用例，本机 Linux 不适用 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01「云主机」路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏漏小写 ak=/sk= | `ak=/sk=` 形态返回 `<redacted>` | 明文字段残留 | `safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | KMS DecryptData 明文 secret API 未拦截 | `kms DecryptData` 返回 `deny` | 返回 `allow` | `safety/rules/cloud-risk-rules.json:56` | 待提单 |
| 3 | P0 | `D4-16` | 命令包裹穿透（sh -c 内层 env 泄露） | `sh -c "env \| grep HUAWEICLOUD_…"` 返回 `deny` | 返回 `allow` | `safety/rules/cloud-risk-rules.json:35` | 待提单 |
| 4 | P0 | `D4-21` | HCL/Terraform IAM 制品未拦截 | HCL `actions=["*"]` 返回 `deny` | 返回 `allow`（JSON 正常 deny） | `safety/rules/cloud-risk-rules.json:209,213` | 待提单 |
| 5 | P0 | `D9-12` | initialize 握手未 enforce 时序 | 未 init 先 tools/list 返回 `-32600` | 返回工具列表（40 工具） | `mcp-protocol.mjs:70-72` | 待提单 |
| 6 | P1 | `D3-S3` | 沙箱预览 URL 未完成（nginx 403 + 隧道无 live host） | `tunnel_url_accessible=true` `complete=true` | `complete=false`（nginx HTTP 403） | `sandbox/session-manager.mjs:1160-1167` | 待提单 |
| 7 | P1 | `D4-17` | 模糊输入 fail-closed 失效 | `$(curl …)` 返回 `deny`/`warn` | 返回 `allow`（fail-open） | `risk-rule-engine.mjs:106` | 待提单 |
| 8 | P1 | `EXP-E01` | 「云主机」意图未路由 ECS | 命中 `ECS` | fallback `Run hcloud --help` | `tools.mjs:2362-2374` | 待提单 |
| 9 | P1 | `D3-S7` | 复合意图「部署+RDS」漏路由部署侧 | 命中 RDS + 部署目标 | 仅命中 `RDS` | `tools.mjs:2536,2541-2555` | 待提单 |
| 10 | P2 | `D8-9` | 遥测 sanitizeValue 未脱敏 | 凭证值 `<redacted>` | 明文残留 | `telemetry/telemetry.mjs:190-196` | 待提单 |
| 11 | P2 | `D1-68` | region 优先级契约漂移（SPEC-MISMATCH） | `HUAWEICLOUD_REGION` 优先 | `HW_REGION` 优先 | `auth/credentials.mjs:225` | 待裁决 |

> 缺陷完整字段（现象/断言/根因/证据）见 `FINDINGS.md`；D2-10、D3-C14 两例最初因夹具断言过期报 FAIL，经按 #900 错误契约修正断言后重测转 PASS（详见 `FINDINGS.md #12【测试侧】`），不计入产品缺陷。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | 真云 ECS 生命周期已实测 VPC/子网/安全组创建→删除→归零全部成功；ECS `CreateServers` 至订单提交层被 billing 拒绝 `Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建） | 补环境：账号开通 ECS 购买产品/开启按需计费后复测 |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 跨区域 `ap-southeast-3` 不在账号项目范围（project 仅 cn-north-4）：ECS 只读返回 `Common.0013`（region 与 tk 项目不符）。已实测通过项：`list_regions` 含 ap-southeast-3、`plan_cli_command` 含 `--cli-region` | 补环境：账号开通 ap-southeast-3 项目/region 权限后复测 |
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属升级检测链用例（OS 列标注「专属」），本机 Linux 不适用，Linux 侧由展开级 `EXP-NR3` 系列代表覆盖 | 无需改（OS 专属，Linux 侧已有展开级覆盖） |

> D2-10、D3-C14 两例的夹具断言过期（改为 PASS，不计 BLOCKED）说明见 `FINDINGS.md #12`，属测试侧夹具维护，建议维护 agent 更新 `eval/harness/fixtures/` 两夹具的英文消息断言。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 写操作未误判只读、D4-4 写操作审批门均 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云凭证仅经 `~/.config/huaweicloud/credentials.json` 注入，未落盘证据）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（提交至订单层被拒，未成形） | 未成形退单 / VPC子网安全组已删 | 归零 |
| VPC/子网/安全组（D3-C1、D3-S2） | 是 | 已删 | 归零（ListVpcs 无残留） |
| OBS 桶（D3-C2、D3-C13） | 是 | 已删（rm -f） | 归零（ls 无残留） |
| 跨区 EIP（D3-C7） | 否（无权限） | — | — |
| 沙箱会话（D3-C3、D3-C6、D3-S3） | 是 | close_session / 会话 close | 已关闭 |

> 真云只删本次创建资源；上线前盘点+白名单，禁删既有/他人资源（D3-C1 检测到现网 4 个非本次创建 VPC 未触碰）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级 HW_REGION vs HUAWEICLOUD_REGION，需维护者确认契约方向）。
- 测试侧夹具维护：`eval/harness/fixtures/d2-10-koocli-profile.mjs:83`、`d3-c14-sandbox-hwlink-cred.mjs:140` 断言过期（#900 错误契约本地化），建议更新为校验错误码/本地化消息（详见 `FINDINGS.md #12`）。
- 本轮未覆盖（说明范围）：D1-39 Windows 升级检测链（OS 专属）；D10 真实 Agent 会话评测（非 DSH 客户端，需 CDP 会话自动化环境，本客户端不适用）。
- 建议：v1.1.14-next.5 中安全规则（D4-3/16/17/21）与区由 v2 引入的部分修复（D2-4 小写脱敏、D4-3 KMS、D1-68 契约）在当前 1.1.x 分支上仍存在，建议维护者评估从 v2 回迁相关修复。