# Hermes-deepseek-v4.1-flash 每日测试报告
> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-11-02 05:11:02（北京时间）
> **执行归档**：`results/Hermes/2026-11-02-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.0`（npm，gitHead `47170d1f`） |
| 运行环境 | Node v22.13.0 / npm 10.9.2 / Linux aarch64 / 120.46.176.133 |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：`run_all.sh` 编排 43 批探针——源码直调（classify/hook/auth/protocol/extended/d1 安装域/updatecheck/disttags/merge/routing/supplement/new-*）；spawn `mcp-server.mjs` 驱动 MCP 协议（D5/D8/D9）；真云 E2E 建删资源（realcloud-probe 的 D2-1/D3-C4/D4-14/D4-18/19/20、D4-13 只读子账号、D4-23 mdc 注入、D3-C1~C7）。证据逐用例落 `evidence/<case-id>/stdout.txt`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 13 / 8 / 3 / 4` |
| 通过率（分母 = PASS+FAIL = 135） | `90.4%` |
| P0 / P1 / P2 新增缺陷 | `3 / 6 / 4` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本次创建真云资源已全部归零（ECS/VPC/subnet/OBS/EIP/EVS）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `80` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `8` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `safety-policy.mjs:550` env-dump 正则漏裸 `access_key` | 历史复核 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL 形态 broad IAM 制品 | `cloud-risk-rules.json:196` regex 未覆盖 HCL `actions=["*"]` / `AdministratorFullAccess` | 历史复核 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线两处缺口 | `mcp-protocol.mjs:34-42`（init 未调 runVersionCheck）/ `:61`（tools/list 无前置状态机） | 历史复核 |
| 4 | P1 | `D1-70` | D1安装 | 代理 WebSocket 路径崩溃（undici 依赖 node zstd API 缺失） | `proxy/proxy-agent.mjs:20-22` + bundled `undici@8.12.2 decompress.js:3/79` | 历史复核 |
| 5 | P1 | `D4-6` | D4安全 | `--admin-pass` 不告警 + flag/JSON 带引号 key 形态未脱敏 | `cloud-risk-rules.json:68`（规则缺 `command` 阶段）+ `safety-policy.mjs` redactSecrets 键名正则 | 历史复核 |
| 6 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open（默认放行） | `risk-rule-engine.mjs:106` evaluate 无规则命中默认 allow | 历史复核 |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务交付(Web应用+RDS) 复合意图部署目标未命中 + CreateInstance 缺前置 | `tools.mjs` serviceCatalog 部署目标匹配缺失 + RDS 参数装配（`Invalid parameter: db.password`） | 历史复核 |
| 8 | P1 | `D10-3` | D10评测 | serviceCatalog 中文「云主机」意图路由 MISS（准确率 92.9%） | `tools.mjs:2197` routeMap ECS 关键词缺「云主机」 | 历史复核 |
| 9 | P1 | `EXP-E01` | 展开-D10 | 同 D10-3 根因（「云主机」→ 预期 ECS，实际回退 help） | `tools.mjs:2197` | 历史复核 |
| 10 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单一服务 | `tools.mjs` serviceCatalog 单关键词并集路由，无复合拆解 | 历史复核 |
| 11 | P2 | `D3-S6` | D3功能 | FunctionGraph 定时任务创建失败（未生成 URN/触发器） | `tools.mjs` CreateFunction 参数装配缺口（`Invalid parameter: code.zip_file`） | 历史复核 |
| 12 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类为 cli:invoke | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组错（应 `\b`） | 历史复核 |
| 13 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（明文 secret 残留） | `risk-rule-engine.mjs:22` redactEvidence 正则未覆盖空格/JSON 引号 key 形态 | 历史复核 |
| 14 | P2 | `D8-9` | D8质量 | sanitizeValue 未做凭证脱敏（SPEC） | `telemetry/telemetry.mjs:190` 仅截断无脱敏 | 历史复核 |
| 15 | P2 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs` initialize capabilities 未含 cancellation | 历史复核 |
| 16 | P2 | `D10-4` | D10评测 | 风险规则库条目数漂移（19 vs 用例断言 16）（SPEC） | `safety/rules/cloud-risk-rules.json` 规则 16→19 条，用例断言未同步 | 历史复核 |

### 根因详情

