Plaintext secret API interception:
Command: hcloud ECS CreateServers --adminPass Password123! --ak AKEXAMPLE --sk SKEXAMPLE
Decision: allow
Findings: 0
Note: No risk rule covers --adminPass or --ak/--sk in hcloud command arguments.
hwc-command-secret-value-read only covers ShowSecretVersion/DownloadSecret/GetSecretValue.
This is a REAL DEFECT: plaintext AK/SK/adminPass in hcloud args not intercepted.