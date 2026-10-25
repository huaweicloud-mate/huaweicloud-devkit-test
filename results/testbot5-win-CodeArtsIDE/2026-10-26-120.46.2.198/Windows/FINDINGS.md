# FINDINGS - 2026-10-26 每日测试

| ID | 严重度 | 用例 | 描述 | 状态 |
|----|--------|------|------|------|
| F-1 | Low | D1-3 | KooCLI 版本不匹配: 安装 7.2.12 vs 配对 7.3.12 | open |
| F-2 | Low | D3-C7 | list_regions hcloud unavailable, 降级静态区域列表 | open |
| F-3 | Info | N/A | github.com 网络不通, 使用 GitCode 镜像拉取测试仓库 | open |

## 详情

### F-1: KooCLI 版本不匹配
- **用例**: D1-3
- **严重度**: Low
- **现象**: `mcp_huaweicloud_check_cli` 返回 installed=true, authenticated=true, version_mismatch=true
- **根因**: 本机 KooCLI 7.2.12 低于插件配对版本 7.3.12
- **影响**: 部分 7.3.12 新增 API 可能不可用
- **修复建议**: `hcloud update` 升级到 7.3.12

### F-2: list_regions hcloud 不可用
- **用例**: D3-C7
- **严重度**: Low
- **现象**: `mcp_huaweicloud_list_regions` 返回 ok=false, hcloud unavailable, 降级 9 个静态区域
- **根因**: hcloud IAM KeystoneListRegions 调用失败（可能权限或网络）
- **影响**: 区域列表不完整
- **修复建议**: 检查 IAM 只读权限或网络连通性

### F-3: github.com 网络不通
- **用例**: N/A (环境问题)
- **严重度**: Info
- **现象**: git clone https://github.com/huaweicloud/huaweicloud-devkit.git 超时
- **根因**: 本机网络无法访问 github.com
- **影响**: 源码仓库 hdk 未 clone，测试仓库通过 GitCode 镜像拉取
- **修复建议**: 配置 GitHub 代理或统一使用 GitCode 镜像
