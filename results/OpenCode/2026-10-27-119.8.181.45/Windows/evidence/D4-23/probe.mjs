// Source-level probe for D4-23
// Reads huawei-agent-rules.mdc and checks for MUST constraints
import { readFileSync } from 'node:fs';
const rules = readFileSync('huawei-agent-rules.mdc', 'utf8');
