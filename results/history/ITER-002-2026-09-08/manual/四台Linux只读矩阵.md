# ITER-002-2026-09-08 四台 Linux 只读矩阵（8 类服务）

## 结果：4 台 × 8 类只读全部通过（真实空账号数据）

| 服务 | zhangshuang | testbot1 | testbot2 | testbot3 |
|---|---|---|---|---|
| VPC ListVpcs | ✅ | ✅ | ✅ | ✅ |
| VPC ListSubnets | ✅ | ✅ | ✅ | ✅ |
| VPC ListSecurityGroups | ✅ | ✅ | ✅ | ✅ |
| FunctionGraph ListFunctions | ✅ 0 | ✅ 0 | ✅ 0 | ✅ 0 |
| IMS ListImages(private) | ✅ | ✅ | ✅ | ✅ |
| **OBS ls** | ✅ **Bucket number: 0**（大写/小写均可用，实锤） | ✅ 0 | ✅ 0 | ✅ 0 |
| RDS ListInstances | ✅ 0 | ✅ 0 | ✅ 0 | ✅ 0 |
| ECS NovaListKeypairs | ✅ | ✅ | ✅ | ✅ |

- 全部只读，零资源创建/删除（红线遵守）
- 数量 0 = 账号真实空（与 CTS/早前盘点一致）；列表类 OK = 服务/凭证/网络全通
- **BSS（余额）= 唯一平台差异**（Linux ARM64 Unsupported，Windows 支持——OBS-4 已记录）

## 结论

4 台 Linux 真云只读能力**全面验证通过**（8/8 服务，BSS 除外）——多机并行只读测试资源完全就绪；OBS-4（BSS）为后续反馈项。

## 复现

- test-cases/remote-readmatrix.py（并行 4 台 × 8 服务）
- test-cases/diag-obs-linux.py（OBS Linux 用法实锤）