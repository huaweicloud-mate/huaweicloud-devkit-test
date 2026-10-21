// D1-65 debug env var
process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE='1';
const r = judgeUpdate('1.1.9', {latest:'1.1.10'});
console.log('skip result:', r.result);
