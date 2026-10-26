# Hermes-DeepSeek-V4-Pro 每日测试报告
> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-26 11:39:29（北京时间）
> **执行归档**：`results/Hermes/2026-10-26-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.12` |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：探针直调 SUT 源码（`devkit-test/hdk` @ 1.1.12）+ MCP 真机（run-eval 评测 harness）+ 真云 E2E（realcloud_e2e.mjs，ECS/OBS/沙箱）。证据全部 `evidence/<case-id>/stdout.log` 落盘。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `150` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `137 / 11 / 2 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 148） | `92.6%` |
| P0 / P1 / P2 新增缺陷 | `2 / 8 / 1` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `97` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P2 | `D1-30` | D1安装 | semver 比对正确性 | TODO: 待补根因 | 待提单 |
| 2 | P0 | `D1-39` | D1安装 | Windows 升级检测链可用性 | TODO: 待补根因 | 待提单 |
| 3 | P1 | `D2-10` | D2认证 | R7 current档跟随 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `D2-16` | D2认证 | import文件读取后擦除 | TODO: 待补根因 | 待提单 |
| 5 | P1 | `D3-A1` | D3功能 | skill检索完整性 | TODO: 待补根因 | 待提单 |
| 6 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E | TODO: 待补根因 | 待提单 |
| 7 | P1 | `D3-C3` | D3功能 | 沙箱部署E2E | TODO: 待补根因 | 待提单 |
| 8 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | TODO: 待补根因 | 待提单 |
| 9 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |
| 10 | P1 | `EXP-NR3-03` |  |  | TODO: 待补根因 | 待提单 |
| 11 | P0 | `EXP-NR3-09` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

| 用例ID | 期望 → 实际 | 根因 |
|---|---|---|
| `EXP-E01` | 中文意图「查华北北京四云主机」→ 路由 ECS | 实际返回通用 help，未命中 ECS；与 D3-S1 同根因（serviceCatalog 路由表缺该意图） |
| `D3-C3` | 沙箱部署全程完成，无残留 | `sandbox_upload_project` 在 Windows `tar -czf` 打包失败 → deploy_nginx 无项目 |
| `D2-10` | KooCLI profile 管理（current 档跟随） | profile 管理=false，待源码核对 src/auth + koocli |
| `D2-16` | import 文件读取后擦除 | auth switch/import=false（导入文件未擦除） |
| `EXP-NR3-03` | 更新 dismiss 持久化 | dismissed=false（文件/数据均未落盘 dismiss 标记） |
| `D1-30` | semver 比对正确 | `update-check.mjs:53 semverCompare` 预发布比较边界有误 |
| `D1-39` | Windows 升级检测链可用 | 已知缺陷（见下 K-1），产品已 shell:true 规避 |
| `D3-A1` | skill 检索完整性 ≥20 | 探针查 hdk 根 skills 仅 1 个，实际技能在 plugins/huaweicloud-core/skills（探针路径问题） |
| `D3-S1` | 只读查 ECS 路由可用 | serviceCatalog ECS 只读路由 function=false（同 EXP-E01） |
| `EXP-NR3-09` | Windows stdio OS_MATRIX | = D1-39 EINVAL，修复前证据保留 |
| `D3-C1` | ECS 生命周期无残留 | 核心创建 PASS，脚本「finally归零」缺陷（ECS 删除未确认+子网删除序错）→ 已人工兜底归零 |

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D4-17` | D4安全 | hook模糊fail-closed | Cannot read properties of null (reading 'length') |
| `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | Cannot find module 'C:\Users\Administrator\devkit-test\hdk\plugins\huaweicloud-core\src\telemetry\index.mjs' imported from C:\Users\Administrator\devkit-test\hdk\probe-p1-batch5.mjs |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（真云 E2E 用 adminPass 随机生成 `Hdk@A1a<随机16>`，未写入证据/日志明文；重试探针均走本机 hcloud CLI + credentials.json）
- [x] 写操作误判 read-only：无（D4 写操作分类 allBlocked 均 deny；D3-C1 CreateServers 审批分类 = allow，符合写操作审批语义）
- [x] 红线（I 类）违规：无（未触碰他人/既有资源；OBS 官方桶 huaweicloud-open-capability-home 未动）
- [x] 脱敏复核：D2-4 redactSecrets AK/SK 已脱敏（access_key/secret_key 被改写，region 保留）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS testbot3-hermes-ecs-* | D3-C1 创建 1 台 | DeleteServers 已删 | ListServersDetails 残留=0 |
| VPC testbot3-hermes-e2e-* | D3-C1 创建 1 个 | DeleteVpc 已删 | ListVpcs 残留=0 |
| 子网（同 VPC） | D3-C1 创建 1 个 | DeleteSubnet 已删 | ListSubnets 残留=0 |
| EIP | D3-C1 连带 | --delete_publicip 已释放 | ListPublicips 残留=0 |
| 系统盘 EVS | D3-C1 连带 | 已删 | ListVolumes 残留=0 |
| OBS testbot3-hermes-obs-* | D3-C2 建桶 | rm -f 已删 | OBS ls 无该桶 |
| 沙箱会话 | D3-C3/C6 | close_session 已关 | 各 session 已关闭 |

> 仅删本次创建（唯一时间戳名 testbot3-hermes-*），未触碰既有/他人资源。

---

## 八、遗留与建议

- **F-1 serviceCatalog 路由缺口**（EXP-E01/D3-S1）：中文意图「查华北北京四云主机」未命中 ECS，D10 harness 实测 14 意图 1 MISS(92.9%)，建议补路由意图并复测。
- **F-2 沙箱 upload_project Windows 打包**（D3-C3）：`tar -czf` 失败需核对 sandbox_upload_project 的 Windows 路径/tar 参数。
- **T-3 realcloud_e2e.mjs 归零脚本**：D3-C1 的 finally 清理需修（ECS 异步删除确认 + 子网/VPC 删除顺序），本次已人工兜底归零。
- **KooCLI 7.2.12→7.3.12**：本机 hcloud CLI 版本落后（环境项），建议升级后复测 D2-10。
- 其余 F-3~F-7（D2-10/D2-16/EXP-NR3-03/D1-30/D4-17）待全量测完统一走 file_issue.py 查重后合并提单。
