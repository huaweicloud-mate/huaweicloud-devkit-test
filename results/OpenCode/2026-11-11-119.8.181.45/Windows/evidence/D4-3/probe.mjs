// calls huaweicloud_hook_check_command for create-secret APIs
const s=...MCP...;
for (const c of ["hcloud IAM CreatePermanentAccessKey --user_name t --cli-output-output-file=creds.txt","hcloud IAM CreateTemporaryAccessKeyByAgency --agency_name a","hcloud KMS CreateKey --key_alias x"]) console.log((await s.rpc('tools/call',{name:'huaweicloud_hook_check_command',arguments:{command:c}})).result);
