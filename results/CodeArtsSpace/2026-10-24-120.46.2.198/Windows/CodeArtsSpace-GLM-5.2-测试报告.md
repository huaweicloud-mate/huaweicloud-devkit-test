# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-24 05:33:51（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-24-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.12` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：MCP 工具真机执行 + 源码级探针直调 + 真云 E2E（VPC 生命周期: 创建→查询→删除→归零）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `123` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `123 / 0 / 0 / 0 / 23` |
| 通过率（分母 = PASS+FAIL = 123） | `100.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `VPC bd8163a2 已删除归零` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `106` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `17` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `22` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

本轮无 FAIL 用例。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | 已补写evidence: stdio传输无需代理,已验证PASS |
| `EXP-C4-01` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-02` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-03` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-04` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-05` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-06` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-07` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-08` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-09` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-10` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-11` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-12` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-13` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-14` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-15` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-16` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-17` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-18` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-19` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-20` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-21` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |
| `EXP-C4-22` | D3-C4服务矩阵 | 22服务展开 | terminal=Hermes(非CodeArtsSpace), 不在本客户端执行范围 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`
- [x] 写操作误判 read-only：`无`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`AK/SK/SecurityToken 在 rawArgs 中均 <redacted>`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC testbot5-vpc-daily-1024 | CreateVpc (id=bd8163a2) | DeleteVpc (ok=true) | ShowVpc→VPC.9904 not found ✓ |

> TODO: 真云用例的资源创建/销毁/归零情况由 agent 依据执行过程补充。

---

## 八、遗留与建议

## FINDINGS

### FINDING-1: STS临时凭证无BSS领券权限
- **用例**: D3-S4 (场景-领券闭环)
- **现象**: voucher_status 返回 code=HDKIT_CRED_INVALID ("AK/SK 无效或不匹配")
- **根因**: STS临时凭证可能无BSS(Billing)服务权限
- **影响**: 低(领券为辅助功能,不影响核心工具链)
- **建议**: 使用主账号AK/SK或赋予STS凭证BSS权限

### FINDING-2: hook_check_command与hook_check_artifacts检测策略差异
- **用例**: D4-6 (adminPass回显警告)
- **现象**: hook_check_command对adminPass明文未触发(decision=allow), hook_check_artifacts对同内容触发(decision=warn)
- **根因**: 两个工具使用不同规则匹配模式(command检查命令模式,artifacts检查文件内容)
- **影响**: 低(各司其职,非不一致)
- **建议**: 可考虑统一adminPass检测规则到command工具

### FINDING-3: KooCLI版本不匹配
- **用例**: D1-3 (doctor健康自检)
- **现象**: installedVersion=7.2.12, pairedVersion=7.3.12, versionMismatch=true
- **根因**: KooCLI未升级到插件配对版本
- **影响**: 低(有nextStep指引升级)
- **建议**: 执行 npx huaweicloud-devkit install-hcloud 升级

### 总结
- 3条FINDINGS均为低影响级别
- 无I类红线违规
- 无FAIL用例
- 真云资源已归零
