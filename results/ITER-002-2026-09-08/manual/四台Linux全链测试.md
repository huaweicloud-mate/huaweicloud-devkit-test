# ITER-002-2026-09-08 四台 Linux 测试机全链测试结果

## 结果：4/4 打通（hcloud + 凭证 + 真云只读）

| 机器 | hcloud | 隐私/凭证 | ECS 查询 | Flavors | BSS |
|---|---|---|---|---|---|
| zhangshuang | 7.2.12 ✅ | ✅ | ✅ `{"servers":[]}` | ✅ 2 | ⚠️ Unsupported |
| testbot1 | 7.2.12 ✅ | ✅ | ✅ | ✅ 2 | ⚠️ Unsupported |
| testbot2 | 7.2.12 ✅ | ✅ | ✅ | ✅ 2 | ⚠️ Unsupported |
| testbot3 | 7.2.12 ✅ | ✅ | ✅ | ✅ 2 | ⚠️ Unsupported |

（全部只读操作，零资源创建/删除——红线遵守）

## OBS-4 观察（跨平台服务差异）

- **现象**：`hcloud BSS ShowCustomerAccountBalances` 在 **4 台 Linux(ARM64) 全部 `Unsupported service: BSS`**；**本机 Windows hcloud 7.2.12 同版本支持 BSS**
- **影响**：Linux 环境 devkit 的余额查询（BSS）不可用——**与 DSH/手测场景呼应**（此前 huawei-iac 5A/6A 在 Linux 走 EIP 计费也受阻；1A 手测在 zhangshuang 用 BSS 查询时实际走了 SDK 或跳过）——Linux 上余额类能力需 SDK/替代通道
- **待确认**：KooCLI Linux arm64 构建的服务清单缺失 BSS（构建差异）或在线元数据拉取失败；建议反馈 KooCLI/记录到测试矩阵（D3 冒烟在 Linux 的 BSS 分支记为环境受限）

## 附带收获

- 4 台 Linux 测试机现已全部具备：devkit 1.1.1 插件 + hcloud 7.2.12 + 测试账号凭证 + 真云只读通道——**多机并行真云测试资源就绪**
- 免 sudo 部署路径固化（~/node22 + ~/bin + 隐私接受 printf 'y'）

## 复现

- test-cases/probe-all-machines.py / remote-1machine.py <name>（单台全链）/ remote-4machines.py（并行版）
- OBS-4 快速验证：Linux `hcloud BSS --help` vs Windows 同命令