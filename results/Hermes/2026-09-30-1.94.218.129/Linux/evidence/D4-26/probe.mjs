// D4-26 findings 证据脱敏
import { redactEvidence } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const ev = redactEvidence ? redactEvidence({ evidence: "hcloud create --ak AK123456789 sk=SKsecret123" }) : null;
console.log("D4-26 redactEvidence:", JSON.stringify(ev));
console.log("FAIL(check): --ak/sk= 明文残留（redactEvidence 正则未覆盖空格分隔与小写 sk=）");
