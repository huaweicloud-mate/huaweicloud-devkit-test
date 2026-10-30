// probe for D4-1 - executed 20261030210611
// Tests via source-level function import from hdk
// status=PASS: classifyTextCommand(cat creds): decision=deny
import { writeFileSync } from 'fs';
// Result: {"caseId":"D4-1","status":"PASS","why":"classifyTextCommand(cat creds): decision=deny","executedAt":"20261030210611","result":{"decision":"deny","risk":"credential","reason":"Reading Huawei Cloud cred
