// D1-45 cache warmup race
invalidateUpdateCache();
const peek = peekCachedUpdateInfo();
const r = judgeUpdate('1.1.10', {latest:'1.1.10'});
console.log('peek:', peek, 'result:', r.result);
