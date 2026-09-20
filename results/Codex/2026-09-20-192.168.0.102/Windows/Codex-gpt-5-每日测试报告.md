# Codex-gpt-5 Windows 每日测试报告

## 一、测试概述
- 日期：2026-09-20
- 客户端/OS：Codex / Windows
- 被测版本：huaweicloud-devkit 1.1.5
- 执行包：2026-09-20-192.168.0.102

## 二、执行摘要
本轮生成设计级 100 条、展开级 39 条用例。执行顺序为 P0 → P1 → P2；真实执行证据落在 `evidence/`。D1、D2、D4、MCP C4、D10 路由和 D9 协议探针已运行。

## 三、状态汇总
- 设计级：{'BLOCKED': 26, 'FAIL': 4, 'PASS': 69, 'SPEC-MISMATCH': 1}
- 展开级：{'BLOCKED': 2, 'FAIL': 11, 'PASS': 26}

## 四、缺陷清单
详见同目录 `FINDINGS.md`。本轮有 P0/P1 缺陷，统一提单前需先查重。

## 五、未执行用例与原因
所有 BLOCKED/NOT_RUN 行均已在 CSV 的 `blockedReason` 写明分类、实测时间、影响和解除条件；未将环境阻塞伪装为 PASS。

## 六、安全/红线
- 真云破坏性创建/删除未在本轮执行，未生成资源。
- PASS 仅回填到有本轮 probe stdout 的用例。
- 未修改 test-cases、Summary 或其他客户端目录。

## 七、资源释放
本轮只进行了工具层/协议层探针与只读检查，无创建云资源；临时测试文件由探针清理。

## 八、遗留建议
优先修复 D4-16、D2-4/D4-27、D9-2，再复测 D10 路由命中率；补齐 Codex Windows hook/GUI harness 后收敛 BLOCKED。
