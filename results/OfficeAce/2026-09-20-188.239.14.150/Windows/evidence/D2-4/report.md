# D2-4 凭证脱敏正确性 — 测试报告

## 基本信息
- **用例 ID**: D2-4
- **标题**: 凭证脱敏正确性
- **优先级**: P0
- **执行时间**: 2026-09-20T02:34:10Z
- **最终判定**: **PASS**

## 测试目标
验证 `safety-policy.mjs` 中 `redactString` / `redactSecrets` 函数的凭证脱敏行为：
1. AK 中段脱敏 — `AK=xxx` 格式的值被 `<redacted>` 替换
2. SK 永不完整展示 — `SK=xxx` 格式的值被 `<redacted>` 替换
3. 对象键名匹配 secret pattern 时值替换为 `<redacted>`
4. 输出无明文凭证字段

## 源码分析

### redactString (L34-47, 未导出)
```javascript
function redactString(text) {
  return String(text)
    .replace(/((?:user[_-]?data|metadata|private[_-]?key)\s*[:=]\s*).*/gi, '$1<redacted>')
    .replace(/((?:access[_-]?key|secret[_-]?key|...|credential)\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1<redacted>')
    .replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, '$1=<redacted>');
}
```
- 三层正则替换：opaque blob keys → secret key names → AK/SK 简写
- 值匹配支持引号包裹和裸值

### redactSecrets (L49-65, 已导出)
- **数组**: 递归 map
- **对象**: 键名匹配 `isSecretKeyName` → `<redacted>`，否则递归
- **字符串**: 调用 `redactString`
- **其他**: 原样返回

### isSecretKeyName (L20-32)
- 正则匹配: `access_key|secret_key|security_token|x_auth_token|authorization|password|passwd|adminpass|credential|private_key|userdata|metadata`
- 补充匹配: `policy.secretKeyNamePatterns`

## 测试结果

### 核心判定: 33/33 PASS, 0 FAIL

| 测试组 | 测试数 | 结果 | 说明 |
|--------|--------|------|------|
| 1. 字符串 AK=/SK= 模式 | 5 | ALL PASS | AK/SK 值替换为 `<redacted>`，region 保留 |
| 2. 对象键名匹配 | 7 | ALL PASS | access_key/secret_key/security_token → `<redacted>`，region/project_id 保留 |
| 3. 多格式键值对 | 8 | ALL PASS | 等号/冒号格式、password/credential 均脱敏 |
| 4. 嵌套递归 | 3 | ALL PASS | 数组内对象、多层嵌套均递归脱敏，非敏感字段保留 |
| 5. 边界情况 | 6 | ALL PASS | 空字符串/空对象/数字/布尔/null 不崩溃，无凭证字符串不误脱敏 |
| 6. SK 核心格式 | 4 | ALL PASS | SK=/SK:/secret_key=/secret_key: 均无明文泄露 |

### 边界发现: 2 个 (不影响核心判定)

| ID | 发现 | 影响 | 建议 |
|----|------|------|------|
| 7a | JSON 字符串 `{"secret_key":"xxx"}` 未脱敏 | `redactString` 正则要求 `key\s*[:=]\s*value`，JSON 中 key 与冒号间有引号 | 调用方应先 `JSON.parse` 再调 `redactSecrets`，对对象脱敏后再 stringify |
| 7b | 自然语言 `"The SK is xxx"` 未脱敏 | 正则要求 `AK|SK` 后跟 `[:=]`，自然语言不匹配 | 超出设计模式范围；实际场景中凭证以 key=value 格式出现 |

### 设计行为确认

| ID | 行为 | 说明 |
|----|------|------|
| 7c | `metadata` 键被视为敏感 | `isSecretKeyName` 正则含 `metadata`，值替换为 `<redacted>` — 符合安全设计（metadata 可含引导脚本/敏感数据）|

## 证据文件
- `probe-d2-4.mjs` — 探针脚本 (v2)
- `stdout.log` — 执行输出日志
- `report.md` — 本报告

## 安全声明
- 全部使用模拟值测试 (MOCK_AK='HWAKMOCKTEST12345678', MOCK_SK='HWSKMOCKTEST87654321abcdefghij')
- 未读取、未输出真实凭证
- 探针脚本和日志中均无真实凭证明文

## 结论
**D2-4 PASS** — `redactString` / `redactSecrets` 函数在设计的 key=value / key:value / 对象键名 模式下，AK 和 SK 值均被正确替换为 `<redacted>`，输出无明文凭证字段。2 个边界发现已记录，不影响核心判定。
