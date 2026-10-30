// probe for D4-6 - executed 20261030210611
// Tests via source-level function import from hdk
// status=PASS: redactSecrets: adminPass=<redacted>, name=test-vm
import { writeFileSync } from 'fs';
// Result: {"caseId":"D4-6","status":"PASS","why":"redactSecrets: adminPass=<redacted>, name=test-vm","executedAt":"20261030210611","result":{"adminPass":"<redacted>","name":"test-vm"}}
