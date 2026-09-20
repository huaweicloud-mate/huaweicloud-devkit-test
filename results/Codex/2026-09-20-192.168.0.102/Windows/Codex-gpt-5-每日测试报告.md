# Codex-gpt-5 Windows 每日测试报告

## 一、测试概述
- 日期：2026-09-20
- 客户端/OS：Codex / Windows
- 被测版本：huaweicloud-devkit 1.1.5
- 执行包：2026-09-20-192.168.0.102

## 二、执行摘要
本轮生成设计级 100 条、展开级 39 条用例。执行顺序为 P0 → P1 → P2；真实执行证据落在 `evidence/`。D1、D2、D4、MCP C4、D10 路由、D9 协议及 cn-north-4 真云补测已运行。

## 三、状态汇总
- 设计级：{'BLOCKED': 24, 'FAIL': 4, 'PASS': 71, 'SPEC-MISMATCH': 1}
- 展开级：{'BLOCKED': 2, 'FAIL': 11, 'PASS': 26}

## 四、缺陷清单
详见同目录 `FINDINGS.md`。本轮有 P0/P1 缺陷，统一提单前需先查重。

## 五、未执行用例与原因
真云补测后仍保留的 BLOCKED：D3-S1 因 cn-north-4 当前 ECS 数为 0，缺少“至少 1 台 ECS”前置；D3-S4 因账号已领取一次性代金券，无法恢复到 claimed=false；D3-S7 因尚未具备 RDS 所需隔离 VPC 子网/安全组、可售规格/AZ 查询与不落盘数据库口令注入链路。三项均已写入 CSV 的 `blockedReason`，含实测时间、影响和解除条件。

## 六、安全/红线
- 真云补测严格使用 `tctest-codex-20260920` 资源标识；OBS 桶和 VPC 均在验证后删除并复核归零，未触碰既有资源。
- PASS 仅回填到有本轮 probe stdout 的用例。
- 未修改 test-cases、Summary 或其他客户端目录。

## 七、资源释放
OBS 临时桶已删除，OBS 列表只剩原有桶；临时 VPC 已删除，VPC 列表为 0。沙箱连接已建立并通过临时凭证校验，因 D3-S7 尚未进入部署阶段，需按其清理流程继续关闭会话。

## 八、遗留建议
优先修复 D4-16、D2-4/D4-27、D9-2，再复测 D10 路由命中率；补齐 Codex Windows hook/GUI harness 后收敛 BLOCKED。
