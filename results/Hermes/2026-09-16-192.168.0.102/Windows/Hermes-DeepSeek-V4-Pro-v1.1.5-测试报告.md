# Hermes-DeepSeek-V4-Pro-v1.1.5 版本全量测试报告（Windows）

> **生成时间**：`2026-09-16 14:20:00`（北京时间）
> **执行归档**：`results/Hermes/2026-09-16-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit v1.1.5（npm latest，gitHead `e7ed6f66`）
> **测试类型**：版本全量测试（母版全量 `init_day --full`）· 双 OS 对照
> **结论**：`PARTIAL`（存在 P0 缺陷 D4-16；约 23% 用例未执行，如实标 BLOCKED）

---

## 一、关键结论（口径修正说明）

本报告采用**三层证据口径**，不再用单一"通过率"混报。上版"通过率 93.6%"含无条件兜底 PASS，已修正为：兜底用例逐条重判为「源码核对 PASS」或「BLOCKED 需真机/CLI」。

| 口径 | 用例数 | 说明 |
|---|---|---|
| ① 真实执行 | 约 112 | probe 断言(69) + 真云(6) + harness(C4 22 + EXP-E 15) |
| ② 源码核对 | 约 65 | 工具注册 / 源码函数存在 / 展开级继承源用例 |
| ③ 未执行 BLOCKED | 55 | 需真机/真实CLI，如实标注 + 原因 |
| ④ 不适用 NOT_RUN | 1 | EXP-E08 诊断类（harness 判 N/A） |

**真实执行通过率 = 100 / (100 + 14 + 1) ≈ 87%**（真实执行 115 个中：PASS 100 / FAIL 14 / SPEC 1）。

---

## 二、执行状态汇总（重判后）

- 设计级（179）：PASS 129 / BLOCKED 46 / FAIL 3 / SPEC-MISMATCH 1
- 展开级（57）：PASS 36 / BLOCKED 9 / FAIL 11 / NOT_RUN 1

其中 PASS 129（设计级）= 真实执行 75（probe 69 + 真云 6）+ 源码核对 54。

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

## 四、未执行清单（BLOCKED，如实标注）

- **设计级 46**：真机 E2E 类（ECS/OBS/沙箱/审批执行/领券 11）+ 真实 CLI 类（install/uninstall/update/插件流 27）+ 无静态可核对依据（8）。
- **展开级 9**：EXP-NR3 含「真实隔离实例/真实会话/真实 TTY」的复测项 + 客户端矩阵需真实多客户端环境。

> 完整逐条 blockedReason 见 `用例矩阵-设计级.csv` / `用例矩阵-展开级.csv` 的 `blockedReason` 列。

---

## 五、真云执行与资源释放

- D4-13 readonly 7/7 PASS；D3-C4 VPC 创建→删除→归零（ShowVpc VPC.9904）；D2-1 三端同步。
- 凭证 0 泄漏（show_profile_redacted 实测无明文 AK/SK）。

---

## 六、遗留与后续

- 待上游修复：D4-16（P0）/ D9-2 / D8-4 / D10-3；待裁决 SPEC：D9-9。
- 46 个设计级 + 9 个展开级 BLOCKED 需要：真机执行（ECS/OBS/沙箱 E2E）或真实 CLI 安装/卸载验证，建议纳入后续真机批次。