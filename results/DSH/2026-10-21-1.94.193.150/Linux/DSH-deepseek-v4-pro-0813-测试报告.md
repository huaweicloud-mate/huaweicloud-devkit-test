# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-21 05:30（北京时间）
> **执行归档**：`results/DSH/2026-10-21-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（12 项缺陷均为历史问题，无新增；P0 缺陷 5 项，全部历史已提单，本轮不重复开单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（linux/arm64） |
| 被测版本（SUT） | `v1.1.10`（gitHead `b0e9f02643110804fc8eef6377dcad99b39960cc`） |
| daily 基础用例 | 设计级 107（P0 21 / P1 56 / P2 30）+ 展开级 39（预筛剔除 27 条非 DSH/Linux） |
| 使命清单 | `mission-001`（P0，safety-model，9 条受影响用例） |

> **执行方法**：源码级直调（import `hdk` 源模块断言契约）+ MCP 真机（stdio JSON-RPC）+ 真云 E2E（hcloud KooCLI 真实建删资源归零）+ eval harness（D10 路由/协议 fixture）。探针统一委托 `_probe/main.mjs` 的 `runOne(caseId)`，真实执行逻辑落 `_probe/checks1-4.mjs`，证据落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 1 为 Windows 专属豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 11 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `92.2%` |
| P0 / P1 / P2 缺陷 | `5 / 4 / 3`（合 12 项，均历史） |
| 红线（I 类）违规 | `5 项 P0`（D2-4 / D4-3 / D4-16 / D4-21 / D9-12，均历史缺陷） |
| 资源释放 | `真云建删归零完成（含 D3-C2 首轮递归 rm 泄漏桶已手动归零）` |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 真云环境/配额阻塞（D3-C1/D3-C7/D3-S3） |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | D1-39 Windows 专属（Linux 豁免） |
| **合计** | **`107`** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 含 22 服务矩阵（EXP-C4-01~22）全过 + D10 路由 13 命中 |
| FAIL | `1` | EXP-E01「查云主机」路由 MISS（历史） |
| **合计** | **`39`** | |

---

## 四、缺陷清单

> 12 项缺陷（11 FAIL + 1 SPEC-MISMATCH）经历史查重均命中上游仓 `huaweicloud/huaweicloud-devkit` 既有 open issue，本轮**不重复开单**，详见 `FINDINGS.md` 与 `HISTORY_LINKS.md`。所有 FAIL 均已记录唯一判定断言 + 根因（文件:行号，v1.1.10 源码定位）。

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | safety-policy.mjs:45 | 历史 |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截缺 kms DecryptData | safety/rules/cloud-risk-rules.json:56 | 历史 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透（sh -c）未拦截 | safety/rules/cloud-risk-rules.json:26 | 历史 |
| 4 | P0 | `D4-21` | D4安全 | HCL/Terraform 宽权限 IAM 制品未拦截 | safety/rules/cloud-risk-rules.json:196 | 历史 |
| 5 | P0 | `D9-12` | D9协议 | 未 initialize 先 tools/list 未拒绝 | mcp-protocol.mjs:57 | 历史 |
| 6 | P1 | `D2-10` | D2认证 | KooCLI 配置缺失错误消息中英文不一致 | auth/reconcile.mjs:50 | 历史 |
| 7 | P1 | `D3-S7` | D3功能 | 复合意图 Web+RDS 路由未命中部署目标 | tools.mjs:2023 | 历史 |
| 8 | P1 | `D4-17` | D4安全 | 命令替换 $(curl\|sh) fail-open | risk-rule-engine.mjs:143 | 历史 |
| 9 | P1 | `EXP-E01` | D10评测 | 「查云主机」意图路由 MISS | tools.mjs:2023 | 历史 |
| 10 | P2 | `D1-68` | D1安装 | region 优先级契约漂移 | auth/credentials.mjs:173,225,339 | SPEC 历史 |
| 11 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 无凭证错误消息中英文不一致 | auth/guidance.mjs:55 | 历史 |
| 12 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 未脱敏凭证 | telemetry/telemetry.mjs:189 | 历史 |

> 根因详情与证据路径见 `FINDINGS.md`。与前日（2026-10-20，v1.1.9）对比：12 项缺陷**全部复现**，v1.1.10 未修复其中任何一项，亦无新增产品缺陷（D3-C2 / D4-24 两例首轮 FAIL 经复核为沙箱文件写权限阻塞所致的环境假象，非产品缺陷，已复测 PASS，详见 §七）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 列标注「Windows（专属）」，本机 Linux 不适用；Linux 侧由展开级 EXP-NR3 代表覆盖 | 调归属（OS 专属） |

### BLOCKED（真云，均真机实测到阻塞层，blockedReason 含四要素）

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS 生命周期 E2E | 真机 VPC/子网/安全组创建→删除→归零全部成功；ECS 订单提交被 billing 拒绝 `Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。解除条件：账号开通 ECS 购买产品/开启按需计费（补环境·billing 产品配额） |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 真机实测 list_regions 含 ap-southeast-3、plan 命令含 `--cli-region`；但账号 project 仅 cn-north-4，跨区域只读 ECS 返回 `Common.0013`（region 与项目不符）。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多 region 权限） |
| `D3-S3` | D3功能 | 场景-沙箱预览出 URL | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL）。解除条件：沙箱配额就绪且 devbridge 隧道可用后重测（补环境·沙箱配额） |

