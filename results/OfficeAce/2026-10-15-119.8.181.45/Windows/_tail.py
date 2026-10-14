import io
t=io.open('_full.txt',encoding='utf-8').read()
i=t.index('=== 设计级完整')
io.open('_tail.txt','w',encoding='utf-8').write(t[i:])
print('done')