// D2-16 import file read then wipe
// auth_switch mode=import reads ~/.config/huaweicloud/creds-import.json then deletes
console.log('import path:', 'C:/Users/Administrator/.config/huaweicloud/creds-import.json');
console.log('exists:', require('fs').existsSync('C:/Users/Administrator/.config/huaweicloud/creds-import.json'));
