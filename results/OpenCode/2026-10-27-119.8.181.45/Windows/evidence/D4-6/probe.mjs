// Source-level probe for D4-6
// Tests redactString with adminPass=xxx
import { redactString } from 'safety-policy.mjs';
const r = redactString('adminPass=MySecret123');
