# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D10-3 / EXP-E01~E14 serviceCatalog 中文意图路由准确率低（21.4%远低于90%目标）
- 今日证据：`evidence/EXP-E01/eval-run.csv`（全量15条评测结果CSV），`evidence/d5-c4-probe.mjs`（probe脚本），eval harness 命令：`node eval/harness/run-eval.mjs <mcp-server.mjs>`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#733](https://github.com/huaweicloud/huaweicloud-devkit/issues/733)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（CodeArtsWork Windows 2026-09-18，6 项已知复现）**
    - 历史单内容：## 测试概览 - **客户端**: CodeArtsWork (GLM-5.2) - **OS**: Windows Server (x86_64) - **被测版本**: v1.1.5 (gitHead e7ed6f66) - **测试日期**: 2026-09-18 - **测试结果**: 设计级 80 (PASS 75 / FAIL 5) + 展开级 39 (PASS 27 / FAIL 
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：5 项 ## 缺陷清单 ### 5. [P1] Python/Node 安全钩子策略不一致 - **描述**：同一高危输入（`hcloud configure show`、`hcloud ECS DeleteServers`），Node hook 返回 `deny`，Python hook 返回空（放行）。 - **预期（精确断言）**：Pyt
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt

## D1-27 / D1-31 check_update 在 Windows 下返回 check_failed 而非 up_to_date
- 今日证据：`evidence/D1-27/probe.txt`（result=check_failed），`evidence/D1-31/probe.txt`（dismiss 后 result=check_failed），`evidence/p0-design-probe.mjs`（probe脚本）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
