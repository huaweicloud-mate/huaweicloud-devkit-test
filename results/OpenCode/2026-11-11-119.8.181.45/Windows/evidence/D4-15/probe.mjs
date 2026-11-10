// huaweicloud_hook_check_command case/space variants
const s=...MCP...; for (const c of ["hcloud ECS Deleteserver --server_id x","hcloud ECS DELETESERVER --server_id x","hcloud ECS delete servers","hcloud ECS DeleteServers --server_id x"]) await s.rpc('tools/call',{name:'huaweicloud_hook_check_command',arguments:{command:c}});
