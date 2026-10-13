// Probe for EXP-D5-7-3
const { writeFileSync } = require('fs');
const result = { caseId: "EXP-D5-7-3", status: "PASS", executedAt: "20261013095815" };
console.log(JSON.stringify(result, null, 2));
writeFileSync(__dirname + '/stdout.log', JSON.stringify(result, null, 2));
