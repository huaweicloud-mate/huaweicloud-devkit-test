# D8-9: 安装ID与遥测值脱敏

## 结果: PASS ✅

## 源码检查

### 1. 安装ID (双重SHA-256哈希)
- 机器指纹使用SHA-256: ✅
- 指纹公式 host|MAC|osType|homedir: ✅
- installId = SHA-256(finger): ✅
- 安装ID与指纹分离存储: ✅
- 原始指纹不出现在事件中: ✅

### 2. 用户哈希 (服务端生成)
- userHash来自服务端API: ✅
- userHash非原始凭据: ✅

### 3. 值脱敏 (sanitizeValue)
- 去除空白字符: ✅
- 截断至255字符: ✅
- 应用于事件值: ✅

### 4. 事件结构
- 事件字段正确: ✅
- 无原始凭据字段: ✅

### 5. OS字段 (通用类型)
- 事件os/osVersion来自osTypeStr/osVersionStr: ✅
- osType/osRelease来自node:os模块: ✅

### 6. 安全策略脱敏
- redactSecrets函数存在: ✅
- AK/SK脱敏: ✅
- 密码脱敏: ✅
- <redacted>标记: ✅

### 7. 传输安全
- HTTPS端点: ✅

## 实际文件验证

### 安装ID
- 长度: 64, 64位hex: ✅, 不含原始主机名: ✅

### 机器指纹
- 长度: 64, 64位hex: ✅, 不含原始主机名: ✅

### 用户哈希
- 文件不存在 (未登录)

## 结论
安装ID和遥测值均经过脱敏处理，无原始标识符泄露。
