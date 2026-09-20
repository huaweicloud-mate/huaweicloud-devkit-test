# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D4-25 Python hook 写命令遥测误分类为 cli:invoke（WRITE_OPERATION_RE 无词边界）
- 今日证据：`evidence/new-cases/probe-d4-25-telemetry.stdout.log`（实测 keys=['cli:read','cli:invoke','cli:invoke']，期望 ['cli:read','cli:write','cli:invoke']）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（9 项，AtomCode/Linux）**
    - 历史单内容：**版本**: v1.1.5 (gitHead e7ed6f6) **客户端**: AtomCode (Linux) **类型**: 每日测试 > 本单为 2026-09-20 AtomCode Linux 每日测试的**新增缺陷**合并单。另有 6 项命中历史 issue 已查重不重复开单（见 HISTORY_LINKS.md：D4-2→#731、D4-16→#731、D4-6→#735/#71

## D3-S5 复合中文意图分层路由拆分失败（全角逗号不拆分，仅命中单路 sandbox）
- 今日证据：`evidence/new-cases/probe-new-deterministic.stdout.log`（D3-S5 ≥2 失败断言；#2 与 D10-3/EXP-E 中文路由缺失同族，但全角逗号不拆分是独立新根因）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#762](https://github.com/huaweicloud/huaweicloud-devkit/issues/762)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（3 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.5 - 缺陷：3 项 ## 缺陷清单 ### 6. [P1] D3-S3 沙箱预览出 URL——deploy_check nginx_serving=FAIL - **描述**：sandbox 部署 `deploy_nginx ok=true`（部署成功）但 `deploy_check nginx_serving.status=FAIL`，预览 URL 未就
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（OfficeAce Windows 2026-09-20，8+11 项）**
    - 历史单内容：## 每日测试缺陷合并单 — OfficeAce/Windows/2026-09-20 ### 基本信息 - **客户端**: OfficeAce - **操作系统**: Windows (AMD64) - **被测版本**: huaweicloud-devkit@1.1.5 - **测试日期**: 2026-09-20 - **设计级**: 100 条 (92 PASS, 8 FAIL) - *
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（9 项，AtomCode/Linux）**
    - 历史单内容：**版本**: v1.1.5 (gitHead e7ed6f6) **客户端**: AtomCode (Linux) **类型**: 每日测试 > 本单为 2026-09-20 AtomCode Linux 每日测试的**新增缺陷**合并单。另有 6 项命中历史 issue 已查重不重复开单（见 HISTORY_LINKS.md：D4-2→#731、D4-16→#731、D4-6→#735/#71
  - [#733](https://github.com/huaweicloud/huaweicloud-devkit/issues/733)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（CodeArtsWork Windows 2026-09-18，6 项已知复现）**
    - 历史单内容：## 测试概览 - **客户端**: CodeArtsWork (GLM-5.2) - **OS**: Windows Server (x86_64) - **被测版本**: v1.1.5 (gitHead e7ed6f66) - **测试日期**: 2026-09-18 - **测试结果**: 设计级 80 (PASS 75 / FAIL 5) + 展开级 39 (PASS 27 / FAIL 
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：5 项 ## 缺陷清单 ### 5. [P1] Python/Node 安全钩子策略不一致 - **描述**：同一高危输入（`hcloud configure show`、`hcloud ECS DeleteServers`），Node hook 返回 `deny`，Python hook 返回空（放行）。 - **预期（精确断言）**：Pyt
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#758
