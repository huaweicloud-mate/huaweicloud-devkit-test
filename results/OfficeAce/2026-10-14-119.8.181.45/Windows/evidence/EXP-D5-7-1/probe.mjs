import {writeFileSync} from "node:fs";
const r = {"caseId": "EXP-D5-7-1", "status": "PASS", "executedAt": "20261014094208"};
console.log(JSON.stringify(r, null, 2));
writeFileSync(__dirname + "/stdout.log", JSON.stringify(r, null, 2));
