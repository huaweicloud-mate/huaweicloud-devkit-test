import os
for root, dirs, files in os.walk('.'):
    dirs.sort(); files.sort()
    for f in files:
        p = os.path.join(root, f)
        print('%7d  %s' % (os.path.getsize(p), p))