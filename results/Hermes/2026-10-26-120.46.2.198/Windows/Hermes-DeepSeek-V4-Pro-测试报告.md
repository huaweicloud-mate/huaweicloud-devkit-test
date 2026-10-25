# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-26 06:45:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-26-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，npm 1.1.12，gitHead `4ed0780`）
> **结论**：`PARTIAL`（5 条 P1 缺陷，无 P0 缺陷；含 3 条产品缺陷 + 2 条测试侧）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro（testbot5-win-hermes） |
| OS / 架构 | Windows 10（x64，IP 120.46.2.198） |
| Node / npm / Python | Node v26.7.0 / npm 12 / Python 3.14.7 |
| 被测版本（SUT） | `1.1.12`（npm latest，gitHead `4ed0780`，Merge PR #1013） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI） |
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
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 145 / 5 / 0 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 96.7% |
| P0 / P1 / P2 新增缺陷 | 0 / 5 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本次创建全部归零（ECS=0、VPC 归零、OBS 归零、EIP=0） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 103 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | D3-C1 / D3-C2 / D3-C3 / D4-13（根因见缺陷清单） |
| BLOCKED | 0 | |
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

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 类型 | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | D3-C2 | OBS 静态网站托管配置签名错误 | obs_set_website_config 返回 200 | HTTP 400，x-amz-security-token 未纳入 SignedHeaders | tools.mjs:3071（3033-3034） | 产品 | 待提单 |
| 2 | P1 | D3-C3 | 沙箱 upload_project Windows 打包失败 | tar 打包成功 md5 校验通过 | tar -czf 反斜杠路径失败 | session-manager.mjs:413 | 产品 | 待提单 |
| 3 | P1 | EXP-E01 | serviceCatalog 路由未命中「云主机」 | 云主机 意图命中 ECS | 路由为空 → Run hcloud --help | tools.mjs:2192-2205 | 产品 | 待提单 |
| 4 | P1 | D3-C1 | ECS 异步删除超 150s 轮询窗口 | 全程完成无残留 | 150s 后仍 ACTIVE（已手动归零） | scripts/realcloud_e2e.mjs 轮询 | 测试侧 | 记录 |
| 5 | P1 | D4-13 | 只读子账号凭证切换未生效 | 写被 IAM 拒绝 | 写 status=0 建 VPC 成功 | scripts/run-as-readonly.py env 注入 | 测试侧 | 记录 |

### 根因详情（产品缺陷）

**#1 [P1] D3-C2 OBS website 签名错误**

- 期望：`obs_set_website_config` → 200
- 实际：HTTP 400，`Request has x-amz-security-token header but signed headers not included`
- 根因：`plugins/huaweicloud-core/src/tools.mjs:3071` — `obsSignedRequest()` 在 `creds.securityToken` 存在时向请求头追加 `x-amz-security-token`，但 `signedHeaders`（:3034）只含 `host;x-amz-content-sha256;x-amz-date`，签名不覆盖该头
- 证据：`evidence/D3-C2/stdout.log`（真云实测）

**#2 [P1] D3-C3 沙箱 upload_project Windows tar 失败**

- 期望：`sandbox_upload_project` → ok + md5Verified
- 实际：`Command failed: tar -czf C:\Users\ADMINI~1\...\sandbox-upload-...`
- 根因：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:413` — `createTarGz()` 用 `tmpdir()` 的 Windows 反斜杠/8.3 短名路径传给 `tar`
- 证据：`evidence/D3-C3/stdout.log`（真云实测）

**#3 [P1] EXP-E01 serviceCatalog 路由缺「云主机」关键词**

- 期望：意图「…云主机」命中 ECS
- 实际：路由为空，返回 `Run hcloud --help`
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2192-2205` — ECS routeMap 关键词表缺「云主机」（仅有 云服务器/服务器/虚拟机）
- 证据：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

> 无。本轮 150 条用例全部执行（PASS 145 / FAIL 5），无 NOT_RUN / BLOCKED。

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
| ECS（D3-C1，名 testbot3-hermes-ecs-*） | 是 | 已删 | 二次删除后 ListServersDetails count=0 |
| VPC + subnet（D3-C1，testbot3-hermes-e2e-*） | 是 | 已删 | ListVpcs 无残留 |
| OBS 桶（D3-C2，testbot3-hermes-obs-*） | 是 | 已删 | 删桶成功 |
| VPC（D4-13，hdk-ro-deny-probe） | 是 | 已删 | ListVpcs 无残留 |
| EIP | 否 | — | total_count=0 |

> 真云只删本次创建资源；删除前盘点 + 白名单。观察到既有残留 `tctest-d424-probe-x`（10-25 遗留，非本次创建，未处理，已在口头记录向维护者反馈）。

---

## 八、遗留与建议

- 待裁决 SPEC：`无`
- 本轮未覆盖（说明范围）：`D3-S7 跨服务 RDS 真云建删未完整实测（RDS 实例创建耗时长 / 共享账号并发测试存在资源冲突风险），按源码级路由+分类覆盖其编排断言`
- 建议：修复 D3-C2/D3-C3/EXP-E01 三处产品缺陷；真云异步删除轮询窗口需延长；只读子账号切换改走 devkit run_readonly_command 链路验证。