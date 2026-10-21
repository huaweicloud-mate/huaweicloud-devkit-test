// D1-42 dismiss persistence
const f = resolveSkipFilePath('test');
writeSkipState(f, '1.1.10');
const r = readSkipState(f);
console.log(JSON.stringify(r));
