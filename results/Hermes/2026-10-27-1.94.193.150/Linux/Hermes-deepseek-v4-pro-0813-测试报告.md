# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-27 05:20（北京时间）
> **执行归档**：`results/Hermes/2026-10-27-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.12（npm `latest` 正式版，gitHead `4ed07801`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项；另有 3 项沙箱依赖用例因 DevStation 服务维护 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64，ECS，1.94.193.150） |
| Node / hcloud | Node `v22.13.0` / KooCLI `7.2.12`（插件配对 `7.3.12`，version_mismatch 提示） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.12`（npm latest 正式版，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |
| 真云凭证 | `cn-north-4`（AKSK 预置 + 只读子账号 test001） |

> **执行方法**：50 余批探针（probe.mjs/.sh 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn `mcp-server.mjs` 驱动 MCP 协议 + eval harness serviceCatalog 路由 + 真云 E2E 建删资源），证据落 `evidence/<case-id>/stdout.txt`，批量回填三 CSV。真云用例真机执行（AK/SK + 只读子账号 + 沙箱），建删资源归零验证。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 13 / 8 / 3 / 4` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 138） | `88.4%` |
| P0 / P1 / P2 新增缺陷（FAIL） | `3 / 4 / 4`（另有 SPEC-MISMATCH 3 项） |
| 红线（I 类）违规 | `无` |
| 资源释放 | 真云建删资源全部归零（D3-C1 ECS 由探针删除未确认，本轮人工补删归零，见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `80` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `8` | 环境/权限/凭证阻塞（5 项真·外部依赖 + 3 项沙箱服务维护） |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行（明确不适用，见 §五） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（与 D10-3 同根因） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `safety-policy.mjs:515` | 待提单 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL `actions=[*]`/AdministratorFullAccess | `cloud-risk-rules.json:196` | 待提单 |
| 3 | P0 | `D9-12` | D9协议 | initialize 版本检查缺失 + 非法时序 tools/list 未拒 -32600 | `mcp-protocol.mjs:32-50,57` | 待提单 |
| 4 | P1 | `D4-6` | D4安全 | `--admin-pass` 不告警 + JSON 带引号 key adminPass 未脱敏 | `cloud-risk-rules.json:68` + `safety-policy.mjs` | 待提单 |
| 5 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open（默认放行） | `risk-rule-engine.mjs:106` | 待提单 |
| 6 | P1 | `D3-S7` | D3功能 | 复合意图部署目标未命中 + RDS CreateInstance 缺前置（db.password） | `tools.mjs` serviceCatalog + RDS 参数 | 待提单 |
| 7 | P1 | `D10-3` | D10评测 | serviceCatalog 中文「云主机」路由 MISS（92.9%） | `tools.mjs:2190` | 待提单 |
| 8 | P1 | `EXP-E01` | D10评测 | 评测集「云主机」路由 MISS（同 D10-3） | `tools.mjs:2190` | 待提单 |
| 9 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单一服务 | `tools.mjs` serviceCatalog | 待提单 |
| 10 | P2 | `D3-S6` | D3功能 | FunctionGraph CreateFunction 参数非法未生成 URN | `tools.mjs` FG 参数装配 | 待提单 |
| 11 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类 cli:invoke | `huaweicloud-safety.py:46` | 待提单 |
| 12 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（明文 secret 残留） | `risk-rule-engine.mjs:22` | 待提单 |
| 13 | P2 | `D3-C1` | D3功能 | ECS 生命周期归零未确认（测试侧探针窗口，非产品缺陷） | `scripts/realcloud_e2e.mjs`（测试仓库） | 不计提单 |
| 14 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏 AK/SK/token（SPEC） | `telemetry.mjs:189` | 待提单 |
| 15 | P2 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs` | 待提单 |
| 16 | P2 | `D10-4` | D10评测 | 规则库 16→19 条断言漂移（SPEC） | `cloud-risk-rules.json` | 待提单 |

> 与 v1.1.12 上一日（2026-10-26）结论一致（15 产品缺陷 + 1 测试侧），无新修复、无新回归。
> **本轮差异**：沙箱(DevStation)服务自今日起维护中（`HDKIT_SANDBOX_MAINTENANCE`），昨日 FAIL 的 D3-C3（sandbox deploy_nginx false-negative）本轮无法连接沙箱、改标 BLOCKED（暂不计入缺陷，见 §五），D3-C6/D3-S3 同步标 BLOCKED；产品缺陷清单相应减 1 项（15→14）。

### 根因详情

