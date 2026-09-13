# ITER-002-2026-09-08 Windows×2 真云只读矩阵 + BSS 跨平台终证

## 结果：两台 Windows 全部通过

| 项 | win188 | win120 |
|---|---|---|
| hcloud 安装（官方 Windows 包） | ✅ | ✅ |
| 隐私+凭证配置 | ✅ | ✅ |
| ECS NovaListServers | ✅ `servers:[]` | ✅ 同 |
| ListFlavors | ✅ 2 | ✅ 2 |
| **BSS 余额** | ✅ **可用**（amount 返回） | ✅ **可用** |
| VPC ListVpcs | ✅（版本提示正常） | ✅ |

## BSS 跨平台终证（OBS-4 闭环）

```
同一账号/同一 AK/SK：
  Windows（本机 + win188 + win120）：BSS ✅ 正常（132 个服务）
  Linux ARM64（4 台）：BSS ❌ Unsupported（101 个服务，缺 31）
→ KooCLI 平台服务清单差异最终确认：Windows 版含 BSS/GEIP 等 31 个，
  Linux(ARM64) 版缺失（构建差异）——与账号/凭据/网络无关（此前 SDK 直连已证）
```

## 意义

- D7 Windows 平台扩展：2 台独立 Windows 上"插件+hcloud+凭证+真云只读"全链通过（与 Linux 4 台并列）
- 测试机矩阵：**6 台远程机（4 Linux + 2 Windows）全部真云只读可用**（BSS 仅 Windows）
- OBS-5（Node20 前置仅 warn）一并留档

## 复现

- test-cases/win-hcloud.py（188/120 全链+只读矩阵）