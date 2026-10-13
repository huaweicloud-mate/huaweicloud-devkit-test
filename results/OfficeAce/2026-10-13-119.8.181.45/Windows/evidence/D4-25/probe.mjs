// Probe for D4-25
const { writeFileSync } = require('fs');
const result = { caseId: "D4-25", status: "BLOCKED", executedAt: "20261013095815" };
console.log(JSON.stringify(result, null, 2));
writeFileSync(__dirname + '/stdout.log', JSON.stringify(result, null, 2));
