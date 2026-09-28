# HISTORY_LINKS — v1.1.7 版本全量测试提单状态

> 客户端: OpenCode | 日期: 2026-09-28 | 版本: v1.1.7

## 提单状态

**状态: 待提单（gh CLI 未安装，需维护者代提）**

file_issue.py 已解析 8 项缺陷，但因本机未安装 gh CLI 且未设置 HDK_GH_TOKEN 环境变量，无法自动查重和提单。

## 缺陷清单（待提单到 huaweicloud/huaweicloud-devkit）

| # | 优先级 | 用例 | 标题 | 根因 |
|---|---|---|---|---|
| 1 | P0 | D4-16 | sh -c 包装器绕过未拦截 | safety-policy.mjs:70-89 |
| 2 | P1 | D4-27 | JSON 凭证双路径脱敏不完整 | safety-policy.mjs:34-46 |
| 3 | P1 | D9-2 | JSON-RPC invalid params 错误码未返回 | mcp-protocol.mjs:74-78 |
| 4 | SPEC | D9-9 | notifications.cancellation 未声明 | mcp-protocol.mjs:47-49 |
| 5 | P1 | EXP-E01~E14 | service_catalog 路由准确率 21.4% | service-catalog 路由逻辑 |
| 6 | P1 | D3-C1/C2 | 真云 ECS/OBS 认证失败 | AK/SK 过期或权限不足 |
| 7 | P1 | D3-C3/C6 | 沙箱 E2E 连接失败 | 沙箱服务不可达+协议未签 |
| 8 | P1 | D3-C7 | list_regions 返回 undefined | 工具返回值序列化异常 |

## 历史查重

因 gh CLI 不可用，未完成历史查重。建议维护者提单时：
1. 搜索 huaweicloud/huaweicloud-devkit open issues 查重
2. D4-16 可能关联 #650（safety-policy unwrap 修复）
3. EXP-E01~E14 路由问题可能已有相关 issue
4. 命中历史单则不重复开单，仅在既有单上补复核评论
