// D4-27: Dual path redaction
import { redactSecrets, redactOutput } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
const text = 'AK=ABCDE12345FGHIJ SK=Zyxwv1234 password=admin@123';
console.log('redactSecrets:', redactSecrets(text));
console.log('redactOutput:', redactOutput(text));
