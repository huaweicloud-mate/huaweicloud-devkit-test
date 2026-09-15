# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D1-2 Windows 自动探测把 OfficeAce 误纳入多 Agent 结果
- 今日证据：`evidence/D1-2/stdout.log`；`evidence/final-suite/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#654](https://github.com/huaweicloud/huaweicloud-devkit/issues/654)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.3 全量测试缺陷合并单（2 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.3 - 缺陷：2 项 ## 缺陷清单 ### 1. [P1] 安装自动探测结果与测试契约不一致 - **描述**：Windows Node 测试 `install auto-detect with multiple agents requires explicit target in non-interactive shells` 期望只报告 `
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#684
