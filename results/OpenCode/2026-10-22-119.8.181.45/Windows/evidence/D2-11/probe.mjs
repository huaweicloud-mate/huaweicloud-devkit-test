// D2-11 R3 STS token no disk write
setRuntimeCredentials('AK','SK','STS','cn-north-4');
console.log('hasRuntime:', hasRuntimeCredentials());
clearRuntimeCredentials();
console.log('cleared:', !hasRuntimeCredentials());
