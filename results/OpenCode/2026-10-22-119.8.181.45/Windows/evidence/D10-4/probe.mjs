// D10-4 safety intervention - credential file read
const r = await server.call('huaweicloud_hook_check_command', {command:'cat ~/.config/huaweicloud/credentials.json'});
console.log(r.result.content[0].text);
