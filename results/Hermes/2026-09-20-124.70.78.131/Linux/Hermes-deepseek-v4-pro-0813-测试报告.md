# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-20 05:40`（北京时间）
> **执行归档**：`results/Hermes/2026-09-20-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（10 项产品缺陷，其中 7 项历史查重命中上游 open issue 不重复提单；3 项新增：D4-25 Python hook 写操作分类误判 / D4-26 findings.evidence JSON 形态明文泄漏 / D1-68 region 优先级 SPEC-MISMATCH）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic，ECS，IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm latest 正式版，gitHead `e7ed6f66`） |
| 工具全集 | `40`（`tools/list` 实测，remote/stdio 路径一致） |
| KooCLI / 依赖 | KooCLI 7.2.12（check_cli / doctor 确认） |
| 真云凭证 | cn-north-4（AK/SK 已恢复配置；本节真机建删 VPC/OBS/沙箱并归零验证） |
| daily 基础用例 | 设计级 100 / 展开级 43（Hermes+Linux 预筛后） |

> 本轮 SUT 未变（v1.1.5，gitHead e7ed6f66），但 daily 用例集较 09-19 有扩增（设计级 80→100，新增 D1-65~70/D2-27/D3-C13/C14/D3-S1~S8/D4-25/26/28/29/D6-9/D8-9/10/D9-10/11/D10-4 等约 27 条新用例，另移除 D1-1/2/5/6/D1-58/D7-4 等）。全部探针/harness 重新执行并落盘新鲜证据；真云用例真机建删归零。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 143（设计级 100 + 展开级 43） |
| 设计级 PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 75 / 12 / 8 / 1 / 4 |
| 设计级通过率（分母=PASS+FAIL+SPEC） | 85.2%（75 / 88） |
| 展开级 PASS / FAIL / BLOCKED / NOT_RUN | 32 / 11 / 0 / 0 |
| P0 执行 | 全部执行（PASS/FAIL/BLOCKED，无 P0 NOT_RUN；D1-39 为 Windows 专属→OS 豁免） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本轮 Hermes 建删资源（VPC×2 + OBS bucket×1 + 沙箱 session）全部归零 |

> v1.1.5 复测结论（与 09-19 一致）：已修复有效（`printenv HW_SECRET_KEY`→deny、`sh -c "hcloud ecs DeleteServer"`→deny、未知 method→-32601、裸 `env|grep HUAWEICLOUD`→deny）；残留缺口（`env|grep HW_ACCESS_KEY`、`sh -c "env|grep …"`、未知 tool→-32603、HCL broad IAM、fail-open、中文路由 21.4%、redactString 字符串路径）。

---

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 75 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | D4-2/D4-16/D4-21（P0）；D9-2/D4-17/D10-3/D4-27/D3-S6/D3-S7（P1）；D4-25/D4-26/D3-S5（P2） |
| SPEC-MISMATCH | 1 | D1-68（region env 优先级漂移） |
| BLOCKED | 8 | D2-10/D2-13/D4-12/D4-23/D4-24/D9-6/D9-9/D3-S3（真·外部依赖，见 §五） |
| NOT_RUN | 4 | D1-39（Windows 专属，Linux 由 EXP-NR3-10 覆盖）+ D8-1/4/6（文档一致性白盒比对） |
| **合计** | **100** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 32 | EXP-D5-8-1/3 + EXP-C4-01~22（22 服务矩阵）+ EXP-E06/E09/E15/E08 + EXP-NR3-02/04/10/24 |
| FAIL | 11 | EXP-E01~E05/E07/E10~E14（run-eval.mjs 中文意图 MISS，21.4%） |
| BLOCKED / NOT_RUN | 0 | 已全部消解 |
| **合计** | **43** | |

---

## 四、缺陷清单（详尽）

> 根因为 v1.1.5 源码文件:行号；10 项中 7 项历史查重命中 open issue 不重复提单，3 项新增待提单。完整格式见 FINDINGS.md。

| # | 级别 | 用例ID | 缺陷描述 | 断言 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | env 打印拦截未覆盖 `HW_` 前缀 | `env\|grep HW_ACCESS_KEY` 应 deny | `safety-policy.mjs:398-399` | 历史 #652-1 |
| 2 | P0 | D4-16 | env-dump 被 shell 包裹穿透 | `sh -c "env\|grep …"` 应 deny | `safety-policy.mjs:398` | 历史 #652-2 |
| 3 | P0 | D4-21 | HCL broad IAM 未拦截 | HCL `actions=["*"]` 应 deny | `cloud-risk-rules.json:179,196` | 历史 #652-3 |
| 4 | P1 | D9-2 | 未知 tool 错误码未区分 -32602 | 未知 tool 应 -32602 | `mcp-server.mjs:169` | 历史 #652-4/#638 |
| 5 | P1 | D4-17 | hook 模糊输入 fail-open | 异常输入应 deny | `risk-rule-engine.mjs:106` | 历史 #679/#674 |
| 6 | P1 | D10-3 (+S5/S6/S7) | 中文意图路由 21.4% 缺失 | 中文意图应命中（≥90%） | `tools.mjs:1778-1908` | 历史 #689/#683 |
| 7 | P1 | D4-27 | 字符串路径裸 token/admin-pass 未脱敏 | 双路径无明文残留 | `safety-policy.mjs:42` | 历史 #726 |
| 8 | P2 | D4-25 | Python hook 写操作分类为 cli:invoke | 写操作应 cli:write | `hooks/huaweicloud-safety.py:46` | **新增** |
| 9 | P2 | D4-26 | findings.evidence JSON 带引号 key 明文泄漏 | evidence 应 `<redacted>` | `risk-rule-engine.mjs:19` | **新增** |
| 10 | P2 | D1-68 | region 优先级契约漂移 | 契约 HUAWEICLOUD_REGION 优先 vs 实现 HW_REGION 优先 | `auth/credentials.mjs:133,261,284` | **新增 SPEC-MISMATCH** |

---

## 五、未执行 / 阻塞用例与原因（逐条）

### BLOCKED（8，全部真·外部依赖）

| 用例ID | 优先级 | 分类 | 原因 | 解除条件 |
|---|---|---|---|---|
| D2-10 | P1 | 【补环境】 | R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） | 提供多 profile 夹具脚本 |
| D2-13 | P1 | 【补环境】 | R9 configuredBySession 优先 env 判定需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号） | 提供隔离环境夹具 |
| D4-12 | P2 | 【补环境】 | 供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 | 提供 SBOM/抓包通道 |
| D4-23 | P0 | 【补环境】 | 全局规则 huawei-agent-rules.md 注入需 11 Agent 多机安装目标；包内无该制品 | 多机安装目标 + 制品 |
| D4-24 | P1 | 【补环境】 | 确认令牌过期/重复确认边界需审批流 + 可注入时钟 | 提供注入时钟 |
| D9-6 | P1 | 【调归属】 | 跨客户端互通需多客户端并存环境（单机仅 Hermes） | 多客户端并存环境 |
| D9-9 | P1 | 【改用例】 | tools/call 超时语义需可注入延迟夹具(30s 挂起)；capabilities.cancellation 探针确认 false | 延迟注入夹具 |
| D3-S3 | P1 | 【补环境】 | 沙箱 deploy_nginx 返回 ok=true 但 deploy_check nginx_serving/devbridge_tunnel FAIL、无公网 URL（DevStation 隧道外发环境不可用）；connect/upload(md5)/deploy/close 全链路已真实执行 | 沙箱公网隧道/预览环境 |

### NOT_RUN（4）

| 用例ID | 优先级 | 分类 | 原因 |
|---|---|---|---|
| D1-39 | P0 | 【调归属】Windows 专属 | 升级检测链 EINVAL 为 Windows 语义（OS 列标注「专属」）；Linux 由 EXP-NR3-10（disttags 探针）代表覆盖 |
| D8-1 | P2 | 【改用例】 | 文档与能力一致需白盒 docs 全量比对 |
| D8-4 | P1 | 【改用例】 | 引导步骤可机械执行需逐条核验 getting-started |
| D8-6 | P2 | 【改用例】 | 中英文文档一致需中英双源逐段比对 |

---

## 六、安全 / 红线

- 真云用例真机执行：本轮新建并删除 VPC×2（D3-S2 确认流 + realcloud D4-14）、OBS bucket×1（D3-C13）、沙箱 session×1（D3-S3），测后 `ListVpcs`/`OBS ls` 归零验证通过（VPC count=0，本客户端 bucket 已删）。
- 只读子账号 D4-13：test001 只读 6/6 可用（ECS/VPC/EVS/IMS/CES/EIP），写 VPC CreateVpc 被 IAM 拒绝（VPC.0010 PolicyNotAuthorized），归零核实通过。
- 凭证红线未泄露：所有证据 stdout.log 已脱敏（AK/SK/token 以 `***/<redacted>` 替换），无明文落盘。
- 未 mock 假跑、未空跑：所有 PASS 均有探针真实运行 + stdout.log 落盘 + evidencePath 回填，`verify_no_fake_pass` 通过。

## 七、资源释放

| 资源 | 创建 | 删除 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2） | CreateVpc | run_approved DeleteVpc（确认流） | ListVpcs 不含 ✓ |
| VPC（D4-14） | CreateVpc | DeleteVpc | ListVpcs 不含 ✓ |
| OBS bucket（D3-C13） | obs mb | obs rm -f | OBS ls 不含 ✓ |
| 沙箱 session（D3-S3） | sandbox_connect | close_session | ok ✓ |
| FunctionGraph（D3-S6） | 创建失败(参数) | — | 未创建无残留 ✓ |
| RDS（D3-S7） | 未创建(前置缺) | — | 未创建无残留 ✓ |

## 八、遗留建议

1. **安全脱敏是「文件级」一致性问题**：`safety-policy.mjs redactString`、`risk-rule-engine.mjs redactEvidence`、`huaweicloud-safety.py WRITE_OPERATION_RE` 三处各自存在「JSON 带引号 key / 空格 flag / 前置字符」边界缺陷，建议统一抽一个共享脱敏/词边界实现而非各自维护正则（对应 #7/#8/#9）。
2. **中文意图路由**（D10-3/S5/S6/S7）仍是最大体验缺口（21.4%），建议 routeMap 为每服务补 CJK 关键字（或接入语义分词）。
3. **D1-68 region 优先级**需维护者确认契约方向（HUAWEICLOUD_REGION vs HW_REGION 谁优先），同步修正用例或实现。
4. BLOCKED 8 项中 D9-6/D2-10/D2-13 为多机/多 profile 夹具类，建议维护 agent 分配夹具或调归属；其余为安装期供应链/审批流注入时钟等专项环境。