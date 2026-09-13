**凭据无关终证（SDK 直连实验，2026-09-08）**：

在 Linux（同账号同 AK/SK 环境）**绕过 KooCLI，用 Python SDK（`GlobalCredentials`）直连 BSS REST API**：

```
BSS DIRECT OK: 账户数=2 | 现金余额示例: [1CNY]   ← 真实余额 1 元
```

结论：
- **AK/SK 凭据与网络完全正常**（余额经 SDK 成功取回，与 Windows KooCLI 查询结果一致 = 1 CNY）
- **BSS 服务本身可用**（REST 正常响应）
- **唯一故障点 = KooCLI Linux/ARM64 本地服务清单缺失 BSS（及另 30 个服务）**——纯本地构建差异，与账号/凭据/网络无关；KooCLI 侧修复（补齐 arm64 服务元数据）或用户在 Linux 走 SDK 通道即可绕开。