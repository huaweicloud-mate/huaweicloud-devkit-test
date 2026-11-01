import re
c = open(r'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/scripts/_batch_runner_officeace_20261101.mjs', encoding='utf-8').read()
ids = re.findall(r"writeResult\(\s*'([^']+)'", c)
print(len(ids))
print(sorted(set(ids)))
ordered = re.findall(r"writeResult\(\s*'([^']+)'", c)
print('ordered count', len(ordered))