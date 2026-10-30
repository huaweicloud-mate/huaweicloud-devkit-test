// probe for D4-7 - executed 20261030210946
// status=FAIL: curl|bash not blocked (decision=allow), shell injection via pipe not caught
import { writeFileSync } from 'fs';
// Result: {"caseId":"D4-7","status":"FAIL","why":"curl|bash not blocked (decision=allow), shell injection via pipe not caught","executedAt":"20261030210946","decisions":[{"cmd":"rm -rf /","decision":"deny"},{"c
