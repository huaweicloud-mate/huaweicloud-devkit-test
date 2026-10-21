// D2-5 missing credential guidance
const r = resolveCredentialsWithRuntime({allowMissing:true});
console.log(JSON.stringify(r)?.slice(0,200));
