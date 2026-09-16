# Hermes-DeepSeek-V4-Pro-v1.1.5 版本全量测试报告（Linux）

> **生成时间**：`2026-09-16 14:50:00`（北京时间）
> **执行归档**：`results/Hermes/2026-09-16-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.5（npm latest，gitHead `e7ed6f66`）
> **测试类型**：版本全量测试（母版全量 `init_day --full`）· testbot3 真机（Linux aarch64）
> **结论**：`PARTIAL`（存在 P0 缺陷 D4-16；约 18% 用例需真云 E2E/沙箱/性能环境，如实标 BLOCKED）

---

## 一、关键结论（三层证据口径）

| 口径 | 用例数 | 说明 |
|---|---|---|
| ① 真实执行 | 约 122 | probe 断言(69) + 真云(6) + **真机 CLI(10)** + harness(C4 22 + EXP-E 15) |
| ② 源码核对 | 约 71 | 工具注册 / 源码函数存在 / 展开级继承源用例 |
| ③ 未执行 BLOCKED | 36 | 需真云 E2E(ECS/OBS/沙箱/审批/领券) + 性能(弱网/长会话/超时) + 真实升级回滚 |
| ④ 不适用 NOT_RUN | 4 | EXP-E08 诊断类 + 3 个 Windows 专属用例 |

**真实执行通过率 = 100 / (100 + 14 + 1) ≈ 87%**。

---

## 二、执行状态汇总（真机回填后）

- 设计级（179）：PASS 139 / BLOCKED 33 / NOT_RUN 3 / FAIL 3 / SPEC-MISMATCH 1
- 展开级（57）：PASS 42 / BLOCKED 3 / FAIL 11 / NOT_RUN 1

**本次真机新增**（真实 CLI 执行，10 项 PASS + 3 项 OS 专属 NOT_RUN）：
- CLI 安装/卸载/重装/状态/医生/代理/版本：D1-7、D1-8、D1-9、D1-10、D1-12、D1-14、D1-15、D1-62、D5-2、D2-17 → **真实执行 PASS**
- Windows 专属（Linux 不适用）：D1-13、D5-6、D7-3 → NOT_RUN

---

## 三、缺陷清单（真实执行测出，双 OS 一致）

| 用例 | 级别 | 缺陷 | 历史单 |
|---|---|---|---|
| D4-16 | P0 | sh -c 包裹凭证 env 打印未拦截 | #677 #682 #694 |
| D10-3 / EXP-E01~14 | P1 | serviceCatalog 路由命中率 21.4% | #689 |
| D9-2 | P1 | invalid params 未返回 -32602 | #704 #672 |
| D8-4 | P1 | INSTALL.md 未随 npm 包发布 | #694 |
| D9-9 | P1 | notifications.cancellation 未声明（SPEC） | #698 |

---

## 四、未执行清单（BLOCKED 33，如实标注原因）

| 类别 | 数量 | 用例 | 原因 |
|---|---|---|---|
| 真云 E2E | 5 | D3-C1(ECS)、D3-C2(OBS)、D3-C3/C6(沙箱)、D3-B7(审批)、D3-B8(领券) | 需真实云资源/沙箱账号 |
| 性能稳定性 | 4 | D6-2/5/6/7/8 | 弱网/长会话/大目录/MCP 超时难模拟 |
| 真实升级链路 | 5 | D1-52/56/57/59/61 | 需真实 npm 升级/坏版本回滚/中断注入 |
| 客户端矩阵/兼容 | 8 | D5-7/8、D7-1/2/5/6 | 多客户端/多 Node 版本矩阵 |
| 协议/质量/评测 | 8 | D9-4/5/10、D8-5/8、D10-6/7/8 | 需真实遥测/remote transport/inspector |

> 完整逐条 blockedReason 见 `用例矩阵-设计级.csv` 的 `blockedReason` 列。

---

## 五、真机执行亮点（本轮 testbot3 实测）

- CLIHermes/OpenClaw 两 target 真实安装：落点正确、双通道可用、重启生效语义明确
- uninstall 幂等归零（第二次 Removed 0 skills 无报错）
- auth reconcile 非 TTY 守卫正常（快速退出不 hang）
- doctor 10 项全 pass；proxy show / version / reinstall 均有实现

## 六、遗留与后续

- 待上游修复：D4-16（P0）/ D9-2 / D8-4 / D10-3；待裁决 SPEC：D9-9。
- 33 个 BLOCKED 需：真云资源（ECS/OBS）、沙箱账号、弱网/长会话环境、真实升级注入，建议纳入后续专项真机批次。
- 双 OS 对照：缺陷无 OS 差异；Windows 专属用例（D1-13/D5-6/D7-3）在 Linux 侧 NOT_RUN，需 Windows 真机补测。