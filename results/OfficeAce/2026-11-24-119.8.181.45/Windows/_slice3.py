# -*- coding: utf-8 -*-
import io, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = io.open('_design_full.txt', encoding='utf-8').read()
def cut(a, b, name):
    i = s.find('=== ' + a)
    j = s.find('=== ' + b) if b else len(s)
    io.open(name, 'w', encoding='utf-8').write(s[i:j])
    print(name, i, j)
cut('D1-39', 'D2-13', '_d9.txt')
cut('D2-16', 'D4-18', '_d10.txt')
cut('D2-1', 'D2-16', '_d11.txt')
cut('D2-26', 'D3-C14', '_d12.txt')
cut('D3-A1', 'D3-S1', '_d13.txt')
cut('D3-S5', 'D4-13', '_d14.txt')
cut('D4-13', 'D4-14', '_d15.txt')
cut('D4-24', 'D5-1', '_d16.txt')
cut('D5-1', 'D6-1', '_d17.txt')
cut('D6-1', 'D9-9', '_d18.txt')
