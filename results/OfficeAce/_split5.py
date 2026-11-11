# -*- coding: utf-8 -*-
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
t = io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src\mcp-server.mjs', encoding='utf-8', errors='replace').read()
lines = t.splitlines()
head = '\n'.join(lines[:60])
tail = '\n'.join(lines[-60:])
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_mcpserver.txt','w',encoding='utf-8').write(head + '\n...\n' + tail)
print('ok')
