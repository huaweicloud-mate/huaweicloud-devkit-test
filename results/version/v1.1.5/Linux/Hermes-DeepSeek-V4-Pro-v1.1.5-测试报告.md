# Hermes-DeepSeek-V4-Pro-v1.1.5 版本全量测试报告（Linux）

> **生成时间**：`2026-09-16 15:50:00`（北京时间）
> **执行归档**：`results/Hermes/2026-09-16-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.5（npm latest，gitHead `e7ed6f66`）
> **测试类型**：版本全量测试（母版全量 `init_day --full`）· testbot3 真机（Linux aarch64）
> **结论**：`PARTIAL`（存在 P0 缺陷 D4-16；真云 E2E 全部真机完成，仅剩性能/升级/矩阵类需专项批次）

---

## 一、关键结论（三层证据口径）

| 口径 | 用例数 | 说明 |
|---|---|---|
| ① 真实执行 | 约 128 | probe 断言(69) + **真云 E2E(12)** + **真机 CLI(10)** + harness(C4 22 + EXP-E 15) |
| ② 源码核对 | 约 71 | 工具注册 / 源码函数存在 / 展开级继承源用例 |
| ③ 未执行 BLOCKED | 27 + 3 | 性能(弱网/长会话/超时) + 真实升级回滚 + 客户端/Node 矩阵 |
| ④ 不适用 NOT_RUN | 4 | EXP-E08 诊断类 + 3 个 Windows 专属用例 |

**真实执行通过率 = 100 / (100 + 14 + 1) ≈ 87%**。

---

## 二、真云 E2E 全部真机完成（6 项，本轮 testbot3 实测）

| 用例 | 结论 | 真机证据 |
|---|---|---|
| D3-C1 ECS 生命周期 | ✅ PASS | plan+run_approved 审批链路 CreateVpc→CreateSubnet→CreateServers(serverIds)→删除归零(ECS/VPC/subnet=0) |
| D3-C2 OBS 静态站 | ✅ PASS | obsutil mb 建桶→obs_set_website_config set(websiteUrl)/get(XML)→rm 删桶归零 |
| D3-C3 沙箱部署 | ✅ PASS | connect→upload_project(tunnel md5Verified)→deploy_nginx(static:8080)→deploy_check(nginx_serving PASS)→close |
| D3-C6 沙箱 7 工具 | ✅ PASS | check_user(实名+协议)→connect→credentials(validation passed)→exec_one_shot(aarch64执行)→close |
| D3-B7 审批闭环 | ✅ PASS | plan 只读分类 allow→run_approved 真实执行返回 VPC 列表 |
| D3-B8 领券状态 | ✅ PASS | voucher_status 返回 {claimed:true, 已领取} |

> **真云结论：无新增产品缺陷。** 审批/领券/ECS/OBS/沙箱全链路按预期工作，印证 v1.1.5 缺陷集中在安全(D4-16)、路由(D10)、协议(D9-2/D9-9)、打包(D8-4)四个特定领域，真云资源操作链路健康。

---

## 三、执行状态汇总

- 设计级（179）：PASS 145 / BLOCKED 27 / NOT_RUN 3 / FAIL 3 / SPEC-MISMATCH 1
- 展开级（57）：PASS 42 / BLOCKED 3 / FAIL 11 / NOT_RUN 1

---

## 四、缺陷清单（真实执行测出，双 OS 一致）

| 用例 | 级别 | 缺陷 | 历史单 |
|---|---|---|---|
| D4-16 | P0 | sh -c 包裹凭证 env 打印未拦截 | #677 #682 #694 |
| D10-3 / EXP-E01~14 | P1 | serviceCatalog 路由命中率 21.4% | #689 |
| D9-2 | P1 | invalid params 未返回 -32602 | #704 #672 |
| D8-4 | P1 | INSTALL.md 未随 npm 包发布 | #694 |
| D9-9 | P1 | notifications.cancellation 未声明（SPEC） | #698 |

---

## 五、未执行清单（BLOCKED 27，非真云类，需专项批次）

- **性能稳定性** D6-2/5/6/7/8：弱网/长会话/大目录/MCP 超时（需专门干扰环境）
- **真实升级链路** D1-52/56/57/59/61：真实 npm 升级/坏版本回滚/中断注入（破坏性测试）
- **客户端矩阵/兼容** D5-7/8、D7-1/2/5/6：多客户端/多 Node 版本矩阵
- **协议/质量/评测** D9-4/5/10、D8-5/8、D10-6/7/8：remote transport/遥测/inspector

> 完整逐条 blockedReason 见 `用例矩阵-设计级.csv`。

## 六、真云踩坑沉淀（本轮）

- `plan_cli_command`/`run_approved_command` 的 `args` 是字符串数组（不含 hcloud 前缀），`approvedByUser` 是 boolean
- ECS：`--server.nics.1.subnet_id`（索引从 1 起）、x86 镜像 `9c2f377e` + `c6.large.2`、创建返回 `serverIds`、异步删除约 3-4min
- OBS：obsutil 删空桶 `rm obs://bucket -f`（不带 `-r`）；`obs_set_website_config` 内部 AWS4 签名直调
- 沙箱：`sandbox_connect` 返回 sessionId/devStageId 作 workspace_id；WebSocket 长连接需 `< /dev/null` 防进程挂起

## 七、遗留与后续

- 待上游修复：D4-16（P0）/ D9-2 / D8-4 / D10-3；待裁决 SPEC：D9-9。
- 27 个 BLOCKED 非真云类，建议纳入专项真机批次（性能干扰、破坏性升级、多客户端矩阵）。
- 双 OS 对照：缺陷无 OS 差异；Windows 专属用例（D1-13/D5-6/D7-3）Linux 侧 NOT_RUN，需 Windows 真机补测。