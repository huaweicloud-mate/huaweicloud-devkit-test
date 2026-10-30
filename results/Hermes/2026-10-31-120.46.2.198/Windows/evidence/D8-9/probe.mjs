// D8-9 缺陷复核探针（1.1.13-next.0）
// 根因: telemetry/telemetry.mjs:190-196 sanitizeValue 仅 trim/截断/去控制字符
// 断言见 stdout.log