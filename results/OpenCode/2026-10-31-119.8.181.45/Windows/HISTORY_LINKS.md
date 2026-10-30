# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D4-3 明文secret API拦截——ListPermanentAccessKeys 凭证外泄未拦截
- 今日证据：`evidence/D4-3/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)（open）**[测试报告] huaweicloud-devkit v1.1.13-next.0 每日测试缺陷合并单（12 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.13-next.0 - 缺陷：12 项 ## 缺陷清单 ### 1. [P0] D4-16 sh -c 命令包裹穿透（凭证 env 打印绕过） - **描述**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `decision=allow, findings=[]`
  - [#864](https://github.com/huaweicloud/huaweicloud-devkit/issues/864)（open）**[每日测试] CodeArtsSpace-GLM-5.2 Windows 2026-10-09 daily 缺陷合并单（8 项）**
    - 历史单内容：# FINDINGS — CodeArtsSpace Windows 每日测试 2026-10-09 > 被测版本：huaweicloud-devkit@1.1.8-next.1 > 客户端：CodeArtsSpace | OS：Windows | IP：120.46.40.202 > 执行时间：2026-10-09 05:08（北京时间） > 测试报告：results/CodeArtsSpace
  - [#858](https://github.com/huaweicloud/huaweicloud-devkit/issues/858)（open）**[daily-test] CodeArtsSpace Windows 2026-10-07: 8 缺陷 (4 P0 + 4 P1) huaweicloud-devkit@1.1.8-next.1**
    - 历史单内容：## 每日测试缺陷汇总 | 项 | 值 | |---|---| | 客户端 | CodeArtsSpace (GLM-5.2) | | OS | Windows | | 日期 | 2026-10-07 | | 被测版本 | huaweicloud-devkit@1.1.8-next.1 | | 测试结果 | 132 PASS / 8 FAIL / 1 NOT_RUN (共 141) | | 通过率
  - [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845)（open）**[daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 (8 FAIL: P0x4 P1x4)**
    - 历史单内容：## 每日测试缺陷汇总 — CodeArtsSpace / Windows / 2026-10-02 **被测版本**：huaweicloud-devkit@1.1.8-next.1 **测试客户端**：CodeArtsSpace (GLM-5.2) **执行环境**：Windows / 120.46.40.202 **测试结果**：133 PASS / 8 FAIL / 0 BLOCKED (通
  - [#841](https://github.com/huaweicloud/huaweicloud-devkit/issues/841)（open）**[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（8 项历史，CodeArtsSpace Windows 2026-10-01）**
    - 历史单内容：## 测试报告: CodeArtsSpace Windows 2026-10-01 每日测试 - **客户端**: CodeArtsSpace (GLM-5.2) - **OS**: Windows - **被测版本**: 1.1.8-next.1 - **执行时间**: 2026-10-01 05:15 BJT - **用例数**: 141 (设计级 102 + 展开级 39) - **结果**
  - [#797](https://github.com/huaweicloud/huaweicloud-devkit/issues/797)（open）**[每日测试] OfficeAce Windows 2026-09-22: 22 FAIL / 1 BLOCKED (v1.1.5)**
    - 历史单内容：## 测试概况 - **客户端**: OfficeAce (glm-5.2) - **OS**: Windows - **日期**: 2026-09-22 - **被测版本**: huaweicloud-devkit@1.1.5 - **总用例**: 139 (设计级 100 + 展开级 39) - **结果**: 116 PASS / 22 FAIL / 1 BLOCKED - **通过率**:
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（OfficeAce Windows 2026-09-20，8+11 项）**
    - 历史单内容：## 每日测试缺陷合并单 — OfficeAce/Windows/2026-09-20 ### 基本信息 - **客户端**: OfficeAce - **操作系统**: Windows (AMD64) - **被测版本**: huaweicloud-devkit@1.1.5 - **测试日期**: 2026-09-20 - **设计级**: 100 条 (92 PASS, 8 FAIL) - *
  - [#712](https://github.com/huaweicloud/huaweicloud-devkit/issues/712)（open）**[P1] D4-6 adminPass 参数回显无警告（CodeArtsWork v1.1.5 每日测试）**
    - 历史单内容：## 测试概览 - **用例**：D4-6 - **优先级**：P1 - **客户端**：CodeArtsWork (GLM-5.2) - **OS**：Windows - **被测版本**：v1.1.5 ## 现象 `hook_check_command('hcloud ECS CreateServers --adminPass MyPassword123')` 返回 `allow`，admin
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#852, #679, #673

## D4-7 高危输入拦截——curl|bash 远程代码执行未拦截
- 今日证据：`evidence/D4-7/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（9 项，AtomCode/Linux）**
    - 历史单内容：**版本**: v1.1.5 (gitHead e7ed6f6) **客户端**: AtomCode (Linux) **类型**: 每日测试 > 本单为 2026-09-20 AtomCode Linux 每日测试的**新增缺陷**合并单。另有 6 项命中历史 issue 已查重不重复开单（见 HISTORY_LINKS.md：D4-2→#731、D4-16→#731、D4-6→#735/#71
