// probe for D4-21 - executed 20261030210613
// Tests via source-level function import from hdk
// status=PASS: broad IAM artifact: decision=deny, findings=1
import { writeFileSync } from 'fs';
// Result: {"caseId":"D4-21","status":"PASS","why":"broad IAM artifact: decision=deny, findings=1","executedAt":"20261030210613","result":{"decision":"deny","findings":[{"ruleId":"hwc-iam-admin-policy","title":"
