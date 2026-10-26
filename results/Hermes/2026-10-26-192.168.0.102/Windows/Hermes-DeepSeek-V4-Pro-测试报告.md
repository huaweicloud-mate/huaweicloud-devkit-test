# Hermes-DeepSeek-V4-Pro 每日测试报告
> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成/核验时间**：2026-10-26 11:55:00（北京时间，检查阶段 gate 后核验）
> **执行归档**：`results/Hermes/2026-10-26-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）@ 1.1.12（hdk commit 4ed0780）
> **结论**：`PARTIAL`（有 FAIL 缺陷，含已知 P0 2 项；PASS/覆盖率两门禁均通过）

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

## 二、执行结果（含覆盖率）

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `150` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `137 / 11 / 2 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 148） | `92.6%` |
| 执行覆盖率（NOT_RUN + 空 = 0） | `100%` |
| P0 用例（设计级 21 + 展开级 1 = 22） | 无 NOT_RUN / 空 |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零（见第五节）` |

### 状态汇总

| 状态 | 设计级 | 展开级 | 合计 |
|---|---|---|---|
| PASS | 97 | 40 | **137** |
| FAIL | 8 | 3 | **11** |
| BLOCKED | 2 | 0 | **2** |
| SPEC-MISMATCH | 0 | 0 | **0** |
| NOT_RUN | 0 | 0 | **0** |
| **合计** | **107** | **43** | **150** |

### 门禁核验（检查阶段）

| 门禁 | 命令 | 结果 |
|---|---|---|
| PASS 门禁 | `verify_no_fake_pass.py Hermes Windows` | ✅ 通过（所有 PASS 用例均有 evidencePath 且证据存在） |
| 覆盖率门禁 | `verify_coverage.py Hermes Windows` | ✅ 通过（NOT_RUN+空占比 0.0%，P0 无 NOT_RUN/空） |

---

## 三、缺陷清单（FAIL 根因，带文件:行号）

**A. 产品缺陷（新增，待全量测完统一 file_issue.py 历史查重后合并提单）— 7 条（F-1~F-7）**

| # | 级别 | 用例 | 标题 | 根因（文件:行号） |
|---|---|---|---|---|
| F-1 | P1 | EXP-E01 / D3-S1 | serviceCatalog 中文意图路由未命中「查云主机」 | 探针直调 `huaweicloud_service_catalog(intent="帮我查一下…云主机")` 返回通用 help 未路由 ECS；D10 harness 14 意图 1 MISS(92.9%)。源 `src/hcloud-cli.mjs` service_catalog 路由表 |
| F-2 | P1 | D3-C3 | 沙箱部署 E2E：upload_project Windows 打包失败 | `huaweicloud_sandbox_upload_project` 内部 `tar -czf C:\...\sandbox-upload-...` Command failed → deploy_nginx 无项目（疑似 Windows 路径/tar 参数问题） |
| F-3 | P1 | D2-10 | R7 current 档跟随 / KooCLI profile 管理 | 探针断言 profile 管理=false；源 `src/auth` + koocli 相关模块，待源码核对 |
| F-4 | P1 | D2-16 | import 文件读取后擦除 | auth switch/import=false，import 文件读取后未擦除；源 `src/auth/credentials.mjs` |
| F-5 | P1 | EXP-NR3-03 | 更新 dismiss 持久化 | skip file=true / dismissed=false / persistent=true，dismiss 标记未落盘 |
| F-6 | P2 | D1-30 | semver 比对正确性 | `src/update-check.mjs:53 semverCompare → comparePre` 预发布比较边界有误 |
| F-7 | P1 | D4-17 | hook 模糊 fail-closed（null 解引用） | 模糊输入返回 null 后读 `.length` 抛 "Cannot read properties of null"；源 `src/risk-rule-engine.mjs evaluateCommandRisk` |

**B. 已知/预期 FAIL（已上报或产品已规避，非本次新增）— 2 条**

| # | 用例 | 说明 |
|---|---|---|
| K-1 | D1-39 + EXP-NR3-09 | Windows `spawnSync('npm.cmd')` 无 shell:true 抛 EINVAL；产品已 `update-check.mjs:263-265` shell:true 规避（注释引用 #643），探针保留修复前证据按预期判 FAIL |

**C. 测试端问题（探针/脚本路径或断言，非产品缺陷）— 3 条**

| # | 用例 | 说明 |
|---|---|---|
| T-1 | D3-A1 | 探针查 `hdk根/skills` 仅 1 个 SKILL.md（需≥20），实际技能在 `plugins/huaweicloud-core/skills`（探针路径口径偏差） |
| T-2 | D8-9 | 探针 import `telemetry/index.mjs` 路径不存在，实际模块 `telemetry.mjs`（探针 import 路径需修） |
| T-3 | D3-C1 | 核心创建流程 PASS（VPC/子网/ECS/审批），但 realcloud_e2e.mjs「finally 归零」脚本缺陷（ECS 异步删除 150s 轮询未确认即删子网/VPC 触发 VPC.0104），已人工兜底归零。归零脚本需修 |

---

## 四、阻塞项（BLOCKED）

| 用例ID | 维度 | 标题 | 阻塞原因 | 归口 |
|---|---|---|---|---|
| `D4-17` | D4安全 | hook 模糊 fail-closed | Cannot read properties of null (reading 'length') | 产品缺陷（F-7） |
| `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | Cannot find module `.../src/telemetry/index.mjs` | 测试端（T-2） |

