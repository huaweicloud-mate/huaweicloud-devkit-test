# HISTORY_LINKS — Hermes Windows 每日测试 2026-10-11

## 历史问题关联清单

以下缺陷在历史 issue 中已有记录，不重复开单：

### #1 D1-39/EXP-NR3-09 Windows spawnSync EINVAL (P0)
- **历史单**: #554 (Windows spawnSync EINVAL 已知缺陷)
- **关联**: 本次测试复现确认该缺陷仍存在，未修复

### #7 EXP-E01~E14 serviceCatalog 中文意图路由 MISS (P1, 已知基线)
- **历史单**: #805 (Hermes-GLM-5.2 2026-09-23 EXP-E01~E14 路由基线)
- **历史单**: #845 (safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失)
- **关联**: 本次测试路由命中率 21.4% 与已知基线一致，非新缺陷

### #2 D2-10 R7 current档跟随 (P1, 环境依赖)
- **说明**: 本机无 KooCLI profile 配置导致 FAIL，非代码缺陷

### #3 D2-16 import文件擦除 (P1)
- **说明**: 需确认功能是否已实现

### #4 D3-A1 skill检索完整性 (P1, 环境依赖)
- **说明**: 本机技能目录不全导致 FAIL，非代码缺陷

### #5 D3-S1 serviceCatalog不可直调 (P1, 探针限制)
- **说明**: 探针限制，非代码缺陷

### #6 D6-3 MCP冷启时间 (P2, 探针限制)
- **说明**: 探针限制，非代码缺陷