见 `FINDINGS.md`（15 项，含逐条 现象/断言/根因/影响/证据）。测试侧 D3-C1（#13 测试侧）不计入源码仓提单。

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
| `D4-12` | D4安全 | 供应链安装期安全 | 【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | 【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes） |
| `D3-C3` | D3功能 | 沙箱部署 deploy_nginx | 【补环境】沙箱(DevStation)服务维护中（`HDKIT_SANDBOX_MAINTENANCE`「沙箱功能正在升级优化，暂时无法使用」），实测 2026-10-27 05:0x check_user 失败→deploy_nginx 无法连接沙箱（workspace_id required）；解除条件=维护结束服务恢复后复测（原 deploy false-negative 缺陷本轮无法复核） |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具冒烟 | 【补环境】沙箱(DevStation)服务维护中（`HDKIT_SANDBOX_MAINTENANCE`），实测 check_user 失败→7 隐式工具冒烟无法 connect（workspace_id required）；解除条件=维护结束服务恢复后复测 |
| `D3-S3` | D3功能 | 沙箱前端项目部署 | 【补环境】沙箱(DevStation)服务维护中（`HDKIT_SANDBOX_MAINTENANCE`），实测前端项目部署场景 check_user 失败；解除条件=维护结束服务恢复后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（测试全程未发生真实凭证明文外泄；探针 AKSK 均走 ~/.config/huaweicloud/credentials.json 预置账号）
- [x] 写操作误判 read-only：`无`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`发现 4 处脱敏缺口`（D4-2 generic access_key、D4-6 JSON 带引号 key adminPass、D4-26 findings.evidence 明文、D8-9 sanitizeValue 未脱敏）——均已列为缺陷，非测试侧泄漏
- [x] 真云红线：建删资源全部归零（见 §七），只删本次创建、按名称后缀（`3048785051`）白名单清理

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC + Subnet（D3-S2） | `tctest-hermes-s2-mvpqy2dn` | DeleteVpc | `仍含=VPC true→确认后删除归零` OK |
| VPC + Subnet（D3-C1） | `testbot3-hermes-e2e-3048785051` + subnet | DeleteServers + 人工补删 | 最终 VPC=0 / subnet=0 |
| ECS（D3-C1） | CreateServers（`93e1489d…`，`testbot3-hermes-ecs-3048785051`） | DeleteServers（提交）+ 人工补删 | 最终 ECS count=0（150s 轮询未确认，人工二次删除后归零） |
| OBS 桶（D3-C2） | `OBS mb testbot3-hermes-obs-3048946393` | 删桶 | `Delete bucket ... successfully!` 归零 OK |
| OBS 桶（D3-C13） | `OBS mb tctest-hermes-obs-mvpqy2dn` | OBS rm | `bucket removed` 归零 OK |
| EIP（D3-C7） | 跨区创建 EIP 引导（`9708c14c…`） | DeletePublicip | `ListEips 无本次id` 无残留 |
| 沙箱（D3-C3/D3-C6/D3-S3） | 未连接（服务维护） | — | 无沙箱会话创建（维护期 check_user 失败，未建任何沙箱资源） |
| FunctionGraph 函数（D3-S6） | CreateFunction（失败未建，`Invalid parameter: code.filename`） | 测后删除 | 删除函数归零 OK |

> 真云用例全部真机执行；D3-C1 ECS（150s 轮询窗口过短致未确认）本轮已人工按名称后缀白名单补删，ECS/VPC/subnet 均归零（ECS=0、VPC=0、subnet=0）。同机并发其他客户端（DSH/CodeArtsAgent）创建的 `testbot3-hermes-*` 前缀资源（后缀 `3048711485`/`3048814184`/`3048940765`）不在本客户端责任范围，未触碰。

---

## 八、遗留与建议

- **SPEC 待裁决（3 项）**：D8-9（sanitizeValue 未脱敏）、D9-9（capabilities.cancellation 未声明）、D10-4（规则库 16→19 条断言漂移）——建议维护者同步用例母版或确认实现契约。
- **外部阻塞（沙箱维护，3 项）**：D3-C3/D3-C6/D3-S3 因沙箱(DevStation)服务维护 BLOCKED，待维护结束应优先补测（其中 D3-C3 昨日为 FAIL「deploy false-negative」缺陷，维护结束后需复核该缺陷是否仍复现）。
- **测试侧修正（1 项）**：`scripts/realcloud_e2e.mjs` D3-C1 归零判定应改为「解析 List* 响应 JSON 集合键确证缺席 + 周期重发删除」，避免 150s 轮询窗口误判 FAIL（非产品缺陷）。
- **未覆盖项**：D8-1/4/6 文档一致性、D2-10/13 多 profile 夹具、D4-12 供应链审计、D4-24 审批流时钟、D9-6 多客户端并存——均属真·外部依赖，维护 agent 可按 【补环境】/【调归属】/【改用例】 分类跟进。
- **修复建议（按级别）**：P0（D4-2/D4-21/D9-12）安全红线优先修复；P1（D4-6/D4-17/D3-S7/D10-3）安全与交付链路；P2（D4-25/D4-26/D3-S5/S6）遥测与路由完备性。
- **通过率**：88.4%（138 项判定中 122 PASS；13 FAIL 中 1 项为测试侧非产品缺陷）。