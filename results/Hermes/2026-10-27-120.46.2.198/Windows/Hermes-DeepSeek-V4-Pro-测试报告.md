# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-27 10:31:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-27-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，npm 1.1.12，gitHead `4ed0780`）
> **结论**：`PARTIAL`（3 条 FAIL + 2 条 BLOCKED；含 2 条产品缺陷（均历史延续）+ 1 条测试侧）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro（testbot5-win-hermes） |
| OS / 架构 | Windows 10（x64，IP 120.46.2.198） |
| Node / npm / Python | Node v26.7.0 / npm 11.19.0 / Python 3.14.7 |
| 被测版本（SUT） | `1.1.12`（npm latest，gitHead `4ed0780`，Merge PR #1013） |
| 工具全集 | 46（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud（KooCLI）7.2.12 |
| 真云凭证 | cn-north-4（AK/SK 管理员 + 只读子账号 test001，均就绪） |
| 测试类型 | 源码级探针 / MCP 协议 / 评测路由 / 真云 E2E |
| 设计真源 | daily 精选：设计级 107 / 展开级 43 / 追踪表 216 / 使命 mission-001 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 → 结果落 `stdout.log`；D10 评测走 `probe-eval.mjs` 直连 MCP server 真相路由；真云 E2E（D3-C1/C2/C3/C6/D4-13）经 `scripts/realcloud_e2e.mjs` + 只读子账号实测建删归零。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 150（设计级 107 + 展开级 43） |
| 已执行 | 150 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 145 / 3 / 2 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 98.0% |
| P0 / P1 / P2 新增缺陷 | 0 / 2 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本次创建全部归零（ECS=0、VPC=0、子网=0、OBS 归零、EIP=0） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 103 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D3-C1 / D3-C2（根因见缺陷清单） |
| BLOCKED | 2 | D3-C3 / D3-C6（沙箱维护，外部依赖） |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **107** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 42 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（D10 评测路由 MISS） |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **43** | |

### 3.3 使命 mission-001（9）

| 状态 | 数量 |
|---|---|
| PASS | 9 |
| **合计** | **9** |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 类型 | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | D3-C2 | OBS 静态网站托管配置签名错误 | set/get 返回 200 | HTTP 400，x-amz-security-token 未纳入 SignedHeaders | tools.mjs:3071（3033-3034） | 产品 | 历史 #1025 |
| 2 | P1 | EXP-E01 | serviceCatalog 路由未命中「云主机」 | 云主机命中 ECS | 路由为空 → Run hcloud --help | tools.mjs:2192-2205 | 产品 | 历史 #896 |
| 3 | P1 | D3-C1 | ECS 异步删除超 150s 轮询窗口 | 全程完成无残留 | 150s 后仍 ACTIVE（已手动归零） | scripts/realcloud_e2e.mjs 轮询 | 测试侧 | 记录 |

### 根因详情（产品缺陷）

**#1 [P1] D3-C2 OBS website 签名错误**

- 期望：`obs_set_website_config` → 200
- 实际：HTTP 400，`Request has x-amz-security-token header but signed headers not included`
- 根因：`plugins/huaweicloud-core/src/tools.mjs:3071` — `obsSignedRequest()` 在 `creds.securityToken` 存在时向请求头追加 `x-amz-security-token`，但 `signedHeaders`（:3034）只含 `host;x-amz-content-sha256;x-amz-date`，签名不覆盖该头
- 证据：`evidence/D3-C2/stdout.log`（真云实测，建桶成功 + 删桶归零成功，website 配置失败）

**#2 [P1] EXP-E01 serviceCatalog 路由缺「云主机」关键词**

- 期望：意图「…云主机」命中 ECS
- 实际：路由为空，返回 `Run hcloud --help`
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2192-2205` — ECS routeMap 关键词表缺「云主机」
- 证据：`evidence/EXP-E01/stdout.log`（MCP 真实路由，HIT=13 MISS=1 N/A=1，准确率 92.9%）

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D3-C3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 DevStation 服务维护中（HDKIT_SANDBOX_MAINTENANCE「沙箱功能正在升级优化」），sandbox_connect 拿不到 workspace_id，upload_project/deploy_nginx/deploy_check/close_session 全链路依赖 connect 失败 | — |
| D3-C6 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 DevStation 服务维护中，check_user/connect/credentials/exec_one_shot/close_session 五步全以「沙箱维护」或「workspace_id required」失败 | — |

> 其余 148 条全部执行（PASS 145 / FAIL 3），无 NOT_RUN。D10-1/D10-2（真实 Agent 会话评测需 DSH/CDP）在本轮 daily 展开级中未下发（D10 仅 D10-3/D10-4 在案），无需额外处理。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC + subnet（D3-C1，testbot3-hermes-e2e-*） | 是 | 已删 | 二次删除后 ListVpcs 无残留 |
| ECS（D3-C1，testbot3-hermes-ecs-*） | 是 | 已删 | 轮询确认 count=0 |
| OBS 桶（D3-C2，testbot3-hermes-obs-*） | 是 | 已删 | 删桶成功 |
| EIP | 否 | — | total_count=0 |

> 真云只删本次创建资源；删除前盘点 + 白名单，禁删既有/他人资源。D4-13 只读子账号写被 IAM 拒绝（PolicyNotAuthorized），未产生资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`无`
- 本轮未覆盖（说明范围）：`沙箱链路（D3-C3/D3-C6/D3-S3/D3-S7）因 DevStation 维护 BLOCKED，待沙箱恢复后补测`
- 建议：
  1. D3-C2 OBS 签名缺陷（#1025）与 EXP-E01 路由缺陷（#896）跨 1.1.12 仍未修复，建议排期；
  2. D4-13 本轮改用正确口径（`--cli-access-key/--cli-secret-key` 传只读子账号）后实测「读可用、写被 IAM 拒绝」，最小权限实际生效——昨日「凭证切换未生效」为测试侧 env 注入（hcloud 不读 HW_ACCESS_KEY/HW_SECRET_KEY）所致假 FAIL，已在报告中澄清；
  3. `realcloud_e2e.mjs` 的 ECS 异步删除 150s 轮询窗口不足，建议延长或改为轮询至 count=0。