---

## 五、资源清理声明（归零）

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS testbot3-hermes-ecs-* | D3-C1 创建 1 台 | DeleteServers 已删（20s 内归零） | ListServersDetails 残留=0 |
| VPC testbot3-hermes-e2e-* | D3-C1 创建 1 个 | DeleteVpc 已删 | ListVpcs 残留=0 |
| 子网（同 VPC） | D3-C1 创建 1 个 | DeleteSubnet 已删 | ListSubnets 残留=0 |
| EIP | D3-C1 连带 | --delete_publicip=true 已释放 | ListPublicips 残留=0 |
| 系统盘 EVS | D3-C1 连带 | 已删 | ListVolumes 残留=0 |
| OBS testbot3-hermes-obs-* | D3-C2 建桶 | rm -f 已删 | OBS ls 无该桶 |
| 沙箱会话 | D3-C3/C6 connect | close_session 已关 | 各 session 已关闭 |

> 仅删本次创建（唯一时间戳名 testbot3-hermes-*），未触碰既有/他人资源（如官方桶 huaweicloud-open-capability-home）。

---

## 六、覆盖率

- 执行覆盖率 `100%`：150 条用例全量真机执行，NOT_RUN = 0、空状态 = 0。
- P0 用例 22 条（设计级 21 + 展开级 1）全部执行，无 NOT_RUN / 空。
- 覆盖率门禁通过（NOT_RUN+空占比 0.0%，阈值 15%）。

---

## 七、安全与红线合规

- [x] 凭证泄漏：无（真云 E2E 用 adminPass 随机生成 `Hdk@A1a<随机16>`，未写入证据/日志明文；重试探针走本机 hcloud CLI + credentials.json）
- [x] 写操作误判 read-only：无（D4 写操作分类 allBlocked 均 deny；D3-C1 CreateServers 审批分类 = allow，符合写操作审批语义）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：D2-4 redactSecrets AK/SK 已脱敏

---

## 八、遗留与建议

- **F-1 serviceCatalog 路由缺口**（EXP-E01/D3-S1）：中文意图「查华北北京四云主机」未命中 ECS，D10 harness 实测 14 意图 1 MISS(92.9%)，建议补路由意图并复测。
- **F-2 沙箱 upload_project Windows 打包**（D3-C3）：核对 sandbox_upload_project 的 Windows 路径/tar 参数。
- **T-3 realcloud_e2e.mjs 归零脚本**：D3-C1 finally 清理需修（ECS 异步删除确认 + 子网/VPC 删除顺序），本次已人工兜底归零。
- **KooCLI 7.2.12→7.3.12**：本机 hcloud CLI 版本落后（环境项），建议升级后复测 D2-10。
- 产品缺陷 F-1~F-7 待全量测完统一走 file_issue.py 历史查重后合并提单（**不拆单、不逐日提**，检查阶段只汇总）。