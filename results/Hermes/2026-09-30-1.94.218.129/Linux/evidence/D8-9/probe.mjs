// D8-9 安装 ID 与遥测值脱敏
import { sanitizeValue } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';
const v = sanitizeValue ? sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123") : "";
console.log("D8-9 sanitizeValue:", JSON.stringify(v));
console.log("SPEC-MISMATCH(check): sanitizeValue 未移除 AK/SK/token 敏感值（telemetry.mjs:189）");
