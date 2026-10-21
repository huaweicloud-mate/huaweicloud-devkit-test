// D1-41 check_update MCP return contract
const r = judgeUpdate('1.1.10', {latest:'1.1.10',next:'1.1.10-next.4'});
console.log(JSON.stringify(r));
