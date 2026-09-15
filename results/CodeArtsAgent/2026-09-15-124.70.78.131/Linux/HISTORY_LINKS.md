# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## framework 集成安全策略版本漂移 — Apply* 写操作被误判为只读放行
- 今日证据：`evidence/D4-5/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#685](https://github.com/huaweicloud/huaweicloud-devkit/issues/685)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：1 项 ## 缺陷清单 ### 1. [P0] framework 集成安全策略版本漂移 — Apply* 写操作被误判为只读放行 - **描述**：`huaweicloud_plan_cli_command args=["EIP","ApplyEip"]` 返回 `{decision:allow, risk:unknown_read}`（写操
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#679
