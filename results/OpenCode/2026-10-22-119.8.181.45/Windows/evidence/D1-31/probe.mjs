// D1-31 dismiss cooldown
const skip = {expireAt: new Date(Date.now()+3*86400000).toISOString(), dismissedVersion:'1.1.10'};
const r = judgeUpdate('1.1.9', {latest:'1.1.10'}, skip);
console.log(JSON.stringify(r));
