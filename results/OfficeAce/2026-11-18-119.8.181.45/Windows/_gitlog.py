import subprocess, os, sys
os.environ['PATH'] = r'C:\Users\Administrator\.workbuddy\binaries\PortableGit\versions\1.3.0\cmd;' + os.environ['PATH']
repo = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
out = subprocess.run(['git', '-C', repo, 'log', '--oneline', '-8', '--', 'results/OfficeAce'], capture_output=True, text=True)
sys.stdout.reconfigure(encoding='utf-8')
print(out.stdout, out.stderr)
