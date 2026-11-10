// probe for D4-17 - executed 20261110210809
// Tests via source-level function import from hdk
// status=PASS: empty input: decision=deny
import { writeFileSync } from 'fs';
// Result: {"caseId":"D4-17","status":"PASS","why":"empty input: decision=deny","executedAt":"20261110210809","result":{"decision":"deny","risk":"invalid","reason":"command must be a non-empty string.","blockedB
