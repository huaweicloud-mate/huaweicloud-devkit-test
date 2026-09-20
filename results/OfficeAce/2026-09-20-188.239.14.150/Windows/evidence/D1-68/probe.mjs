// AI生成
// D1-68: 图标离线与区域环境变量
// 1. HUAWEICLOUD_ICONS_OFFLINE=1 → icon-library.mjs loadManifest uses local snapshot
// 2. Region: credentials.mjs uses process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''
// Note: Spec says HUAWEICLOUD_REGION should take priority, but code uses HW_REGION first
