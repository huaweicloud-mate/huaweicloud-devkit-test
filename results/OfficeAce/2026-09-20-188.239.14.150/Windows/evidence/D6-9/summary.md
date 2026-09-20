# D6-9: 缓存清理三入口

## 结果: PASS ✅

## 三入口验证

### invalidateUpdateCache
- **描述**: 清除更新检测缓存 (cachedDistTags, cachedAt, failedAt, inflightQuery, lastHint)
- **源码位置**: `update-check.mjs:302`
- **调用入口**:
  - `tools.mjs:1503 (handleCheckUpdate dismiss=true)`
  - `update-check.mjs:424 (upgradePackage success)`
- **结果**: PASS ✅


### clearRuntimeCredentials
- **描述**: 清除运行时凭证覆盖 (内存中的AK/SK/region)
- **源码位置**: `auth/credentials.mjs`
- **调用入口**:
  - `tools.mjs:1146 (huaweicloud_auth_init clear=true)`
  - `tools.mjs:1159 (huaweicloud_auth_switch action=clear)`
- **结果**: PASS ✅


### clearUserHash
- **描述**: 清除遥测用户哈希 (内存 + user-hash 文件)
- **源码位置**: `telemetry/telemetry.mjs:320`
- **调用入口**:
  - `tools.mjs:1051 (refreshUserHashAfterAuthChange)`
  - `Called after: auth_sync, auth_init, auth_switch`
- **结果**: PASS ✅


## 结论
三个缓存清理入口均正常工作，清除后状态正确重置。
