// probe for D4-1 - executed 20261110210807
// Tests via source-level function import from hdk
// status=PASS: classifyTextCommand(cat creds): decision=deny
import { writeFileSync } from 'fs';
// Result: {"caseId":"D4-1","status":"PASS","why":"classifyTextCommand(cat creds): decision=deny","executedAt":"20261110210807","result":{"decision":"deny","risk":"credential","reason":"Reading Huawei Cloud cred
