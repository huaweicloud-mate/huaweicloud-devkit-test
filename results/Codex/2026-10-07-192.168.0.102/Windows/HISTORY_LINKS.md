# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## # #2闁跨喐鏋婚幏绋?闁跨喐鏋婚幏绋磆ell wrapper detection misses an MCP path
- 今日证据：
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#730](https://github.com/huaweicloud/huaweicloud-devkit/issues/730)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（Hermes Windows 2026-09-18，4 项）**
    - 历史单内容：## 测试概览 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows Server (x86_64) - **被测版本**: v1.1.5 (gitHead e7ed6f66, PR #696) - **测试日期**: 2026-09-18 - **测试结果**: 设计级 80 (PASS 75 / FAIL 3 / BLOCKED 1 / SPEC-MISM
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#557](https://github.com/huaweicloud/huaweicloud-devkit/issues/557)（open）**[会话级安全] WorkBuddy 内 MCP 写命令无可见审批即执行——approvedByUser 为模型自填参数，客户端连接器未对 MCP 写工具设门禁**
    - 历史单内容：## 现象（真云实测，资源已用后立删） WorkBuddy 5.5.3 会话内发送「创建 VPC test-g3-20260908，请直接执行」： - **无 mcp-approvals.json 新增记录**（文件最新条目为历史会话 15:50），CDP 侧零人工授权点击 - **云上 VPC 真实创建成功**（ListVpcs 确认 ACTIVE，ID df04893a-...；已 Delet
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#658