> BLOCKED 补测收尾：3 项 BLOCKED 均为真·外部依赖（billing 产品目录 / 多 region 权限 / 沙箱配额），非假阻塞。D4-24、D2-13 等「疑似缺环境」项均已源码级直调/夹具实测通过（见 §七复核）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`5 项 P0 安全脱敏缺陷（D2-4/D4-3/D4-16/D4-21/D9-12）均历史且已提单，今日复现，无新增泄漏面`
- [x] 写操作误判 read-only：`无（D4-5 写操作未误判，D4-4/18/19/20 审批门/预检/拒绝零操作均 PASS）`
- [x] 红线（I 类）违规：`同上 5 项 P0，均历史缺陷，不重复开单`
- [x] 脱敏复核：`D4-6 adminPass / D4-26 findings.evidence / D4-27 双路径 / D4-2 env dump / D4-13 只读子账号 均 PASS；D2-4 小写 ak=/sk= 仍漏（历史）`
- [x] 真云只删本次创建：`D3-S2 / D3-C13 / D3-C2 建删均归零；未触碰他人泄漏资源（如 testbot3-hermes-e2e-* VPC / 其他 hdk-* OBS 桶）`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2） | `CreateVpc`（10.1.0.0/16） | `DeleteVpc` | `ListVpcs` 无该名称 ✓ |
| OBS 桶（D3-C13） | `OBS mb` | `OBS rm -f` | `OBS ls` 无该桶 ✓ |
| OBS 桶 + 静态站（D3-C2） | `OBS mb` + `cp index.html` + curl `200` | 单对象删除 + 空桶删除 | `OBS ls` 无该桶 ✓ |
| VPC/子网/安全组（D3-C1） | `CreateVpc/CreateSubnet/CreateSecurityGroup` | 逐一删除 | 已归零 ✓（ECS 订单提交被 billing 拒绝，无 ECS 创建） |
| EIP/跨区域（D3-C7） | 未创建（只读被 region 拒绝） | — | 无语残留 ✓ |
| 沙箱（D3-S3） | 未创建（配额阻塞） | — | 无残留 ✓ |

> **环境假象复核（重要）**：本沙箱 `~/devkit-test`、`~/.config/huaweicloud`、`~/.obsutil_output` 等目录对非会话写入只读，导致首轮 `D3-C2`（obsutil 递归 `rm -r` 需写 `~/.obsutil_output/rm_*_report` 被拒）与 `D4-24`（审批令牌持久化到 `~/.config/huaweicloud/approvals.json` 被拒）误判 FAIL。经复核：① `D3-C2` 分两段（删除对象→删除空桶）复测全链路 `mb/cp/curl=200/del/zero` 通过，且首轮泄漏桶 `testbot2-dsh-obs-2530803375` 已手动删除归零；② `D4-24` 用可写 `HUAWEICLOUD_HOME` 复测令牌单次消费语义 `create→consume#1=ok→consume#2=null→inspect=already_consumed` 通过。二者均非产品缺陷，最终判 PASS。

---

## 八、遗留与建议

- **待裁决 SPEC**：D1-68（HUAWEICLOUD_REGION vs HW_REGION 优先级契约），已在历史单挂起。
- **安全修复优先级建议**：5 项 P0 脱敏/拦截缺口（D2-4/D4-3/D4-16/D4-21/D9-12）为 I 类安全风险，建议下版本优先修复（涉及 `safety-policy.mjs` 大小写正则、`cloud-risk-rules.json` 补 KMS DecryptData / HCL broad IAM / shell-wrapper 解包、`mcp-protocol.mjs` initialize 状态门）。
- **错误消息契约统一**：D2-10 / D3-C14 中英混合消息建议统一 i18n（英文 token 兜底），服务可判定自动化。
- **覆盖率**：P0 全测（唯一 NOT_RUN 为 Windows 专属豁免），NOT_RUN+空占比 0%，无覆盖缺口。
- **沙箱环境提示**：本次在 workspace-write 沙箱下执行，`hcloud/obsutil` 部分非会话目录只读，已通过「两段式 rm + 可写 HUAWEICLOUD_HOME」规避，不影响真云建删归零结论。