> 每项 FAIL/SPEC 的「期望 / 实际 / 根因（文件:行号）/ 影响 / 证据」见同目录 `FINDINGS.md`（16 项，`file_issue.py` 解析输入）。15 项产品缺陷均在同 gitHead `47170d1f` 历史轮次已提，本轮为复核，明细见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | D8质量 | 中英文文档一致 | 【改用例】中英文文档一致需中英双源逐段比对，本轮未覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D2-10` | D2认证 | R7 current档跟随 | 【补环境】R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | D2认证 | R9 configuredBySession优先env | 【补环境】R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D3-C3` | D3功能 | 沙箱部署E2E | 【补环境】沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化），sandbox_connect/deploy_nginx 全链路不可达；解除条件=华为云沙箱维护完成 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 【补环境】沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE），check_user/connect/credentials/exec_one_shot/close_session 7 隐式工具均不可用；解除条件=华为云沙箱维护完成 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 【补环境】沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE），check_user 无法返回 realnameVerified/agreementSigned，沙箱预览 URL 场景不可验证；解除条件=华为云沙箱维护完成 |
| `D4-12` | D4安全 | 供应链安装期安全 | 【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | 【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。本轮 AK/SK/adminPass 均未明文落盘；D4-26/D4-6/D8-9 为「产品未脱敏」缺陷（属被测缺陷，非测试侧泄漏）。
- [x] 写操作误判 read-only：无。D4-14/D4-18/19/20 写操作 plan 均正确 `deny`/`confirm`，D4-13 只读子账号写操作 IAM 拒绝（writeDenied=true）。
- [x] 红线（I 类）违规：无。
- [x] 脱敏复核：`credentialPanel`/`auth_status`/`redactSecrets`/`redactOutput` 均验证通过；D2-4 证据 stdout 已避免回显明文 AK/SK（黑盒脱敏探针输出为 `<redacted>`）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1，testbot3-hermes-ecs-3566980438） | ✓ ff6ac4d1-… | ✓ DeleteServers | ✓ ListServersDetails 无本次实例（仅他方 tctest-*） |
| VPC（D3-C1，testbot3-hermes-e2e-3566980438） | ✓ 6764bd4a-… | ✓ DeleteVpc | ✓ ListVpcs 无本次资源 |
| subnet（D3-C1，…-subnet） | ✓ 295f1920-… | ✓ DeleteSubnet | ✓ ListSubnets 无本次子网 |
| EVS 云硬盘（随 D3-C1 ECS） | ✓ | ✓ 随实例释放 | ✓ ListVolumes 无本次卷（仅 tctest-*） |
| OBS（D3-C2，testbot3-hermes-obs-3567143218） | ✓ | ✓ rm -f 删桶 | ✓ `Delete bucket ... successfully!` |
| EIP（D3-C7，跨区域 ap-southeast-1） | ✓ | ✓ DeletePublicip | ✓ `ListEips 无本次id`（无残留） |

> 注 1：D3-C1 探针内 auto-zero 轮询（`scripts/realcloud_e2e.mjs:111-119`，150s）超时未确认 ECS 异步删除，测后已手工删除并只读 inventory 复核归零，见 `evidence/D3-C1/cleanup-verify.txt`（属探针轮询窗口偏短的 harness 观察，非产品缺陷）。
> 注 2：真云沙箱用例（D3-C3/D3-C6/D3-S3）因 `HDKIT_SANDBOX_MAINTENANCE` 服务维护中未创建任何资源，无残留；全部真云写操作按名称前缀白名单只删本次创建资源。
> 注 3：云端现存 `testbot3-hermes-e2e-3308444841-subnet`（2026-10-29 创建，父 VPC 已不存在，无 vpc_id 无法 API 删除）为历史孤儿，非本次创建；`tctest-*` 属他方资源，均未动。

---

## 八、遗留与建议

- 3 项 SPEC-MISMATCH（D8-9/D9-9/D10-4）需维护者裁决用例母版是否同步（D9-9 cancellation 声明、D8-9 sanitizeValue 脱敏、D10-4 规则库 16→19 条断言）。
- 15 项产品缺陷与同 gitHead `47170d1f` 历史轮次一致（无修复、无新回归），`file_issue.py` 查重后命中上游历史合并单，本轮不重复开单，明细见 `HISTORY_LINKS.md`。
- 建议 devkit 将 bundled undici 与 zstd-capable node 门槛对齐（或 Node>=22.15 引擎下限 / proxy-agent 增加 zstd 缺失降级路径），消除 D1-70 在 22.13 等较老 22.x 上的代理 WebSocket 崩溃。
- 沙箱用例（D3-C3/D3-C6/D3-S3）待华为云沙箱维护完成后补测解除 BLOCKED。
- 工具侧建议：`scripts/realcloud_e2e.mjs` 归零轮询窗口 150s 对 ECS 异步删除偏短，建议延长或改为「提交删除即返回 + 独立归零复核」，避免真云 E2E 每轮遗留资源。
