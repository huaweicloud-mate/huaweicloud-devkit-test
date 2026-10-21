// D1-39 Windows upgrade detection chain
const dt = queryDistTagsSync({timeoutMs:10000});
const v = readInstalledVersion();
console.log('installed:', v, 'distTags:', dt);
